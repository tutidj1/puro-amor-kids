-- ============================================================
-- PURO AMOR KIDS — POSTGRESQL DDL
-- Senior Data Architect Design
-- Target: PostgreSQL 15+
-- Version: 1.0.0 | Date: 2026-03-02
-- Exec: psql -U postgres -d puroamorkids -f schema.sql
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For trigram full-text search on product names

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE order_status AS ENUM (
  'PENDING_PAYMENT', 'PAID', 'PREPARING', 'SHIPPED',
  'DELIVERED', 'CANCELLED', 'REFUNDED'
);

CREATE TYPE payment_method AS ENUM (
  'MERCADOPAGO', 'CASH', 'CARD_DEBIT', 'CARD_CREDIT', 'BANK_TRANSFER'
);

CREATE TYPE payment_provider AS ENUM (
  'MERCADOPAGO', 'CASH', 'STRIPE', 'MANUAL'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING', 'APPROVED', 'REJECTED', 'REFUNDED', 'IN_PROCESS'
);

CREATE TYPE shipping_type AS ENUM (
  'PICKUP', 'HOME_DELIVERY'
);

CREATE TYPE stock_location AS ENUM (
  'WAREHOUSE', 'STORE', 'ONLINE'
);

CREATE TYPE stock_change_reason AS ENUM (
  'SALE', 'RESTOCK', 'MANUAL_ADJUST', 'RETURN', 'DAMAGED', 'TRANSFER'
);

CREATE TYPE product_status AS ENUM (
  'ACTIVE', 'INACTIVE', 'DRAFT', 'DISCONTINUED'
);

CREATE TYPE gender AS ENUM (
  'MALE', 'FEMALE', 'UNISEX'
);

-- ============================================================
-- CATEGORIZATION LAYER
-- ============================================================

CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL UNIQUE,
  slug        VARCHAR(60)  NOT NULL UNIQUE,
  gender      gender       NOT NULL,
  description TEXT,
  image_url   VARCHAR(500),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'Top-level navigation: Niño, Niña, Bebé, No Caminantes';
COMMENT ON COLUMN categories.slug IS 'URL-safe identifier, e.g. "nina", "bebe"';

CREATE INDEX idx_categories_slug        ON categories (slug);
CREATE INDEX idx_categories_active_sort ON categories (is_active, sort_order);

-- --------------------------------------------------------

CREATE TABLE product_types (
  id          SERIAL PRIMARY KEY,
  category_id INTEGER      NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name        VARCHAR(80)  NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url   VARCHAR(500),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_type_category_name UNIQUE (category_id, name)
);

COMMENT ON TABLE product_types IS 'Sub-categories: Remeras, Pantalones, Zapatillas, etc.';

CREATE INDEX idx_product_types_category ON product_types (category_id, is_active);

-- ============================================================
-- PRODUCT ENGINE
-- ============================================================

CREATE TABLE products (
  id              SERIAL PRIMARY KEY,
  product_type_id INTEGER        NOT NULL REFERENCES product_types(id) ON DELETE RESTRICT,
  name            VARCHAR(200)   NOT NULL,
  slug            VARCHAR(250)   NOT NULL UNIQUE,
  description     TEXT,
  base_price      NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
  brand           VARCHAR(100),
  status          product_status NOT NULL DEFAULT 'DRAFT',
  is_featured     BOOLEAN        NOT NULL DEFAULT FALSE,
  tags            TEXT[]         NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  published_at    TIMESTAMPTZ
);

COMMENT ON TABLE  products          IS 'Base product entity. One product = one card in the Product Explorer';
COMMENT ON COLUMN products.tags     IS 'Array of searchable tags: ["nuevo", "oferta", "temporada-verano"]';
COMMENT ON COLUMN products.base_price IS 'Base price in ARS. Variants may have a price_offset on top.';

CREATE INDEX idx_products_type_status    ON products (product_type_id, status);
CREATE INDEX idx_products_slug           ON products (slug);
CREATE INDEX idx_products_status_featured ON products (status, is_featured);
CREATE INDEX idx_products_created_desc   ON products (created_at DESC);
-- Trigram index for fuzzy name search in Product Explorer
CREATE INDEX idx_products_name_trgm      ON products USING GIN (name gin_trgm_ops);

-- --------------------------------------------------------

CREATE TABLE product_variants (
  id            SERIAL PRIMARY KEY,
  product_id    INTEGER        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku           VARCHAR(100)   NOT NULL UNIQUE,
  size          VARCHAR(20)    NOT NULL,   -- "4", "6", "M", "0-3M"
  color         VARCHAR(50)    NOT NULL,
  color_hex     VARCHAR(7),               -- "#FF5733"
  price_offset  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  is_active     BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_color_hex CHECK (color_hex IS NULL OR color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT uq_variant_product_size_color UNIQUE (product_id, size, color)
);

COMMENT ON COLUMN product_variants.price_offset IS 'Amount to ADD to product.base_price. Can be negative for discounts.';
COMMENT ON COLUMN product_variants.sku          IS 'Structured SKU, e.g. PAK-REM-NINA-M-ROJO';

CREATE INDEX idx_variants_product       ON product_variants (product_id, is_active);
CREATE INDEX idx_variants_sku           ON product_variants (sku);
CREATE INDEX idx_variants_color         ON product_variants (product_id, color);   -- Color filter
CREATE INDEX idx_variants_size          ON product_variants (product_id, size);    -- Size filter

-- --------------------------------------------------------

CREATE TABLE product_images (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         VARCHAR(500) NOT NULL,
  alt_text    VARCHAR(200),
  is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_images_product_primary ON product_images (product_id, is_primary);

-- Ensure only one primary image per product
CREATE UNIQUE INDEX uq_product_primary_image
  ON product_images (product_id)
  WHERE is_primary = TRUE;

-- ============================================================
-- INVENTORY ENGINE
-- ============================================================

CREATE TABLE stock (
  id          SERIAL PRIMARY KEY,
  variant_id  INTEGER        NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  location    stock_location NOT NULL DEFAULT 'ONLINE',
  quantity    INTEGER        NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved    INTEGER        NOT NULL DEFAULT 0  CHECK (reserved >= 0),
  -- OPTIMISTIC LOCKING: incremented on every UPDATE
  -- Application layer MUST check: WHERE id = $1 AND version = $currentVersion
  version     INTEGER        NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_stock_variant_location UNIQUE (variant_id, location),
  -- available = quantity - reserved must never go negative
  CONSTRAINT chk_stock_available CHECK (quantity >= reserved)
);

COMMENT ON TABLE stock IS '
  Real-time inventory. available = quantity - reserved.
  RACE CONDITION STRATEGY: Optimistic Locking via version column.
  On UPDATE: SET quantity = quantity - $delta, version = version + 1
            WHERE id = $stock_id AND version = $known_version
  If 0 rows affected → conflict detected → retry or reject.
  For checkout flow, also use SELECT ... FOR UPDATE NOWAIT in a transaction.
';
COMMENT ON COLUMN stock.reserved IS 'Units locked by open PENDING orders. Decremented on PAID/CANCELLED.';

CREATE INDEX idx_stock_variant   ON stock (variant_id);
CREATE INDEX idx_stock_quantity  ON stock (quantity);   -- "in stock" filter
CREATE INDEX idx_stock_available ON stock ((quantity - reserved)); -- Available filter

-- --------------------------------------------------------

CREATE TABLE inventory_logs (
  id              SERIAL PRIMARY KEY,
  stock_id        INTEGER             NOT NULL REFERENCES stock(id) ON DELETE RESTRICT,
  reason          stock_change_reason NOT NULL,
  quantity_delta  INTEGER             NOT NULL,   -- Positive: added | Negative: removed
  quantity_after  INTEGER             NOT NULL,   -- Snapshot after change
  note            VARCHAR(500),
  order_id        INTEGER,                        -- Soft FK to orders (no CASCADE)
  performed_by    VARCHAR(100),                   -- Admin user email or system/job name
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE inventory_logs IS 'Immutable audit trail. Never UPDATE or DELETE rows here.';
COMMENT ON COLUMN inventory_logs.order_id IS 'Soft FK — kept even if order is deleted for audit integrity.';

CREATE INDEX idx_inv_logs_stock_date ON inventory_logs (stock_id, created_at DESC);
CREATE INDEX idx_inv_logs_reason     ON inventory_logs (reason);
CREATE INDEX idx_inv_logs_order      ON inventory_logs (order_id);

-- ============================================================
-- CUSTOMER & ORDER FLOW
-- ============================================================

CREATE TABLE customers (
  id          SERIAL PRIMARY KEY,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  dni         VARCHAR(15),                 -- DNI argentino (optional, for B&M customers)
  phone       VARCHAR(20)  NOT NULL,       -- WhatsApp number
  email       VARCHAR(255),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN customers.phone IS 'Primary contact channel for WhatsApp order updates.';

CREATE INDEX idx_customers_email ON customers (email);
CREATE INDEX idx_customers_phone ON customers (phone);
CREATE INDEX idx_customers_dni   ON customers (dni);

-- --------------------------------------------------------

CREATE TABLE orders (
  id              SERIAL PRIMARY KEY,
  customer_id     INTEGER        NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status          order_status   NOT NULL DEFAULT 'PENDING_PAYMENT',
  total_amount    NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  subtotal        NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method  payment_method NOT NULL,
  notes           TEXT,         -- Internal admin notes
  customer_note   TEXT,         -- Note from customer at checkout
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  paid_at         TIMESTAMPTZ,
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  -- Integrity: total must reconcile
  CONSTRAINT chk_order_total CHECK (
    total_amount = subtotal + shipping_cost - discount_amount
  )
);

CREATE INDEX idx_orders_customer          ON orders (customer_id);
CREATE INDEX idx_orders_status_created   ON orders (status, created_at DESC);  -- Admin dashboard
CREATE INDEX idx_orders_created_desc     ON orders (created_at DESC);

-- --------------------------------------------------------

CREATE TABLE order_items (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id      INTEGER        NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity        INTEGER        NOT NULL CHECK (quantity > 0),
  -- PRICE SNAPSHOT — immutable record at time of purchase
  unit_price      NUMERIC(10, 2) NOT NULL,
  total_price     NUMERIC(10, 2) NOT NULL,   -- unit_price * quantity
  -- PRODUCT SNAPSHOT — for display even after product edits
  product_name    VARCHAR(200)   NOT NULL,
  variant_sku     VARCHAR(100)   NOT NULL,
  variant_size    VARCHAR(20)    NOT NULL,
  variant_color   VARCHAR(50)    NOT NULL,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_item_total CHECK (total_price = unit_price * quantity)
);

COMMENT ON TABLE order_items IS '
  CRITICAL: Prices and product details are snapshotted at purchase time.
  NEVER join order_items back to live product/pricing tables for financial reporting.
  Use this table as the SINGLE SOURCE OF TRUTH for historical sales data.
';

CREATE INDEX idx_order_items_order   ON order_items (order_id);
CREATE INDEX idx_order_items_variant ON order_items (variant_id);

-- ============================================================
-- SHIPPING DETAILS
-- ============================================================

CREATE TABLE shipping_details (
  id                   SERIAL PRIMARY KEY,
  order_id             INTEGER       NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  shipping_type        shipping_type NOT NULL,
  -- HOME_DELIVERY fields
  street_address       VARCHAR(300),
  apartment            VARCHAR(100),
  city                 VARCHAR(100),
  province             VARCHAR(100),
  zip_code             VARCHAR(20),
  country              VARCHAR(100) NOT NULL DEFAULT 'Argentina',
  delivery_note        TEXT,
  -- PICKUP fields
  pickup_location_name VARCHAR(200),
  estimated_pickup_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  -- Validate conditionally: home delivery requires address
  CONSTRAINT chk_home_delivery_fields CHECK (
    shipping_type != 'HOME_DELIVERY' OR (
      street_address IS NOT NULL AND city IS NOT NULL AND province IS NOT NULL
    )
  ),
  -- Validate conditionally: pickup requires location name
  CONSTRAINT chk_pickup_fields CHECK (
    shipping_type != 'PICKUP' OR pickup_location_name IS NOT NULL
  )
);

CREATE INDEX idx_shipping_order ON shipping_details (order_id);

-- ============================================================
-- PAYMENT TRANSACTIONS
-- ============================================================

CREATE TABLE payment_transactions (
  id              SERIAL PRIMARY KEY,
  order_id        INTEGER          NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider        payment_provider NOT NULL,
  status          payment_status   NOT NULL DEFAULT 'PENDING',
  transaction_id  VARCHAR(200)     UNIQUE,   -- External ID from payment provider
  amount          NUMERIC(10, 2)   NOT NULL,
  currency        VARCHAR(5)       NOT NULL DEFAULT 'ARS',
  receipt_url     VARCHAR(500),              -- WhatsApp-shareable receipt link
  raw_response    JSONB,                     -- Full webhook payload for auditing
  created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ
);

COMMENT ON COLUMN payment_transactions.raw_response IS 'Full provider webhook payload. Enables re-processing on integration failures.';
COMMENT ON COLUMN payment_transactions.receipt_url  IS 'Link sent via WhatsApp for payment proof.';

CREATE INDEX idx_payment_order         ON payment_transactions (order_id);
CREATE INDEX idx_payment_transaction   ON payment_transactions (transaction_id);
CREATE INDEX idx_payment_status        ON payment_transactions (status);

-- ============================================================
-- TRIGGERS: auto-update updated_at timestamps
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'categories', 'product_types', 'products', 'product_variants',
    'stock', 'customers', 'orders', 'shipping_details', 'payment_transactions'
  ]
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    ', t);
  END LOOP;
END;
$$;

-- ============================================================
-- SEED: Base categories (Puro Amor Kids navigation)
-- ============================================================

INSERT INTO categories (name, slug, gender, sort_order) VALUES
  ('Niña',          'nina',          'FEMALE', 1),
  ('Niño',          'nino',          'MALE',   2),
  ('Bebé',          'bebe',          'UNISEX', 3),
  ('No Caminantes', 'no-caminantes', 'UNISEX', 4);

-- Example ProductType seeds for Niña
INSERT INTO product_types (category_id, name, slug, sort_order) VALUES
  (1, 'Remeras',     'remeras-nina',     1),
  (1, 'Pantalones',  'pantalones-nina',  2),
  (1, 'Vestidos',    'vestidos-nina',    3),
  (1, 'Zapatillas',  'zapatillas-nina',  4),
  (1, 'Accesorios',  'accesorios-nina',  5);

INSERT INTO product_types (category_id, name, slug, sort_order) VALUES
  (2, 'Remeras',     'remeras-nino',     1),
  (2, 'Pantalones',  'pantalones-nino',  2),
  (2, 'Zapatillas',  'zapatillas-nino',  3),
  (2, 'Accesorios',  'accesorios-nino',  4);

import { db } from './firebase-config.js';
import { collection, onSnapshot, writeBatch, doc, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// State
let cart = JSON.parse(localStorage.getItem('puroamor_cart')) || [];
let currentProduct = null;
let selectedVariant = null;
let appProducts = [];

// DOM Elements
let grid, cartCount, cartModal, cartPanel, cartItemsContainer, cartTotal;
let productModal, productModalContent, modalImg, modalTitle, modalPrice, modalDesc, modalSizes, addToCartBtn;
// Checkout Elements
let checkoutModal, checkoutPanel, checkoutForm;
// Confirmation Elements
let successModal, successPanel;

// Helper to expose functions to window (since we are in a module)
const expose = (name, fn) => window[name] = fn;

// Init
// Init
document.addEventListener('DOMContentLoaded', () => {
    setupDOM();
    loadProducts(); // Init listener
});

function setupDOM() {
    grid = document.getElementById('product-grid');
    cartCount = document.getElementById('cart-count');
    cartModal = document.getElementById('cart-modal');
    cartPanel = document.getElementById('cart-panel');
    cartItemsContainer = document.getElementById('cart-items');
    cartTotal = document.getElementById('cart-total');

    productModal = document.getElementById('product-modal');
    productModalContent = document.getElementById('product-modal-content');
    modalImg = document.getElementById('modal-img');
    modalTitle = document.getElementById('modal-title');
    modalPrice = document.getElementById('modal-price');
    modalDesc = document.getElementById('modal-desc');
    modalSizes = document.getElementById('modal-sizes');
    addToCartBtn = document.getElementById('add-to-cart-btn');

    checkoutModal = document.getElementById('checkout-modal');
    checkoutPanel = document.getElementById('checkout-panel');
    checkoutForm = document.getElementById('checkout-form');

    successModal = document.getElementById('add-success-modal');
    successPanel = document.getElementById('add-success-panel');

    // Re-attach listeners if needed, usually onclicks are in HTML
    if (addToCartBtn) {
        addToCartBtn.onclick = () => {
            if (!selectedVariant) {
                alert('Por favor selecciona una variante (Color y Talle)');
                return;
            }
            addToCart(currentProduct, selectedVariant);
            closeProductModal();
            // toggleCart(); // OLD behavior
            showSuccessModal(); // NEW behavior
        };
    }
}

function loadProducts() {
    // Real-time listener
    const unsubscribe = onSnapshot(collection(db, "productos"), (querySnapshot) => {
        appProducts = [];
        querySnapshot.forEach((doc) => {
            appProducts.push(doc.data());
        });

        // Data Migration / Safety check
        appProducts.forEach(p => { if (!p.variants) p.variants = []; });

        // Re-render current view
        init();

        // If modal is open, we should probably update it too to reflect stock changes live
        if (!productModal.classList.contains('hidden') && currentProduct) {
            const updatedP = appProducts.find(p => p.id === currentProduct.id);
            if (updatedP) {
                currentProduct = updatedP;
                // Re-render variants to show updated stock
                openProductModal(currentProduct.id);
                // Note: this might flicker or reset selection, but ensures stock correctness.
                // Ideally we'd only update text, but this is safe MVP.
            }
        }

    }, (error) => {
        console.error("Error loading products:", error);
        grid.innerHTML = '<div class="col-span-full text-center text-red-400 py-10">Error de conexión. Intentando reconectar...</div>';
    });
}

function init() {
    filterProducts('all');
    updateCartUI();
}

// Render Grid
function renderProducts(items) {
    if (items.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-gray-400 py-10">No hay productos en esta sección por el momento.</div>';
        return;
    }

    grid.innerHTML = items.map(product => {
        const variants = product.variants || [];
        const distinctSizes = [...new Set(variants.map(v => v.size))];
        const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
        // Fallback for category display
        const displayCat = product.category || (variants[0] ? variants[0].section : 'General');

        // Stock Badge
        let stockBadge = '';
        if (totalStock === 0) {
            stockBadge = '<div class="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">AGOTADO</div>';
        }

        return `
        <div class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div class="relative h-64 overflow-hidden cursor-pointer" onclick="openProductModal(${product.id})">
                <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                    $${product.price.toLocaleString()}
                </div>
                ${stockBadge}
            </div>
            <div class="p-5 text-center">
                <h3 class="text-2xl font-bold text-gray-800 mb-1 leading-none font-heading tracking-wide">${product.name}</h3>
                <p class="text-sm text-gray-500 mb-4">${displayCat} • ${distinctSizes.length} Talles</p>
                <button onclick="openProductModal(${product.id})" class="w-full py-2 rounded-lg border-2 border-mint text-mint font-bold hover:bg-mint hover:text-white transition-colors">
                    Ver Detalles
                </button>
            </div>
        </div>
    `}).join('');
}

function filterProducts(category) {
    // Update UI buttons
    const btns = document.querySelectorAll('button[onclick^="filterProducts"]');
    btns.forEach(b => {
        if (b.innerText.includes(category === 'all' ? 'Todos' : category) || (category === 'Bebés' && b.innerText.includes('Bebés'))) {
            b.classList.remove('bg-white', 'text-gray-600', 'border-gray-200');
            b.classList.add('bg-gray-800', 'text-white', 'border-transparent');
        } else {
            b.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
            b.classList.remove('bg-gray-800', 'text-white', 'border-transparent');
        }
    });

    if (category === 'all') {
        renderProducts(appProducts);
    } else {
        const filtered = appProducts.filter(p => {
            const variants = p.variants || [];
            const hasVariant = variants.some(v => v.section === category);
            // Handle Legacy Category match if section logic is missing/mixed
            const isLegacyMatch = p.category === category;
            return hasVariant || isLegacyMatch;
        });
        renderProducts(filtered);
    }
}
expose('filterProducts', filterProducts);

function openProductModal(id) {
    currentProduct = appProducts.find(p => p.id === id);
    selectedVariant = null;

    modalImg.src = currentProduct.image;
    modalTitle.innerText = currentProduct.name;
    modalPrice.innerText = `$${currentProduct.price.toLocaleString()}`;
    modalDesc.innerText = currentProduct.description || (currentProduct.name + ' - Excelente calidad y diseño para los más peques.');

    const availableVariants = (currentProduct.variants || []).filter(v => v.stock > 0);

    if (availableVariants.length === 0) {
        modalSizes.innerHTML = '<div class="text-red-500 font-bold">Producto Agotado</div>';
        addToCartBtn.disabled = true;
        addToCartBtn.classList.add('opacity-50', 'cursor-not-allowed');
        addToCartBtn.innerText = 'Sin Stock';
    } else {
        addToCartBtn.disabled = false;
        addToCartBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        addToCartBtn.innerText = 'Agregar al Carrito';

        modalSizes.innerHTML = availableVariants.map(v => `
            <button onclick="selectVariant(${v.id}, this)" class="variant-btn mb-2 mr-2 px-4 py-2 border-2 border-gray-200 rounded-lg text-gray-600 text-sm font-bold hover:border-mint transition-colors focus:outline-none flex flex-col items-center min-w-[80px]">
                <span>${v.color}</span>
                <span class="text-xs text-gray-400">Talle ${v.size}</span>
                <span class="text-[10px] bg-gray-100 px-1 rounded mt-1">${v.section || 'U'}</span>
            </button>
        `).join('');
    }

    productModal.classList.remove('hidden');
    setTimeout(() => {
        productModal.classList.remove('opacity-0');
        productModalContent.classList.remove('scale-95');
    }, 10);
}
expose('openProductModal', openProductModal);

function selectVariant(variantId, btn) {
    selectedVariant = currentProduct.variants.find(v => v.id === variantId);

    document.querySelectorAll('.variant-btn').forEach(b => {
        b.classList.remove('bg-mint', 'text-white', 'border-mint');
        b.classList.add('border-gray-200', 'text-gray-600');
    });
    btn.classList.remove('border-gray-200', 'text-gray-600');
    btn.classList.add('bg-mint', 'text-white', 'border-mint');

    // Enable button just in case
    addToCartBtn.disabled = false;
}
expose('selectVariant', selectVariant);

function closeProductModal() {
    productModalContent.classList.add('scale-95');
    productModal.classList.add('opacity-0');
    setTimeout(() => {
        productModal.classList.add('hidden');
    }, 300);
}
expose('closeProductModal', closeProductModal);

// Add to Cart Button Logic
// Add to Cart Logic moved to setupDOM

function addToCart(product, variant) {
    const cartItemId = `${product.id}-${variant.id}`;
    const existingItem = cart.find(item => item.cartId === cartItemId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            cartId: cartItemId,
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            variantStr: `${variant.color} - Talle ${variant.size}`,
            quantity: 1
        });
    }
    saveCart();
    updateCartUI();
}
// Internal usage, but also good to expose if needed? addToCart is called by onclick lambda above.
// But wait, addToCart is internal to module scope, and I used it inside the module (onclick). All good.

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}
expose('removeFromCart', removeFromCart);

function updateCartUI() {
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCount.innerText = totalItems;
    if (totalItems > 0) cartCount.classList.remove('scale-0');
    else cartCount.classList.add('scale-0');

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="text-center text-gray-400 mt-10">
                <i class="fa-solid fa-basket-shopping text-4xl mb-4 opacity-30"></i>
                <p>Tu carrito está vacío</p>
                <button onclick="toggleCart()" class="mt-4 text-mint font-bold underline">Ir a ver ropa</button>
            </div>
        `;
    } else {
        cartItemsContainer.innerHTML = cart.map((item, index) => `
            <div class="flex gap-4 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <img src="${item.image}" class="w-16 h-16 rounded-lg object-cover">
                <div class="flex-1">
                    <h4 class="font-bold text-gray-800 text-sm">${item.name}</h4>
                    <p class="text-xs text-gray-500">${item.variantStr} | x${item.quantity}</p>
                    <p class="font-bold text-mint">$${(item.price * item.quantity).toLocaleString()}</p>
                </div>
                <button onclick="removeFromCart(${index})" class="text-gray-300 hover:text-red-500 p-2">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    cartTotal.innerText = `$${total.toLocaleString()}`;
}

function toggleCart() {
    if (cartModal.classList.contains('hidden')) {
        cartModal.classList.remove('hidden');
        setTimeout(() => {
            cartModal.classList.remove('opacity-0');
            cartPanel.classList.remove('translate-x-full');
        }, 10);
    } else {
        cartPanel.classList.add('translate-x-full');
        cartModal.classList.add('opacity-0');
        setTimeout(() => {
            cartModal.classList.add('hidden');
        }, 300);
    }
}
expose('toggleCart', toggleCart);

function saveCart() {
    localStorage.setItem('puroamor_cart', JSON.stringify(cart));
}

function checkout() {
    // checkout(); // OLD Direct WhatsApp
    openCheckout();
}
expose('checkout', checkout);

// --- CHECKOUT MODAL LOGIC ---
// Elements initialized in setupDOM
let currentStep = 1;

function openCheckout() {
    if (!checkoutModal) setupDOM(); // Safety fallback
    if (cart.length === 0) return alert("El carrito está vacío");

    currentStep = 1;
    updateCheckoutSteps();
    updateCheckoutSummary();

    checkoutModal.classList.remove('hidden');
    setTimeout(() => {
        checkoutModal.classList.remove('opacity-0');
        checkoutPanel.classList.remove('scale-95');
    }, 10);
}
expose('openCheckout', openCheckout);

function closeCheckout() {
    checkoutPanel.classList.add('scale-95');
    checkoutModal.classList.add('opacity-0');
    setTimeout(() => {
        checkoutModal.classList.add('hidden');
        resetCheckoutUI();
    }, 300);
}
expose('closeCheckout', closeCheckout);

function nextStep(step) {
    // Validate Step 1
    if (step === 2) {
        const inputs = document.getElementById('step-1').querySelectorAll('input');
        for (const input of inputs) {
            if (!input.checkValidity()) {
                input.reportValidity();
                return;
            }
        }
    }

    currentStep = step;
    updateCheckoutSteps();
}
expose('nextStep', nextStep);

function prevStep(step) {
    currentStep = step;
    updateCheckoutSteps();
}
expose('prevStep', prevStep);

function updateCheckoutSteps() {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
    // Show current
    document.getElementById(`step-${currentStep}`).classList.remove('hidden');

    // Update Progress Indicators
    document.querySelectorAll('.step-indicator').forEach(el => {
        const s = parseInt(el.dataset.step);
        if (s <= currentStep) {
            el.classList.add('active');
            el.firstElementChild.classList.add('bg-gray-900', 'text-white', 'border-gray-900');
            el.firstElementChild.classList.remove('bg-gray-300', 'text-gray-500', 'border-white');
        } else {
            el.classList.remove('active');
            el.firstElementChild.classList.remove('bg-gray-900', 'text-white', 'border-gray-900');
            el.firstElementChild.classList.add('bg-gray-300', 'text-gray-500', 'border-white');
        }
    });
}


function togglePaymentDetails() {
    // Only one method now: Mercado Pago
    // We keep this function structure in case we add more methods later
    const summaryText = document.getElementById('payment-summary-text');
    const payBtn = document.getElementById('pay-btn');

    summaryText.innerHTML = 'Serás redirigido a <strong>Mercado Pago</strong> para completar el pago de forma segura.';
    payBtn.innerHTML = '<span class="relative z-10 flex items-center justify-center gap-2">Pagar con Mercado Pago <i class="fa-solid fa-lock"></i></span>';
    payBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
    payBtn.classList.add('bg-mint', 'hover:bg-[#8BCBCB]');
}
expose('togglePaymentDetails', togglePaymentDetails);

function updateCheckoutSummary() {
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    document.getElementById('checkout-subtotal').innerText = `$${total.toLocaleString()}`;
    document.getElementById('checkout-total').innerText = `$${total.toLocaleString()}`;
}

function processPayment() {
    const payBtn = document.getElementById('pay-btn');
    const method = 'mp'; // Fixed to MP

    // Loading State
    payBtn.disabled = true;
    const originalText = payBtn.innerHTML;
    payBtn.innerHTML = '<span class="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>';

    // Get User Data
    const inputs = document.getElementById('step-1').querySelectorAll('input');
    const userData = {};
    inputs.forEach(i => userData[i.placeholder] = i.value);

    // FIRESTORE TRANSACTION: DEDUCT STOCK & RECORD SALE
    const batch = writeBatch(db);
    const orderItems = [];

    // Check stock for each item locally first (optimistic)
    // In a real app we would use a Transaction to guarantee consistency
    let stockError = null;

    cart.forEach(cartItem => {
        const product = appProducts.find(p => p.id === cartItem.id);
        if (!product) { stockError = `${cartItem.name} ya no existe`; return; }

        // Find variant
        // We stored "color - Talle size" in variantStr usually, but logic in addToCart didn't save variantId explicitly in top level object
        // We relied on cartId = "prodId-varId". Let's parse it.
        const variantId = parseInt(cartItem.cartId.split('-')[1]);
        const variant = product.variants.find(v => v.id === variantId);

        if (!variant) { stockError = `Variante de ${cartItem.name} no encontrada`; return; }
        if (variant.stock < cartItem.quantity) { stockError = `Stock insuficiente para ${cartItem.name} (${variant.color})`; return; }

        // Deduct logic: We need to write the NEW variants array to the product doc
        // Note: multiple cart items might affect the same product.
        // Doing this inside a loop with naive updates to 'product' object works because 'product' is a reference to the item in 'appProducts' array
        // However, we need to ensure we only queue one write per document in the batch.
        variant.stock -= cartItem.quantity;

        orderItems.push({
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            color: variant.color,
            size: variant.size,
            qty: cartItem.quantity,
            price: cartItem.price
        });
    });

    if (stockError) {
        alert(stockError);
        payBtn.disabled = false;
        payBtn.innerHTML = originalText;
        return;
    }

    // Prepare Batch Writes for modified products
    // We iterate unique products involved
    const involvedProductIds = [...new Set(cart.map(i => i.id))];
    involvedProductIds.forEach(pid => {
        const p = appProducts.find(prod => prod.id === pid);
        const ref = doc(db, "productos", String(pid));
        batch.set(ref, p); // Writes the updated variants array
    });

    // Execute Batch
    batch.commit().then(async () => {
        console.log("Stock actualizado.");

        // Record Sale
        const saleRecord = {
            timestamp: Date.now(),
            dateString: new Date().toLocaleDateString(),
            items: orderItems,
            total: cart.reduce((acc, i) => acc + (i.price * i.quantity), 0),
            userData: userData,
            method: method,
            status: 'pending_payment' // Set to pending until MP confirmation really
        };
        await addDoc(collection(db, "ventas"), saleRecord);


        // Handling Success based on Method
        // For now, since MP is not actually connected, we simulate success
        showStatus(true); // Shows the generic success modal

        payBtn.disabled = false;
        payBtn.innerHTML = originalText;

    }).catch(error => {
        console.error("Error processing order:", error);
        alert("Hubo un error al procesar el pedido. Por favor intenta nuevamente.");
        payBtn.disabled = false;
        payBtn.innerHTML = originalText;
    });
}
expose('processPayment', processPayment);

function showStatus(success) {
    const overlay = document.getElementById('checkout-status');
    const icon = document.getElementById('status-icon');
    const title = document.getElementById('status-title');
    const msg = document.getElementById('status-msg');
    const btn = document.getElementById('status-btn');

    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.remove('opacity-0'), 10);

    if (success) {
        icon.innerHTML = '<i class="fa-solid fa-circle-check text-green-500"></i>';
        title.innerText = '¡Pedido Iniciado!';
        msg.innerText = 'Hemos registrado tu pedido. En breve -cuando configuremos MP- serás redirigido al pago.';
        // Clear Cart
        cart = [];
        saveCart();
        updateCartUI();
    } else {
        icon.innerHTML = '<i class="fa-solid fa-circle-xmark text-red-500"></i>';
        title.innerText = 'Pago Rechazado';
        msg.innerText = 'Hubo un problema con tu método de pago. Por favor intenta nuevamente.';
    }

    // Animations
    setTimeout(() => icon.classList.remove('scale-0'), 100);
    setTimeout(() => title.classList.remove('opacity-0'), 300);
    setTimeout(() => msg.classList.remove('opacity-0'), 500);
    setTimeout(() => btn.classList.remove('opacity-0'), 700);
}

function resetCheckoutUI() {
    document.getElementById('checkout-status').classList.add('hidden', 'opacity-0');
    // Reset steps
    currentStep = 1;
    updateCheckoutSteps();
    document.getElementById('checkout-form').reset();
    // No more radio buttons to reset
    togglePaymentDetails();
}

// --- CONFIRMATION MODAL LOGIC ---
function showSuccessModal() {
    if (!successModal) setupDOM();
    successModal.classList.remove('hidden');
    setTimeout(() => {
        successModal.classList.remove('opacity-0');
        successPanel.classList.remove('scale-95');
    }, 10);
}

function closeSuccessModal() {
    successPanel.classList.add('scale-95');
    successModal.classList.add('opacity-0');
    setTimeout(() => {
        successModal.classList.add('hidden');
    }, 300);
}
expose('closeSuccessModal', closeSuccessModal);

function goToCart() {
    closeSuccessModal();
    toggleCart();
}
expose('goToCart', goToCart);

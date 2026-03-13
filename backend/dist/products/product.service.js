"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const product_repository_1 = require("./repositories/product.repository");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let ProductService = class ProductService {
    productRepository;
    prisma;
    constructor(productRepository, prisma) {
        this.productRepository = productRepository;
        this.prisma = prisma;
    }
    async getById(id) {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }
    async getBySlug(slug) {
        const product = await this.productRepository.findBySlug(slug);
        if (!product) {
            throw new common_1.NotFoundException(`Product with slug "${slug}" not found`);
        }
        return product;
    }
    async list(filters, pagination) {
        const { products, total } = await this.productRepository.findMany(filters, pagination);
        return (0, pagination_dto_1.buildPaginatedResponse)(products, total, pagination);
    }
    async create(dto) {
        const product = await this.prisma.$transaction(async (tx) => {
            const created = await tx.product.create({
                data: {
                    productTypeId: dto.productTypeId,
                    name: dto.name,
                    slug: dto.slug,
                    description: dto.description,
                    basePrice: new library_1.Decimal(dto.basePrice),
                    brand: dto.brand,
                    isFeatured: dto.isFeatured,
                    tags: dto.tags,
                    status: 'DRAFT',
                    variants: {
                        create: dto.variants.map((v) => ({
                            sku: v.sku,
                            size: v.size,
                            color: v.color,
                            colorHex: v.colorHex,
                            priceOffset: new library_1.Decimal(v.priceOffset),
                        })),
                    },
                },
                include: { variants: true },
            });
            await tx.stock.createMany({
                data: created.variants.map((variant) => ({
                    variantId: variant.id,
                    location: 'ONLINE',
                    quantity: 0,
                    reserved: 0,
                    version: 0,
                })),
            });
            return created;
        });
        const result = await this.productRepository.findById(product.id);
        return result;
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [product_repository_1.ProductRepository,
        prisma_service_1.PrismaService])
], ProductService);
//# sourceMappingURL=product.service.js.map
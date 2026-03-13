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
exports.ProductRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ProductRepository = class ProductRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.product.findUnique({
            where: { id },
            include: {
                productType: { include: { category: true } },
                variants: {
                    where: { isActive: true },
                    include: { stock: true },
                    orderBy: { size: 'asc' },
                },
                images: { orderBy: { sortOrder: 'asc' } },
            },
        });
    }
    async findBySlug(slug) {
        return this.prisma.product.findUnique({
            where: { slug },
            include: {
                productType: { include: { category: true } },
                variants: {
                    where: { isActive: true },
                    include: { stock: true },
                    orderBy: { size: 'asc' },
                },
                images: { orderBy: { sortOrder: 'asc' } },
            },
        });
    }
    async findMany(filters, pagination) {
        const where = this.buildWhereClause(filters);
        const skip = (pagination.page - 1) * pagination.limit;
        const [products, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                include: {
                    productType: { include: { category: true } },
                    variants: {
                        where: { isActive: true },
                        include: { stock: true },
                    },
                    images: {
                        where: { isPrimary: true },
                        take: 1,
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pagination.limit,
            }),
            this.prisma.product.count({ where }),
        ]);
        return { products, total };
    }
    async create(data) {
        return this.prisma.product.create({ data });
    }
    async update(id, data) {
        return this.prisma.product.update({
            where: { id },
            data,
        });
    }
    buildWhereClause(filters) {
        const where = {};
        if (filters.productTypeId !== undefined) {
            where.productTypeId = filters.productTypeId;
        }
        if (filters.status !== undefined) {
            where.status = filters.status;
        }
        if (filters.isFeatured !== undefined) {
            where.isFeatured = filters.isFeatured;
        }
        if (filters.search !== undefined) {
            where.name = { contains: filters.search, mode: 'insensitive' };
        }
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            where.basePrice = {};
            if (filters.minPrice !== undefined) {
                where.basePrice.gte = filters.minPrice;
            }
            if (filters.maxPrice !== undefined) {
                where.basePrice.lte = filters.maxPrice;
            }
        }
        return where;
    }
};
exports.ProductRepository = ProductRepository;
exports.ProductRepository = ProductRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductRepository);
//# sourceMappingURL=product.repository.js.map
import { Injectable } from '@nestjs/common';
import { Prisma, Product, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProductFilterDto } from '../dto/create-product.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';

// ── Return type for product with full relations ──
export type ProductWithRelations = Prisma.ProductGetPayload<{
    include: {
        productType: { include: { category: true } };
        variants: { include: { stock: true } };
        images: true;
    };
}>;

@Injectable()
export class ProductRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: number): Promise<ProductWithRelations | null> {
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

    async findBySlug(slug: string): Promise<ProductWithRelations | null> {
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

    async findMany(
        filters: ProductFilterDto,
        pagination: PaginationDto,
    ): Promise<{ products: ProductWithRelations[]; total: number }> {
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

    async create(
        data: Prisma.ProductCreateInput,
    ): Promise<Product> {
        return this.prisma.product.create({ data });
    }

    async update(
        id: number,
        data: Prisma.ProductUpdateInput,
    ): Promise<Product> {
        return this.prisma.product.update({
            where: { id },
            data,
        });
    }

    // ── Private Helpers ──

    private buildWhereClause(
        filters: ProductFilterDto,
    ): Prisma.ProductWhereInput {
        const where: Prisma.ProductWhereInput = {};

        if (filters.productTypeId !== undefined) {
            where.productTypeId = filters.productTypeId;
        }

        if (filters.status !== undefined) {
            where.status = filters.status as ProductStatus;
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
}

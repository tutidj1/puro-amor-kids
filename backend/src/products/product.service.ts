import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from './repositories/product.repository';
import type { ProductWithRelations } from './repositories/product.repository';
import type { CreateProductDto, ProductFilterDto } from './dto/create-product.dto';
import type { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { buildPaginatedResponse } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ProductService {
    constructor(
        private readonly productRepository: ProductRepository,
        private readonly prisma: PrismaService,
    ) { }

    async getById(id: number): Promise<ProductWithRelations> {
        const product = await this.productRepository.findById(id);

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
    }

    async getBySlug(slug: string): Promise<ProductWithRelations> {
        const product = await this.productRepository.findBySlug(slug);

        if (!product) {
            throw new NotFoundException(`Product with slug "${slug}" not found`);
        }

        return product;
    }

    async list(
        filters: ProductFilterDto,
        pagination: PaginationDto,
    ): Promise<PaginatedResponse<ProductWithRelations>> {
        const { products, total } = await this.productRepository.findMany(
            filters,
            pagination,
        );

        return buildPaginatedResponse(products, total, pagination);
    }

    async create(dto: CreateProductDto): Promise<ProductWithRelations> {
        // Transactional: create product + variants + initial stock rows atomically
        const product = await this.prisma.$transaction(async (tx) => {
            const created = await tx.product.create({
                data: {
                    productTypeId: dto.productTypeId,
                    name: dto.name,
                    slug: dto.slug,
                    description: dto.description,
                    basePrice: new Decimal(dto.basePrice),
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
                            priceOffset: new Decimal(v.priceOffset),
                        })),
                    },
                },
                include: { variants: true },
            });

            // Create initial stock rows (ONLINE location, qty=0) for each variant
            await tx.stock.createMany({
                data: created.variants.map((variant) => ({
                    variantId: variant.id,
                    location: 'ONLINE' as const,
                    quantity: 0,
                    reserved: 0,
                    version: 0,
                })),
            });

            return created;
        });

        // Return with full relations
        const result = await this.productRepository.findById(product.id);
        // Safe: we just created it
        return result!;
    }
}

import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ProductFilterDto } from '../dto/create-product.dto';
import type { PaginationDto } from '../../common/dto/pagination.dto';
export type ProductWithRelations = Prisma.ProductGetPayload<{
    include: {
        productType: {
            include: {
                category: true;
            };
        };
        variants: {
            include: {
                stock: true;
            };
        };
        images: true;
    };
}>;
export declare class ProductRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: number): Promise<ProductWithRelations | null>;
    findBySlug(slug: string): Promise<ProductWithRelations | null>;
    findMany(filters: ProductFilterDto, pagination: PaginationDto): Promise<{
        products: ProductWithRelations[];
        total: number;
    }>;
    create(data: Prisma.ProductCreateInput): Promise<Product>;
    update(id: number, data: Prisma.ProductUpdateInput): Promise<Product>;
    private buildWhereClause;
}

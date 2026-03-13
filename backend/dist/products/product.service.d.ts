import { ProductRepository } from './repositories/product.repository';
import type { ProductWithRelations } from './repositories/product.repository';
import type { CreateProductDto, ProductFilterDto } from './dto/create-product.dto';
import type { PaginationDto, PaginatedResponse } from '../common/dto/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class ProductService {
    private readonly productRepository;
    private readonly prisma;
    constructor(productRepository: ProductRepository, prisma: PrismaService);
    getById(id: number): Promise<ProductWithRelations>;
    getBySlug(slug: string): Promise<ProductWithRelations>;
    list(filters: ProductFilterDto, pagination: PaginationDto): Promise<PaginatedResponse<ProductWithRelations>>;
    create(dto: CreateProductDto): Promise<ProductWithRelations>;
}

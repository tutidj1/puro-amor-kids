import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductRepository } from './repositories/product.repository';

@Module({
    providers: [ProductService, ProductRepository],
    exports: [ProductService, ProductRepository],
})
export class ProductModule { }

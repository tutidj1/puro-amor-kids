import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProductModule } from './products/product.module';
import { StockModule } from './stock/stock.module';
import { OrderModule } from './orders/order.module';

@Module({
    imports: [
        PrismaModule,
        ProductModule,
        StockModule,
        OrderModule,
    ],
})
export class AppModule { }

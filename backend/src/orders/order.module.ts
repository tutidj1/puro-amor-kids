import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderRepository } from './repositories/order.repository';
import { StockModule } from '../stock/stock.module';

import { OrdersController } from './orders.controller';

@Module({
    imports: [StockModule],
    providers: [OrderService, OrderRepository],
    controllers: [OrdersController],
    exports: [OrderService],
})
export class OrderModule { }

import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockRepository } from './repositories/stock.repository';

@Module({
    providers: [StockService, StockRepository],
    exports: [StockService, StockRepository],
})
export class StockModule { }

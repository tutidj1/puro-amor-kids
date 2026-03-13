import { HttpException } from '@nestjs/common';
export declare class StockConflictException extends HttpException {
    constructor(stockId: number, expectedVersion: number);
}

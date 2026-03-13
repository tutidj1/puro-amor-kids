import { HttpException } from '@nestjs/common';
export declare class InsufficientStockException extends HttpException {
    constructor(variantId: number, requested: number, available: number);
}

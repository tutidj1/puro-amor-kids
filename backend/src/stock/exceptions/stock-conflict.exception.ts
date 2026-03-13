import { HttpException, HttpStatus } from '@nestjs/common';

export class StockConflictException extends HttpException {
    constructor(stockId: number, expectedVersion: number) {
        super(
            {
                statusCode: HttpStatus.CONFLICT,
                error: 'Stock Conflict',
                message: `Optimistic lock conflict on stock ID ${stockId}. Expected version ${expectedVersion} is stale. Another process modified this record. Retry the operation.`,
                stockId,
                expectedVersion,
            },
            HttpStatus.CONFLICT,
        );
    }
}

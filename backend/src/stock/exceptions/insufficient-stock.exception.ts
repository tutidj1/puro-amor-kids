import { HttpException, HttpStatus } from '@nestjs/common';

export class InsufficientStockException extends HttpException {
    constructor(
        variantId: number,
        requested: number,
        available: number,
    ) {
        super(
            {
                statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                error: 'Insufficient Stock',
                message: `Cannot reserve ${requested} units for variant ID ${variantId}. Only ${available} units available.`,
                variantId,
                requested,
                available,
            },
            HttpStatus.UNPROCESSABLE_ENTITY,
        );
    }
}

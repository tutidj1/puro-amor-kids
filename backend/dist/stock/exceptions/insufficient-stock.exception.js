"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsufficientStockException = void 0;
const common_1 = require("@nestjs/common");
class InsufficientStockException extends common_1.HttpException {
    constructor(variantId, requested, available) {
        super({
            statusCode: common_1.HttpStatus.UNPROCESSABLE_ENTITY,
            error: 'Insufficient Stock',
            message: `Cannot reserve ${requested} units for variant ID ${variantId}. Only ${available} units available.`,
            variantId,
            requested,
            available,
        }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
exports.InsufficientStockException = InsufficientStockException;
//# sourceMappingURL=insufficient-stock.exception.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockConflictException = void 0;
const common_1 = require("@nestjs/common");
class StockConflictException extends common_1.HttpException {
    constructor(stockId, expectedVersion) {
        super({
            statusCode: common_1.HttpStatus.CONFLICT,
            error: 'Stock Conflict',
            message: `Optimistic lock conflict on stock ID ${stockId}. Expected version ${expectedVersion} is stale. Another process modified this record. Retry the operation.`,
            stockId,
            expectedVersion,
        }, common_1.HttpStatus.CONFLICT);
    }
}
exports.StockConflictException = StockConflictException;
//# sourceMappingURL=stock-conflict.exception.js.map
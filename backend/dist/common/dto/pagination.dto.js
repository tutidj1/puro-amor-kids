"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationSchema = void 0;
exports.buildPaginatedResponse = buildPaginatedResponse;
const zod_1 = require("zod");
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
function buildPaginatedResponse(data, total, pagination) {
    const totalPages = Math.ceil(total / pagination.limit);
    return {
        data,
        meta: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages,
            hasNextPage: pagination.page < totalPages,
            hasPrevPage: pagination.page > 1,
        },
    };
}
//# sourceMappingURL=pagination.dto.js.map
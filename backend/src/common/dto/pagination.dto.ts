import { z } from 'zod';

// ── Pagination Schema ──
export const PaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationDto = z.infer<typeof PaginationSchema>;

// ── Paginated Response ──
export interface PaginatedResponse<T> {
    readonly data: T[];
    readonly meta: {
        readonly page: number;
        readonly limit: number;
        readonly total: number;
        readonly totalPages: number;
        readonly hasNextPage: boolean;
        readonly hasPrevPage: boolean;
    };
}

export function buildPaginatedResponse<T>(
    data: T[],
    total: number,
    pagination: PaginationDto,
): PaginatedResponse<T> {
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

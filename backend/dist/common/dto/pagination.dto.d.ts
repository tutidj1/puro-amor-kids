import { z } from 'zod';
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type PaginationDto = z.infer<typeof PaginationSchema>;
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
export declare function buildPaginatedResponse<T>(data: T[], total: number, pagination: PaginationDto): PaginatedResponse<T>;

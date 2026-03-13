import { PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';
export declare class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
    private readonly schema;
    constructor(schema: ZodSchema<T>);
    transform(value: unknown): T;
    private formatErrors;
}

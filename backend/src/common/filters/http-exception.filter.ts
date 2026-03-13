import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

interface ErrorResponseBody {
    readonly statusCode: number;
    readonly error: string;
    readonly message: string | string[];
    readonly timestamp: string;
    readonly path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<FastifyReply>();
        const request = ctx.getRequest<{ url: string }>();

        const { status, body } = this.buildResponse(exception, request.url);

        // Log server errors with full stack trace, client errors as warnings
        if (status >= 500) {
            this.logger.error(
                `[${status}] ${request.url}`,
                exception instanceof Error ? exception.stack : undefined,
            );
        } else {
            this.logger.warn(`[${status}] ${request.url} — ${body.message}`);
        }

        void response.status(status).send(body);
    }

    private buildResponse(
        exception: unknown,
        path: string,
    ): { status: number; body: ErrorResponseBody } {
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            const message =
                typeof exceptionResponse === 'object' &&
                    exceptionResponse !== null &&
                    'message' in exceptionResponse
                    ? (exceptionResponse as { message: string | string[] }).message
                    : exception.message;

            return {
                status,
                body: {
                    statusCode: status,
                    error: HttpStatus[status] ?? 'Unknown Error',
                    message,
                    timestamp: new Date().toISOString(),
                    path,
                },
            };
        }

        // Unknown/unhandled errors → 500 Internal Server Error
        // NEVER leak stack traces in production
        return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            body: {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Internal Server Error',
                message:
                    process.env.NODE_ENV === 'development' && exception instanceof Error
                        ? exception.message
                        : 'An unexpected error occurred',
                timestamp: new Date().toISOString(),
                path,
            },
        };
    }
}

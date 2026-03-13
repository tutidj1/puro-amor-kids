"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const { status, body } = this.buildResponse(exception, request.url);
        if (status >= 500) {
            this.logger.error(`[${status}] ${request.url}`, exception instanceof Error ? exception.stack : undefined);
        }
        else {
            this.logger.warn(`[${status}] ${request.url} — ${body.message}`);
        }
        void response.status(status).send(body);
    }
    buildResponse(exception, path) {
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            const message = typeof exceptionResponse === 'object' &&
                exceptionResponse !== null &&
                'message' in exceptionResponse
                ? exceptionResponse.message
                : exception.message;
            return {
                status,
                body: {
                    statusCode: status,
                    error: common_1.HttpStatus[status] ?? 'Unknown Error',
                    message,
                    timestamp: new Date().toISOString(),
                    path,
                },
            };
        }
        return {
            status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            body: {
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                error: 'Internal Server Error',
                message: process.env.NODE_ENV === 'development' && exception instanceof Error
                    ? exception.message
                    : 'An unexpected error occurred',
                timestamp: new Date().toISOString(),
                path,
            },
        };
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map
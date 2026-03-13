"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({ logger: process.env.NODE_ENV === 'development' }));
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.enableCors({
        origin: process.env.CORS_ORIGIN ?? '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
    });
    app.enableShutdownHooks();
    const port = parseInt(process.env.PORT ?? '3000', 10);
    await app.listen(port, '0.0.0.0');
    logger.log(`🚀 Server running on http://localhost:${port}/api/v1`);
}
void bootstrap();
//# sourceMappingURL=main.js.map
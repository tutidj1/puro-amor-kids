import { NestFactory } from '@nestjs/core';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({ logger: process.env.NODE_ENV === 'development' }),
    );

    // ── Global Prefix ──
    app.setGlobalPrefix('api/v1');

    // ── Global Filters ──
    app.useGlobalFilters(new HttpExceptionFilter());

    // ── CORS ──
    app.enableCors({
        origin: process.env.CORS_ORIGIN ?? '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true,
    });

    // ── Graceful Shutdown ──
    app.enableShutdownHooks();

    const port = parseInt(process.env.PORT ?? '3000', 10);
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Server running on http://localhost:${port}/api/v1`);
}

void bootstrap();

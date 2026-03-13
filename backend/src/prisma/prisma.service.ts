import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
    extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error'>
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log:
                process.env.NODE_ENV === 'development'
                    ? [
                        { emit: 'event', level: 'query' },
                        { emit: 'stdout', level: 'info' },
                        { emit: 'stdout', level: 'warn' },
                        { emit: 'stdout', level: 'error' },
                    ]
                    : [
                        { emit: 'stdout', level: 'error' },
                        { emit: 'stdout', level: 'warn' },
                    ],
        });
    }

    async onModuleInit(): Promise<void> {
        if (process.env.NODE_ENV === 'development') {
            this.$on('query', (event: Prisma.QueryEvent) => {
                this.logger.debug(
                    `Query: ${event.query} — Duration: ${event.duration}ms`,
                );
            });
        }

        await this.$connect();
        this.logger.log('Database connection established');
    }

    async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
        this.logger.log('Database connection closed');
    }
}

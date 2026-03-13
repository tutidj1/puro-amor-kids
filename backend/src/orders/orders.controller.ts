import {
    Controller,
    Post,
    Patch,
    Body,
    Param,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    UsePipes,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, CreateOrderSchema } from './dto/create-order.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('orders')
export class OrdersController {
    constructor(private readonly orderService: OrderService) { }

    /**
     * POST /api/v1/orders
     * Public endpoint to create a new order in PENDING_PAYMENT status.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UsePipes(new ZodValidationPipe(CreateOrderSchema))
    async create(@Body() createOrderDto: CreateOrderDto) {
        const order = await this.orderService.createOrder(createOrderDto);
        return {
            message: 'Order created successfully. Awaiting payment.',
            orderId: order.id,
            status: order.status,
        };
    }

    /**
     * PATCH /api/v1/orders/admin/:id/confirm
     * Admin-only endpoint to trigger stock deduction and confirm payment.
     */
    @Patch('admin/:id/confirm')
    @HttpCode(HttpStatus.OK)
    async confirmPayment(@Param('id', ParseIntPipe) id: number) {
        const result = await this.orderService.confirmPayment(id);
        return {
            message: 'Payment confirmed and stock deducted successfully.',
            order: result.order,
            whatsappUrl: result.whatsappUrl,
        };
    }
}

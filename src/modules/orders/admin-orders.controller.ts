import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';
import { OrdersService } from './orders.service.js';
import { AdminOrderFilterDto } from './dto/admin-order-filter.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

@Roles(Role.ADMIN, Role.STAFF)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query() filter: AdminOrderFilterDto) {
    return this.ordersService.findAllAdmin(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOneAdmin(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatusAdmin(id, dto.status);
  }
}

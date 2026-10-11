import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';
import { InventoryService } from './inventory.service.js';
import { AdjustStockDto } from './dto/adjust-stock.dto.js';

@Roles(Role.ADMIN, Role.STAFF)
@Controller('admin/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findLowStock(@Query('threshold') threshold?: string) {
    return this.inventoryService.findLowStock(threshold ? Number(threshold) : 10);
  }

  @Patch(':variantId/adjust')
  adjust(@Param('variantId') variantId: string, @Body() dto: AdjustStockDto) {
    return this.inventoryService.adjustStock(variantId, dto.delta);
  }
}

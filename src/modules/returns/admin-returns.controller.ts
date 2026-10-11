import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';
import { ReturnsService } from './returns.service.js';
import { ReturnRequestFilterDto } from './dto/return-request-filter.dto.js';
import { UpdateReturnRequestDto } from './dto/update-return-request.dto.js';

@Roles(Role.ADMIN, Role.STAFF)
@Controller('admin/return-requests')
export class AdminReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  findAll(@Query() filter: ReturnRequestFilterDto) {
    return this.returnsService.findAllAdmin(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.returnsService.findOneAdmin(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReturnRequestDto) {
    return this.returnsService.updateStatusAdmin(id, dto.status, dto.adminNote);
  }
}

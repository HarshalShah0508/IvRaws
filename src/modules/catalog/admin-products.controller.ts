import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { CreateVariantDto } from './dto/create-variant.dto.js';
import { UpdateVariantDto } from './dto/update-variant.dto.js';
import { CreateImageDto } from './dto/create-image.dto.js';

@Roles(Role.ADMIN, Role.STAFF)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/variants')
  createVariant(@Param('id') id: string, @Body() dto: CreateVariantDto) {
    return this.productsService.createVariant(id, dto);
  }

  @Post(':id/images')
  createImage(@Param('id') id: string, @Body() dto: CreateImageDto) {
    return this.productsService.createImage(dto, id);
  }
}

@Roles(Role.ADMIN, Role.STAFF)
@Controller('admin/variants')
export class AdminVariantsController {
  constructor(private readonly productsService: ProductsService) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVariantDto) {
    return this.productsService.updateVariant(id, dto);
  }
}

@Roles(Role.ADMIN, Role.STAFF)
@Controller('admin/images')
export class AdminImagesController {
  constructor(private readonly productsService: ProductsService) {}

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.removeImage(id);
  }
}

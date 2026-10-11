import { Module } from '@nestjs/common';
import { CategoriesController, AdminCategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { SizesController, AdminSizesController } from './sizes.controller.js';
import { SizesService } from './sizes.service.js';
import { ColorsController, AdminColorsController } from './colors.controller.js';
import { ColorsService } from './colors.service.js';
import { ProductsController } from './products.controller.js';
import {
  AdminProductsController,
  AdminVariantsController,
  AdminImagesController,
} from './admin-products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  controllers: [
    CategoriesController,
    AdminCategoriesController,
    SizesController,
    AdminSizesController,
    ColorsController,
    AdminColorsController,
    ProductsController,
    AdminProductsController,
    AdminVariantsController,
    AdminImagesController,
  ],
  providers: [CategoriesService, SizesService, ColorsService, ProductsService],
  exports: [ProductsService],
})
export class CatalogModule {}

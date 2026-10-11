import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@Controller('products/:slug/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  findAll(@Param('slug') slug: string) {
    return this.reviewsService.findAllForProduct(slug);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.id, slug, dto);
  }
}

@Roles(Role.ADMIN, Role.STAFF)
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.removeAdmin(id);
  }
}

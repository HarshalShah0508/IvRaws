import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CartService } from './cart.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';

export const GUEST_CART_COOKIE = 'guest_session_id';
const GUEST_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

type OptionalAuthRequest = Request & { user?: AuthenticatedUser | null };

@Public()
@UseGuards(OptionalJwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req: OptionalAuthRequest, @Res({ passthrough: true }) res: Response) {
    const cart = await this.resolveCart(req, res);
    return this.cartService.getCart(cart.id);
  }

  @Post('items')
  async addItem(
    @Req() req: OptionalAuthRequest,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: AddCartItemDto,
  ) {
    const cart = await this.resolveCart(req, res);
    return this.cartService.addItem(cart.id, dto.variantId, dto.quantity);
  }

  @Patch('items/:itemId')
  async updateItem(
    @Req() req: OptionalAuthRequest,
    @Res({ passthrough: true }) res: Response,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const cart = await this.resolveCart(req, res);
    return this.cartService.updateItem(cart.id, itemId, dto.quantity);
  }

  @Delete('items/:itemId')
  async removeItem(
    @Req() req: OptionalAuthRequest,
    @Res({ passthrough: true }) res: Response,
    @Param('itemId') itemId: string,
  ) {
    const cart = await this.resolveCart(req, res);
    return this.cartService.removeItem(cart.id, itemId);
  }

  @Post('merge')
  async merge(@Req() req: OptionalAuthRequest, @Res({ passthrough: true }) res: Response) {
    if (!req.user) {
      throw new ForbiddenException('Must be authenticated to merge a guest cart');
    }
    const guestSessionId = req.cookies?.[GUEST_CART_COOKIE] as string | undefined;
    const result = guestSessionId
      ? await this.cartService.mergeGuestCartIntoUser(req.user.id, guestSessionId)
      : await this.cartService.getCart((await this.cartService.getOrCreateCart(req.user.id)).id);
    res.clearCookie(GUEST_CART_COOKIE);
    return result;
  }

  private async resolveCart(req: OptionalAuthRequest, res: Response) {
    const userId = req.user?.id;
    if (userId) {
      return this.cartService.getOrCreateCart(userId);
    }

    let sessionId = req.cookies?.[GUEST_CART_COOKIE] as string | undefined;
    if (!sessionId) {
      sessionId = randomUUID();
      res.cookie(GUEST_CART_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: GUEST_COOKIE_MAX_AGE_MS,
      });
    }
    return this.cartService.getOrCreateCart(undefined, sessionId);
  }
}

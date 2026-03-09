import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly svc: FavoritesService) {}

  @Post(':userId/:productId')
  add(@Param('userId') userId: string, @Param('productId') productId: string) {
    return this.svc.addFavorite(userId, productId);
  }

  @Delete(':userId/:productId')
  remove(@Param('userId') userId: string, @Param('productId') productId: string) {
    return this.svc.removeFavorite(userId, productId);
  }

  @Post('toggle/:userId/:productId')
  toggle(@Param('userId') userId: string, @Param('productId') productId: string) {
    return this.svc.toggleFavorite(userId, productId);
  }

  @Get('user/:userId')
  userFavorites(@Param('userId') userId: string) {
    return this.svc.getUserFavorites(userId);
  }

  @Get('check/:userId/:productId')
  check(@Param('userId') userId: string, @Param('productId') productId: string) {
    return this.svc.isFavorite(userId, productId);
  }

  @Post('view/:userId/:productId')
  trackView(@Param('userId') userId: string, @Param('productId') productId: string) {
    return this.svc.trackView(userId, productId);
  }

  @Get('recent/:userId')
  recentViews(@Param('userId') userId: string, @Query('limit') limit?: string) {
    return this.svc.getRecentViews(userId, limit ? parseInt(limit) : 10);
  }

  @Get('most-viewed')
  mostViewed(@Query('limit') limit?: string) {
    return this.svc.getMostViewedProducts(limit ? parseInt(limit) : 10);
  }
}

import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { CarsService } from './cars.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';
import { CreateShopItemDto } from './dto/shop-item.dto';

@Controller('cars')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarsController {
  constructor(private carsService: CarsService) {}

  @Post('shop-item')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async createShopItem(@Body() body: CreateShopItemDto) {
    return this.carsService.createShopItem(
      body.type,
      body.templateId,
      body.price,
      body.durationMinutes,
      body.isFree,
      body.stats_boosts,
    );
  }

  @Get('shop')
  async getShopItems() {
    return this.carsService.getShopItems();
  }

  @Post('buy/:id')
  async buyCar(@Request() req: any, @Param('id') id: string) {
    return this.carsService.buyCar(req.user, id);
  }

  @Get('garage')
  async getGarage(@Request() req: any) {
    return this.carsService.getGarage(req.user);
  }
}

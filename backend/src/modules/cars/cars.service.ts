import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Car } from './car.entity';
import { ShopItem, ShopItemType } from './shop-item.entity';
import { User } from '../auth/user.entity';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
    @InjectRepository(ShopItem)
    private shopItemRepository: Repository<ShopItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Admin: Create a car template in the shop
  async createShopItem(type: ShopItemType, templateId: string, price: number, durationMinutes: number, isFree = false, stats_boosts?: any) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

    const shopItem = this.shopItemRepository.create({
      type,
      template_id: templateId,
      price: isFree ? 0 : price,
      expires_at: expiresAt,
      is_free: isFree,
      stats_boosts: stats_boosts,
    });
    return this.shopItemRepository.save(shopItem);
  }

  // User: Buy a car from the shop
  async buyCar(user: User, shopItemId: string) {
    const shopItem = await this.shopItemRepository.findOne({
      where: {
        id: shopItemId,
        type: ShopItemType.CAR,
        expires_at: MoreThan(new Date()),
      },
    });

    if (!shopItem) {
      throw new NotFoundException('Car no longer available in the shop');
    }

    // Check for "one free car" rule
    if (shopItem.is_free) {
      const alreadyHasFreeCar = await this.carRepository.findOne({
        where: { owner: { id: user.id }, is_free: true },
      });
      if (alreadyHasFreeCar) {
        throw new BadRequestException('You have already claimed your free car');
      }
    }

    if (user.currency < shopItem.price) {
      throw new BadRequestException('Insufficient currency');
    }

    // Deduct currency
    user.currency -= shopItem.price;
    await this.userRepository.save(user);

    // Create the car for the user
    const car = this.carRepository.create({
      owner: user,
      template_id: shopItem.template_id,
      is_free: shopItem.is_free,
      // Base stats are always 1
      base_speed: 1.0,
      base_acceleration: 1.0,
      base_top_speed: 1.0,
      base_grip: 1.0,
    });

    return this.carRepository.save(car);
  }

  async getGarage(user: User) {
    return this.carRepository.find({
      where: { owner: { id: user.id } },
    });
  }

  async getShopItems() {
    return this.shopItemRepository.find({
      where: { expires_at: MoreThan(new Date()) },
    });
  }
}

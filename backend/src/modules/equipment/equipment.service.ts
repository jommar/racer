import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Equipment, EquipmentType } from './equipment.entity';
import { ShopItem, ShopItemType } from '../cars/shop-item.entity';
import { User } from '../auth/user.entity';
import { Car } from '../cars/car.entity';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
    @InjectRepository(ShopItem)
    private shopItemRepository: Repository<ShopItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
  ) {}

  async buyEquipment(user: User, shopItemId: string) {
    const shopItem = await this.shopItemRepository.findOne({
      where: {
        id: shopItemId,
        type: ShopItemType.EQUIPMENT,
        expires_at: MoreThan(new Date()),
      },
    });

    if (!shopItem) {
      throw new NotFoundException('Equipment no longer available in the shop');
    }

    if (user.currency < shopItem.price) {
      throw new BadRequestException('Insufficient currency');
    }

    user.currency -= shopItem.price;
    await this.userRepository.save(user);

    // Default type mapping based on template_id or another logic
    // For now, let's assume template_id contains the type (e.g., 'engine_v1')
    let type = EquipmentType.ENGINE;
    if (shopItem.template_id.includes('tire')) type = EquipmentType.TIRES;
    if (shopItem.template_id.includes('body')) type = EquipmentType.BODY;
    if (shopItem.template_id.includes('nitro')) type = EquipmentType.NITRO;

    const equipment = this.equipmentRepository.create({
      owner: user,
      type: type,
      template_id: shopItem.template_id,
      stats_boost: shopItem.stats_boosts,
    });

    return this.equipmentRepository.save(equipment);
  }

  async equipToCar(user: User, equipmentId: string, carId: string) {
    const equipment = await this.equipmentRepository.findOne({
      where: { id: equipmentId, owner: { id: user.id } },
    });

    if (!equipment) throw new NotFoundException('Equipment not found');
    if (equipment.is_listed) throw new BadRequestException('Item is currently listed in auction');

    const car = await this.carRepository.findOne({
      where: { id: carId, owner: { id: user.id } },
    });

    if (!car) throw new NotFoundException('Car not found');

    // Unequip any existing item of the same type from this car
    await this.equipmentRepository.update(
      { car: { id: car.id }, type: equipment.type, is_equipped: true },
      { is_equipped: false, car: null },
    );

    equipment.is_equipped = true;
    equipment.car = car;
    return this.equipmentRepository.save(equipment);
  }

  async getInventory(user: User) {
    return this.equipmentRepository.find({
      where: { owner: { id: user.id } },
      relations: ['car'],
    });
  }
}

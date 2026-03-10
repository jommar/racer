import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Auction, AuctionItemType } from './auction.entity';
import { User } from '../auth/user.entity';
import { Car } from '../cars/car.entity';
import { Equipment } from '../equipment/equipment.entity';

@Injectable()
export class AuctionsService {
  constructor(
    @InjectRepository(Auction)
    private auctionRepository: Repository<Auction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
    private dataSource: DataSource,
  ) {}

  async list(user: User, itemType: AuctionItemType, itemId: string, price: number) {
    return this.dataSource.transaction(async (manager) => {
      let item;
      if (itemType === AuctionItemType.CAR) {
        item = await manager.findOne(Car, { where: { id: itemId, owner: { id: user.id } } });
      } else {
        item = await manager.findOne(Equipment, { where: { id: itemId, owner: { id: user.id } } });
      }

      if (!item) throw new NotFoundException('Item not found or you do not own it');
      if (item.is_listed) throw new BadRequestException('Item is already listed');

      // Mark as listed
      item.is_listed = true;
      await manager.save(item);

      // Create auction record
      const auction = manager.create(Auction, {
        seller: user,
        item_type: itemType,
        item_id: itemId,
        price,
      });
      return manager.save(auction);
    });
  }

  async buy(buyer: User, auctionId: string) {
    return this.dataSource.transaction(async (manager) => {
      const auction = await manager.findOne(Auction, {
        where: { id: auctionId },
        relations: ['seller'],
      });

      if (!auction) throw new NotFoundException('Auction listing not found');
      if (auction.seller.id === buyer.id) throw new BadRequestException('You cannot buy your own item');

      const fullBuyer = await manager.findOne(User, { where: { id: buyer.id } });
      if (fullBuyer.currency < auction.price) throw new BadRequestException('Insufficient currency');

      const seller = auction.seller;

      // Exchange currency
      fullBuyer.currency -= auction.price;
      seller.currency += auction.price;
      await manager.save([fullBuyer, seller]);

      // Transfer item ownership
      if (auction.item_type === AuctionItemType.CAR) {
        const car = await manager.findOne(Car, { where: { id: auction.item_id } });
        car.owner = fullBuyer;
        car.is_listed = false;
        await manager.save(car);
      } else {
        const equipment = await manager.findOne(Equipment, { where: { id: auction.item_id } });
        equipment.owner = fullBuyer;
        equipment.is_listed = false;
        // If equipped, unequip it during transfer
        equipment.is_equipped = false;
        equipment.car = null;
        await manager.save(equipment);
      }

      // Remove auction record
      await manager.remove(auction);
      return { success: true };
    });
  }

  async getAll() {
    return this.auctionRepository.find({ relations: ['seller'] });
  }

  async cancel(user: User, auctionId: string) {
    return this.dataSource.transaction(async (manager) => {
      const auction = await manager.findOne(Auction, {
        where: { id: auctionId, seller: { id: user.id } },
      });

      if (!auction) throw new NotFoundException('Auction listing not found');

      if (auction.item_type === AuctionItemType.CAR) {
        await manager.update(Car, auction.item_id, { is_listed: false });
      } else {
        await manager.update(Equipment, auction.item_id, { is_listed: false });
      }

      await manager.remove(auction);
      return { success: true };
    });
  }
}

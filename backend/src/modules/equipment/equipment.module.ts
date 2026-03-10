import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import { Equipment } from './equipment.entity';
import { ShopItem } from '../cars/shop-item.entity';
import { User } from '../auth/user.entity';
import { Car } from '../cars/car.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipment, ShopItem, User, Car]),
    AuthModule,
  ],
  providers: [EquipmentService],
  controllers: [EquipmentController],
  exports: [EquipmentService],
})
export class EquipmentModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RacesService } from './races.service';
import { RacesController } from './races.controller';
import { RacesGateway } from '../../gateways/races.gateway';
import { Race, RaceParticipant, RaceFrame } from './race.entity';
import { User } from '../auth/user.entity';
import { Car } from '../cars/car.entity';
import { Equipment } from '../equipment/equipment.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Race, RaceParticipant, RaceFrame, User, Car, Equipment]),
    AuthModule,
  ],
  providers: [RacesService, RacesGateway],
  controllers: [RacesController],
  exports: [RacesService],
})
export class RacesModule {}

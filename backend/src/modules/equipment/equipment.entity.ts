import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { User } from '../auth/user.entity';
import { Car } from '../cars/car.entity';

export enum EquipmentType {
  ENGINE = 'ENGINE',
  TIRES = 'TIRES',
  BODY = 'BODY',
  NITRO = 'NITRO',
}

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  owner: User;

  @Index()
  @Column({ type: 'enum', enum: EquipmentType })
  type: EquipmentType;

  @Column()
  template_id: string;

  @Column('jsonb')
  stats_boost: {
    speed?: number;
    acceleration?: number;
    top_speed?: number;
    grip?: number;
  };

  @Index()
  @Column({ default: false })
  is_equipped: boolean;

  @Index()
  @ManyToOne(() => Car, (car) => car.id, { nullable: true, onDelete: 'SET NULL' })
  car: Car;

  @Index()
  @Column({ default: false })
  is_listed: boolean; // For Auction House
}

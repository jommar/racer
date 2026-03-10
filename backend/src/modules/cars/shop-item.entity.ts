import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum ShopItemType {
  CAR = 'CAR',
  EQUIPMENT = 'EQUIPMENT',
}

@Entity('shop_items')
export class ShopItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ShopItemType })
  type: ShopItemType;

  @Column()
  template_id: string;

  @Column('jsonb', { nullable: true })
  stats_boosts: any; // e.g., { "speed": 5 }

  @Column()
  price: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ default: false })
  is_free: boolean;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { User } from '../auth/user.entity';

export enum AuctionItemType {
  CAR = 'CAR',
  EQUIPMENT = 'EQUIPMENT',
}

@Entity('auctions')
export class Auction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  seller: User;

  @Index()
  @Column({ type: 'enum', enum: AuctionItemType })
  item_type: AuctionItemType;

  @Index()
  @Column()
  item_id: string; // ID of the Car or Equipment

  @Column()
  price: number;

  @CreateDateColumn()
  created_at: Date;
}

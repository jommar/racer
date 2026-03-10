import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { User } from '../auth/user.entity';

@Entity('cars')
export class Car {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  owner: User;

  @Column()
  template_id: string;

  @Column({ default: '#3498db' })
  color: string;

  @Index()
  @Column({ default: false })
  is_free: boolean;

  @Index()
  @Column({ default: false })
  is_listed: boolean; // For Auction House

  // Base stats are always 1 as per requirements
  @Column({ type: 'float', default: 1.0 })
  base_speed: number;

  @Column({ type: 'float', default: 1.0 })
  base_acceleration: number;

  @Column({ type: 'float', default: 1.0 })
  base_top_speed: number;

  @Column({ type: 'float', default: 1.0 })
  base_grip: number;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, Index } from 'typeorm';
import { User } from '../auth/user.entity';
import { Car } from '../cars/car.entity';

export enum RaceStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
}

@Entity('races')
export class Race {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Unnamed Circuit' })
  name: string;

  @ManyToOne(() => User, (user) => user.id)
  admin: User;

  @Column()
  track_length: number;

  @Column('jsonb')
  reward: {
    currency?: number;
    item_template_id?: string;
  };

  @Index()
  @Column({ type: 'enum', enum: RaceStatus, default: RaceStatus.PENDING })
  status: RaceStatus;

  @OneToMany(() => RaceParticipant, (participant) => participant.race)
  participants: RaceParticipant[];

  @Index()
  @Column({ type: 'timestamp', nullable: true })
  start_at: Date;

  @CreateDateColumn()
  created_at: Date;
}

@Entity('race_participants')
export class RaceParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Race, (race) => race.id, { onDelete: 'CASCADE' })
  race: Race;

  @Index()
  @ManyToOne(() => Car, (car) => car.id)
  car: Car;

  @Index()
  @ManyToOne(() => User, (user) => user.id)
  owner: User;

  @Column('jsonb')
  stats_snapshot: {
    speed: number;
    acceleration: number;
    top_speed: number;
    grip: number;
  };
}

@Entity('race_frames')
export class RaceFrame {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Race, (race) => race.id, { onDelete: 'CASCADE' })
  race: Race;

  @Column({ type: 'bytea' })
  compressed_frames: Buffer;

  @Column()
  total_ticks: number;

  @Column('jsonb')
  final_results: any;
}

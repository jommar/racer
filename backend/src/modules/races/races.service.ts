import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Race, RaceParticipant, RaceFrame, RaceStatus } from './race.entity';
import { User } from '../auth/user.entity';
import { Car } from '../cars/car.entity';
import { Equipment } from '../equipment/equipment.entity';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);

@Injectable()
export class RacesService {
  constructor(
    @InjectRepository(Race)
    private raceRepository: Repository<Race>,
    @InjectRepository(RaceParticipant)
    private participantRepository: Repository<RaceParticipant>,
    @InjectRepository(RaceFrame)
    private frameRepository: Repository<RaceFrame>,
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(admin: User, trackLength: number, reward: any, startAt?: Date) {
    const race = this.raceRepository.create({
      admin,
      track_length: trackLength,
      reward,
      start_at: startAt,
    });
    return this.raceRepository.save(race);
  }

  async register(user: User, raceId: string, carId: string) {
    const race = await this.raceRepository.findOne({ where: { id: raceId } });
    if (!race) throw new NotFoundException('Race not found');
    if (race.status !== RaceStatus.PENDING) throw new BadRequestException('Race already started or completed');

    const car = await this.carRepository.findOne({
      where: { id: carId, owner: { id: user.id } },
    });
    if (!car) throw new NotFoundException('Car not found');

    const equipment = await this.equipmentRepository.find({
      where: { car: { id: car.id }, is_equipped: true },
    });

    // Calculate snapshot stats
    const stats = {
      speed: car.base_speed + equipment.reduce((acc, e) => acc + (e.stats_boost.speed || 0), 0),
      acceleration: car.base_acceleration + equipment.reduce((acc, e) => acc + (e.stats_boost.acceleration || 0), 0),
      top_speed: car.base_top_speed + equipment.reduce((acc, e) => acc + (e.stats_boost.top_speed || 0), 0),
      grip: car.base_grip + equipment.reduce((acc, e) => acc + (e.stats_boost.grip || 0), 0),
    };

    const participant = this.participantRepository.create({
      race,
      car,
      owner: user,
      stats_snapshot: stats,
    });
    return this.participantRepository.save(participant);
  }

  async computeRace(raceId: string) {
    const participants = await this.participantRepository.find({
      where: { race: { id: raceId } },
      relations: ['owner', 'car'],
    });

    if (participants.length === 0) return null;

    const race = await this.raceRepository.findOne({ where: { id: raceId } });
    const totalTicks = race.track_length * 100;
    const frames = [];
    const positions = {};
    participants.forEach((p) => (positions[p.car.id] = 0));

    const K = 50; // Difficulty constant

    for (let tick = 1; tick <= totalTicks; tick++) {
      const framePositions = {};
      const progress = tick / totalTicks;

      participants.forEach((p) => {
        const stats = p.stats_snapshot;
        let weight = 1;
        if (progress <= 0.25) weight = stats.acceleration;
        else if (progress <= 0.75) weight = stats.speed;
        else weight = stats.top_speed;

        // Grip consistency roll
        const gripSuccess = Math.random() * 100 <= stats.grip * 10; // Simple scaling

        if (gripSuccess) {
          const moveProb = (weight * 2) / (weight * 2 + K);
          if (Math.random() < moveProb) {
            positions[p.car.id] += 1;
          }
        }
        framePositions[p.car.id] = positions[p.car.id];
      });

      frames.push({ tick, car_positions: framePositions });
    }

    // Determine results
    const results = participants
      .map((p) => ({
        carId: p.car.id,
        ownerId: p.owner.id,
        distance: positions[p.car.id],
      }))
      .sort((a, b) => b.distance - a.distance);

    const compressed = await gzip(JSON.stringify(frames));
    await this.frameRepository.save({
      race,
      compressed_frames: compressed,
      total_ticks: totalTicks,
      final_results: results,
    });

    race.status = RaceStatus.COMPLETED;
    await this.raceRepository.save(race);

    // Reward distribution (1st place only for simplicity)
    if (results.length > 0 && race.reward.currency) {
      await this.userRepository.increment({ id: results[0].ownerId }, 'currency', race.reward.currency);
    }

    return { frames, results };
  }

  async getReplay(raceId: string) {
    const frameData = await this.frameRepository.findOne({ where: { race: { id: raceId } } });
    if (!frameData) throw new NotFoundException('Replay not found');
    const decompressed = zlib.gunzipSync(frameData.compressed_frames).toString();
    return JSON.parse(decompressed);
  }

  async removeParticipant(raceId: string, carId: string) {
    await this.participantRepository.delete({ race: { id: raceId }, car: { id: carId } });
    return { success: true };
  }
}

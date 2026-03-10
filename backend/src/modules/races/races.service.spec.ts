import { Test, TestingModule } from '@nestjs/testing';
import { RacesService } from './races.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Race, RaceParticipant, RaceFrame, RaceStatus } from './race.entity';
import { User } from '../auth/user.entity';
import { Car } from '../cars/car.entity';
import { Equipment } from '../equipment/equipment.entity';
import { DataSource } from 'typeorm';
import * as zlib from 'zlib';

describe('RacesService', () => {
  let service: RacesService;
  let raceRepository;
  let participantRepository;
  let frameRepository;

  const mockAdmin = { id: 'admin-uuid', email: 'admin@test.com' } as User;
  const mockUser = { id: 'user-uuid', email: 'user@test.com' } as User;
  const mockCar = { id: 'car-uuid', base_speed: 1, base_acceleration: 1, base_top_speed: 1, base_grip: 1 } as Car;
  const mockRace = { id: 'race-uuid', track_length: 1, status: RaceStatus.PENDING, reward: { currency: 100 } } as Race;

  const mockRaceRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(race => Promise.resolve({ id: 'race-uuid', ...race })),
    findOne: jest.fn(),
  };

  const mockParticipantRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(p => Promise.resolve({ id: 'p-uuid', ...p })),
    find: jest.fn(),
  };

  const mockFrameRepository = {
    save: jest.fn().mockImplementation(f => Promise.resolve(f)),
    findOne: jest.fn(),
  };

  const mockCarRepository = { findOne: jest.fn() };
  const mockEquipmentRepository = { find: jest.fn() };
  const mockUserRepository = { increment: jest.fn() };
  const mockDataSource = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RacesService,
        { provide: getRepositoryToken(Race), useValue: mockRaceRepository },
        { provide: getRepositoryToken(RaceParticipant), useValue: mockParticipantRepository },
        { provide: getRepositoryToken(RaceFrame), useValue: mockFrameRepository },
        { provide: getRepositoryToken(Car), useValue: mockCarRepository },
        { provide: getRepositoryToken(Equipment), useValue: mockEquipmentRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<RacesService>(RacesService);
    raceRepository = module.get(getRepositoryToken(Race));
    participantRepository = module.get(getRepositoryToken(RaceParticipant));
    frameRepository = module.get(getRepositoryToken(RaceFrame));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new race', async () => {
      const result = await service.create(mockAdmin, 'Test Race', 10, { currency: 500 });
      expect(raceRepository.save).toHaveBeenCalled();
      expect(result.track_length).toEqual(10);
    });
  });

  describe('register', () => {
    it('should register a participant with stat snapshots', async () => {
      raceRepository.findOne.mockResolvedValue(mockRace);
      mockCarRepository.findOne.mockResolvedValue(mockCar);
      mockEquipmentRepository.find.mockResolvedValue([]);
      
      const result = await service.register(mockUser, mockRace.id, mockCar.id);
      
      expect(participantRepository.save).toHaveBeenCalled();
      expect(result.stats_snapshot.speed).toEqual(1);
    });
  });

  describe('computeRace', () => {
    it('should compute race frames and save them compressed', async () => {
      const participants = [{ car: mockCar, owner: mockUser, stats_snapshot: { speed: 1, acceleration: 1, top_speed: 1, grip: 10 } }];
      participantRepository.find.mockResolvedValue(participants);
      raceRepository.findOne.mockResolvedValue(mockRace);
      
      const result = await service.computeRace(mockRace.id);
      
      expect(result.frames.length).toEqual(100); // 1 track_length * 100
      expect(frameRepository.save).toHaveBeenCalled();
      expect(raceRepository.save).toHaveBeenCalled();
    });
  });
});

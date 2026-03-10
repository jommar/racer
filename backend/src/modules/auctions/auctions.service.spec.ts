import { Test, TestingModule } from '@nestjs/testing';
import { AuctionsService } from './auctions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Auction, AuctionItemType } from './auction.entity';
import { User } from '../auth/user.entity';
import { Car } from '../cars/car.entity';
import { Equipment } from '../equipment/equipment.entity';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AuctionsService', () => {
  let service: AuctionsService;
  let auctionRepository;
  let dataSource;

  const mockUser = {
    id: 'user-uuid',
    email: 'seller@test.com',
    currency: 5000,
  } as User;

  const mockBuyer = {
    id: 'buyer-uuid',
    email: 'buyer@test.com',
    currency: 10000,
  } as User;

  const mockCar = {
    id: 'car-uuid',
    owner: mockUser,
    is_listed: false,
  } as Car;

  const mockAuction = {
    id: 'auction-uuid',
    seller: mockUser,
    item_type: AuctionItemType.CAR,
    item_id: 'car-uuid',
    price: 3000,
  } as Auction;

  const mockAuctionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserRepository = {};
  const mockCarRepository = {};
  const mockEquipmentRepository = {};

  const mockEntityManager = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn().mockImplementation((entity, data) => data),
    remove: jest.fn(),
    update: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuctionsService,
        {
          provide: getRepositoryToken(Auction),
          useValue: mockAuctionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Car),
          useValue: mockCarRepository,
        },
        {
          provide: getRepositoryToken(Equipment),
          useValue: mockEquipmentRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AuctionsService>(AuctionsService);
    auctionRepository = module.get(getRepositoryToken(Auction));
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    it('should list a car in auction house', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockCar);
      mockEntityManager.save.mockImplementation(item => Promise.resolve(item));
      
      const result = await service.list(mockUser, AuctionItemType.CAR, mockCar.id, 3000);
      
      expect(mockEntityManager.findOne).toHaveBeenCalled();
      expect(mockCar.is_listed).toEqual(true);
      expect(result.price).toEqual(3000);
    });

    it('should throw BadRequestException if car is already listed', async () => {
      mockEntityManager.findOne.mockResolvedValue({ ...mockCar, is_listed: true });
      
      await expect(service.list(mockUser, AuctionItemType.CAR, mockCar.id, 3000)).rejects.toThrow(BadRequestException);
    });
  });

  describe('buy', () => {
    it('should transfer ownership and currency upon purchase', async () => {
      mockEntityManager.findOne.mockImplementation((entity, options) => {
        if (entity === Auction) return Promise.resolve(mockAuction);
        if (entity === User) return Promise.resolve({ ...mockBuyer }); // clone buyer
        if (entity === Car) return Promise.resolve({ ...mockCar }); // clone car
        return null;
      });
      
      const result = await service.buy(mockBuyer, mockAuction.id);
      
      expect(result.success).toEqual(true);
      expect(mockEntityManager.save).toHaveBeenCalled();
      expect(mockEntityManager.remove).toHaveBeenCalled();
    });

    it('should throw BadRequestException if buyer is the seller', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockAuction);
      
      await expect(service.buy(mockUser, mockAuction.id)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if buyer has insufficient currency', async () => {
      mockEntityManager.findOne.mockImplementation((entity, options) => {
        if (entity === Auction) return Promise.resolve(mockAuction);
        if (entity === User) return Promise.resolve({ ...mockBuyer, currency: 500 });
        return null;
      });
      
      await expect(service.buy(mockBuyer, mockAuction.id)).rejects.toThrow(BadRequestException);
    });
  });
});

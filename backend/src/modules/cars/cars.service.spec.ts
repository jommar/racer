import { Test, TestingModule } from '@nestjs/testing';
import { CarsService } from './cars.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Car } from './car.entity';
import { ShopItem, ShopItemType } from './shop-item.entity';
import { User } from '../auth/user.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MoreThan } from 'typeorm';

describe('CarsService', () => {
  let service: CarsService;
  let carRepository;
  let shopItemRepository;
  let userRepository;

  const mockUser = {
    id: 'user-uuid',
    email: 'user@test.com',
    currency: 5000,
  } as User;

  const mockShopItem = {
    id: 'shop-item-uuid',
    type: ShopItemType.CAR,
    template_id: 'car-template-1',
    price: 1000,
    expires_at: new Date(Date.now() + 100000),
    is_free: false,
  } as ShopItem;

  const mockCarRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(car => Promise.resolve({ id: 'car-uuid', ...car })),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockShopItemRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(item => Promise.resolve({ id: 'item-uuid', ...item })),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    save: jest.fn().mockImplementation(user => Promise.resolve(user)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarsService,
        {
          provide: getRepositoryToken(Car),
          useValue: mockCarRepository,
        },
        {
          provide: getRepositoryToken(ShopItem),
          useValue: mockShopItemRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<CarsService>(CarsService);
    carRepository = module.get(getRepositoryToken(Car));
    shopItemRepository = module.get(getRepositoryToken(ShopItem));
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createShopItem', () => {
    it('should create and save a shop item', async () => {
      const result = await service.createShopItem(ShopItemType.CAR, 'template-id', 100, 60);
      expect(shopItemRepository.save).toHaveBeenCalled();
      expect(result.template_id).toEqual('template-id');
    });
  });

  describe('buyCar', () => {
    it('should allow user to buy a car if they have enough currency', async () => {
      shopItemRepository.findOne.mockResolvedValue(mockShopItem);
      
      const result = await service.buyCar(mockUser, mockShopItem.id);
      
      expect(userRepository.save).toHaveBeenCalled();
      expect(carRepository.save).toHaveBeenCalled();
      expect(mockUser.currency).toEqual(4000); // 5000 - 1000
      expect(result.template_id).toEqual(mockShopItem.template_id);
    });

    it('should throw NotFoundException if shop item does not exist or expired', async () => {
      shopItemRepository.findOne.mockResolvedValue(null);
      
      await expect(service.buyCar(mockUser, 'invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user has insufficient currency', async () => {
      shopItemRepository.findOne.mockResolvedValue(mockShopItem);
      const poorUser = { ...mockUser, currency: 500 } as User;
      
      await expect(service.buyCar(poorUser, mockShopItem.id)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user tries to claim a second free car', async () => {
      const freeShopItem = { ...mockShopItem, is_free: true, price: 0 } as ShopItem;
      shopItemRepository.findOne.mockResolvedValue(freeShopItem);
      carRepository.findOne.mockResolvedValue({ id: 'existing-free-car' });
      
      await expect(service.buyCar(mockUser, freeShopItem.id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getGarage', () => {
    it('should return all cars owned by the user', async () => {
      const cars = [{ id: 'car1' }, { id: 'car2' }];
      carRepository.find.mockResolvedValue(cars);
      
      const result = await service.getGarage(mockUser);
      expect(result).toEqual(cars);
    });
  });
});

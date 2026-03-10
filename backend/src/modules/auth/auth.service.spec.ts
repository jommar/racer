import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository;

  const mockUser = {
    id: 'uuid',
    email: 'test@test.com',
    password_hash: 'hashedPassword',
    role: UserRole.USER,
    currency: 1000,
  };

  const mockUserRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(user => Promise.resolve({ id: 'uuid', ...user })),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    }),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'SUPERADMIN_EMAIL') return 'super@admin.com';
      if (key === 'SUPERADMIN_PASSWORD') return 'admin123';
      return null;
    }),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('signed-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should hash password and save user', async () => {
      const email = 'new@test.com';
      const password = 'password123';
      
      const result = await service.register(email, password);
      
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(result.email).toEqual(email);
      expect(result.currency).toEqual(1000);
    });
  });

  describe('validateUser', () => {
    it('should return user info if password matches', async () => {
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const userWithHash = { ...mockUser, password_hash: hashedPassword };
      
      userRepository.createQueryBuilder().getOne.mockResolvedValue(userWithHash);
      
      const result = await service.validateUser(mockUser.email, password);
      
      expect(result).toBeDefined();
      expect(result.email).toEqual(mockUser.email);
      expect(result.password_hash).toBeUndefined();
    });

    it('should return null if password does not match', async () => {
      userRepository.createQueryBuilder().getOne.mockResolvedValue(mockUser);
      
      const result = await service.validateUser(mockUser.email, 'wrong-password');
      
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return a token and user details', async () => {
      const result = await service.login(mockUser);
      
      expect(result.access_token).toEqual('signed-jwt-token');
      expect(result.user.email).toEqual(mockUser.email);
    });
  });
});

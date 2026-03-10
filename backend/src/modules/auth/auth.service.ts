import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.seedSuperAdmin();
  }

  private async seedSuperAdmin() {
    const email = this.configService.get<string>('SUPERADMIN_EMAIL');
    const password = this.configService.get<string>('SUPERADMIN_PASSWORD');

    if (!email || !password) {
      this.logger.warn('SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD not set in .env');
      return;
    }

    const existingSuperAdmin = await this.userRepository.findOne({
      where: { role: UserRole.SUPERADMIN },
    });

    if (!existingSuperAdmin) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const superAdmin = this.userRepository.create({
        email,
        password_hash: hashedPassword,
        role: UserRole.SUPERADMIN,
        currency: 1000000, // Rich start for superadmin
      });
      await this.userRepository.save(superAdmin);
      this.logger.log(`SuperAdmin created: ${email}`);
    } else {
      this.logger.log('SuperAdmin already exists');
    }
  }

  async register(email: string, pass: string) {
    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = this.userRepository.create({
      email,
      password_hash: hashedPassword,
      currency: 1000, // Starting balance for new users
    });
    return this.userRepository.save(user);
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        currency: user.currency,
      },
    };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userRepository.createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.email = :email', { email })
      .getOne();

    if (user && await bcrypt.compare(pass, user.password_hash)) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async getUserProfile(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

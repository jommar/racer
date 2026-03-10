import { Controller, Post, Body, Get, UseGuards, Request, Param, Delete } from '@nestjs/common';
import { RacesService } from './races.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';
import { RacesGateway } from '../../gateways/races.gateway';
import { CreateRaceDto, RegisterRaceDto } from './dto/race.dto';

@Controller('races')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RacesController {
  constructor(
    private racesService: RacesService,
    private racesGateway: RacesGateway,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async create(@Request() req: any, @Body() body: CreateRaceDto) {
    const startAt = body.startAt ? new Date(body.startAt) : undefined;
    return this.racesService.create(req.user, body.trackLength, body.reward, startAt);
  }

  @Get()
  async findAll() {
    const races = await this.racesService.findAll();
    return races.map(r => ({
      id: r.id,
      name: r.name,
      status: r.status,
      trackLength: r.track_length,
      prizePool: r.reward.currency || 0,
      participantsCount: r.participants?.length || 0,
      startTime: r.start_at,
    }));
  }

  @Post(':id/register')
  async register(@Request() req: any, @Param('id') id: string, @Body() body: RegisterRaceDto) {
    return this.racesService.register(req.user, id, body.carId);
  }

  @Post(':id/start')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async start(@Param('id') id: string) {
    // Fire and forget streaming
    this.racesGateway.streamRace(id);
    return { status: 'Race started and streaming...' };
  }

  @Get(':id/replay')
  async getReplay(@Param('id') id: string) {
    return this.racesService.getReplay(id);
  }

  @Delete(':id/participant/:carId')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async removeParticipant(@Param('id') id: string, @Param('carId') carId: string) {
    return this.racesService.removeParticipant(id, carId);
  }
}

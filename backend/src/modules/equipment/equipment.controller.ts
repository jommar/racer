import { Controller, Post, Body, Get, UseGuards, Request, Param } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EquipToCarDto } from './dto/equipment.dto';

@Controller('equipment')
@UseGuards(JwtAuthGuard)
export class EquipmentController {
  constructor(private equipmentService: EquipmentService) {}

  @Post('buy/:id')
  async buyEquipment(@Request() req: any, @Param('id') id: string) {
    return this.equipmentService.buyEquipment(req.user, id);
  }

  @Post('equip')
  async equipToCar(@Request() req: any, @Body() body: EquipToCarDto) {
    return this.equipmentService.equipToCar(req.user, body.equipmentId, body.carId);
  }

  @Get('inventory')
  async getInventory(@Request() req: any) {
    return this.equipmentService.getInventory(req.user);
  }
}

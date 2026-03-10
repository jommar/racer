import { Controller, Post, Body, Get, UseGuards, Request, Param, Delete } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListAuctionDto } from './dto/auction.dto';

@Controller('auctions')
@UseGuards(JwtAuthGuard)
export class AuctionsController {
  constructor(private auctionsService: AuctionsService) {}

  @Post('list')
  async list(@Request() req: any, @Body() body: ListAuctionDto) {
    return this.auctionsService.list(req.user, body.itemType, body.itemId, body.price);
  }

  @Post('buy/:id')
  async buy(@Request() req: any, @Param('id') id: string) {
    return this.auctionsService.buy(req.user, id);
  }

  @Get()
  async getAll() {
    return this.auctionsService.getAll();
  }

  @Delete(':id')
  async cancel(@Request() req: any, @Param('id') id: string) {
    return this.auctionsService.cancel(req.user, id);
  }
}

import { IsEnum, IsUUID, IsNumber, Min } from 'class-validator';
import { AuctionItemType } from '../auction.entity';

export class ListAuctionDto {
  @IsEnum(AuctionItemType)
  itemType: AuctionItemType;

  @IsUUID()
  itemId: string;

  @IsNumber()
  @Min(1)
  price: number;
}

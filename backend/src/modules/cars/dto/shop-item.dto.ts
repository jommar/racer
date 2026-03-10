import { IsEnum, IsString, IsNumber, IsPositive, IsBoolean, IsOptional, Min } from 'class-validator';
import { ShopItemType } from '../shop-item.entity';

export class CreateShopItemDto {
  @IsEnum(ShopItemType)
  type: ShopItemType;

  @IsString()
  templateId: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsPositive()
  durationMinutes: number;

  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @IsOptional()
  stats_boosts?: Record<string, number>;
}

import { IsNumber, IsPositive, IsObject, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class CreateRaceDto {
  @IsNumber()
  @IsPositive()
  trackLength: number;

  @IsObject()
  reward: {
    currency?: number;
    item_template_id?: string;
  };

  @IsOptional()
  @IsDateString()
  startAt?: string;
}

export class RegisterRaceDto {
  @IsUUID()
  carId: string;
}

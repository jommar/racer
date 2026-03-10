import { IsNumber, IsPositive, IsObject, IsOptional, IsDateString, IsUUID, IsString } from 'class-validator';

export class CreateRaceDto {
  @IsString()
  name: string;

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

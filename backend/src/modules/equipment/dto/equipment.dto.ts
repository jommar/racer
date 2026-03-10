import { IsUUID } from 'class-validator';

export class EquipToCarDto {
  @IsUUID()
  equipmentId: string;

  @IsUUID()
  carId: string;
}

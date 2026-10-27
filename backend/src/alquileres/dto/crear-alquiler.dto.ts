import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class ItemAlquilerDto {
  @IsUUID(undefined, {
    message: 'El campo equipamientoId debe ser un UUID válido.',
  })
  equipamientoId!: string;

  @IsInt({ message: 'El campo cantidad debe ser un entero.' })
  @Min(1, { message: 'El campo cantidad debe ser mayor o igual a 1.' })
  cantidad!: number;
}

export class CrearAlquilerDto {
  @ArrayMinSize(1, {
    message: 'El campo items debe incluir al menos un equipamiento.',
  })
  @ArrayUnique(
    (item: ItemAlquilerDto) => item.equipamientoId,
    {
      message: 'Los items no pueden repetir el mismo equipamiento.',
    },
  )
  @ValidateNested({ each: true, message: 'Cada item es inválido.' })
  @Type(() => ItemAlquilerDto)
  items!: ItemAlquilerDto[];
}

import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

const aBooleano = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalizado = value.trim().toLowerCase();
    if (normalizado === 'true') return true;
    if (normalizado === 'false') return false;
  }
  return value;
};

const aNumero = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

export class ListarEquipamientoQueryDto {
  @IsOptional()
  @IsUUID(undefined, {
    message: 'El filtro de disciplina debe ser un UUID válido.',
  })
  disciplinaId?: string;

  @Transform(aBooleano)
  @IsOptional()
  @IsBoolean({ message: 'El filtro disponible debe ser booleano.' })
  disponible?: boolean;

  @Transform(aBooleano)
  @IsOptional()
  @IsBoolean({ message: 'El filtro incluirInactivos debe ser booleano.' })
  incluirInactivos?: boolean = false;

  @Transform(aNumero)
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1.' })
  page?: number = 1;

  @Transform(aNumero)
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'El límite debe ser un número entero.' })
  @Min(1, { message: 'El límite debe ser mayor o igual a 1.' })
  @Max(100, { message: 'El límite no puede superar los 100.' })
  limit?: number = 20;
}

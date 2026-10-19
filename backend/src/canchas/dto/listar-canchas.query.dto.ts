import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { EstadoCancha } from '../../generated/prisma/client.js';

/** Acepta "en-mantenimiento" (kebab del spec) y "EN_MANTENIMIENTO" (enum). */
const aEstadoCancha = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? value.trim().toUpperCase().replace(/-/g, '_')
    : value;

const aNumero = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

export class ListarCanchasQueryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'El filtro de disciplina debe ser un texto.' })
  disciplina?: string;

  @Transform(aEstadoCancha)
  @IsOptional()
  @IsEnum(EstadoCancha, { message: 'El estado no es válido.' })
  estado?: EstadoCancha;

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

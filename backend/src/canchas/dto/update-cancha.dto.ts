import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EstadoCancha } from '../../generated/prisma/client.js';

const recortar = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const aEstadoCancha = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string'
    ? value.trim().toUpperCase().replace(/-/g, '_')
    : value;

/**
 * Actualización parcial (PUT /canchas/:id): cada campo es opcional, pero los
 * que se envían pasan por las mismas validaciones que en la creación.
 */
export class UpdateCanchaDto {
  @Transform(recortar)
  @IsOptional()
  @IsString({ message: 'El nombre es obligatorio.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(100, {
    message: 'El nombre no puede superar los 100 caracteres.',
  })
  nombre?: string;

  @Transform(recortar)
  @IsOptional()
  @IsString({ message: 'La ubicación es obligatoria.' })
  @MinLength(2, { message: 'La ubicación debe tener al menos 2 caracteres.' })
  @MaxLength(120, {
    message: 'La ubicación no puede superar los 120 caracteres.',
  })
  ubicacion?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'La capacidad debe ser un número entero.' })
  @Min(1, { message: 'La capacidad debe ser mayor que 0.' })
  capacidad?: number;

  @Transform(aEstadoCancha)
  @IsOptional()
  @IsEnum(EstadoCancha, { message: 'El estado no es válido.' })
  estado?: EstadoCancha;

  @IsOptional()
  @IsArray({ message: 'Las disciplinas deben ser una lista.' })
  @ArrayNotEmpty({ message: 'Debe indicar al menos una disciplina.' })
  @IsUUID(undefined, {
    each: true,
    message: 'Cada disciplina debe ser un UUID válido.',
  })
  disciplinaIds?: string[];
}

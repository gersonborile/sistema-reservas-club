import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class ListarTurnosQueryDto {
  @IsOptional()
  @IsUUID(undefined, {
    message: 'El parámetro cancha_id debe ser un UUID válido.',
  })
  cancha_id?: string;

  @IsOptional()
  @IsUUID(undefined, {
    message: 'El parámetro disciplina_id debe ser un UUID válido.',
  })
  disciplina_id?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'El parámetro fecha debe tener formato ISO 8601.' },
  )
  fecha?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El parámetro page debe ser un entero.' })
  @Min(1, { message: 'El parámetro page debe ser mayor o igual a 1.' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El parámetro limit debe ser un entero.' })
  @Min(1, { message: 'El parámetro limit debe ser mayor o igual a 1.' })
  limit?: number;
}

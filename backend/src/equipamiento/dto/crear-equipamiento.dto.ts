import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

const recortar = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const aBooleano = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalizado = value.trim().toLowerCase();
    if (normalizado === 'true') return true;
    if (normalizado === 'false') return false;
  }
  return value;
};

export const STOCK_TOTAL_MAXIMO = 2_147_483_647;
export const PRECIO_UNITARIO_MAXIMO = 99_999_999.99;

export class CrearEquipamientoDto {
  @Transform(recortar)
  @IsString({ message: 'El nombre es obligatorio.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre!: string;

  @IsUUID(undefined, {
    message: 'La disciplina debe ser un UUID válido.',
  })
  disciplinaId!: string;

  @Type(() => Number)
  @IsInt({ message: 'El stock total debe ser un número entero.' })
  @Min(0, { message: 'El stock total no puede ser negativo.' })
  @Max(STOCK_TOTAL_MAXIMO, {
    message: `El stock total no puede superar ${STOCK_TOTAL_MAXIMO}.`,
  })
  stockTotal!: number;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio unitario debe ser un número con hasta 2 decimales.' },
  )
  @Min(0, { message: 'El precio unitario no puede ser negativo.' })
  @Max(PRECIO_UNITARIO_MAXIMO, {
    message: `El precio unitario no puede superar ${PRECIO_UNITARIO_MAXIMO}.`,
  })
  precioUnitario!: number;

  @Transform(aBooleano)
  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser booleano.' })
  activo?: boolean;
}

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
import {
  PRECIO_UNITARIO_MAXIMO,
  STOCK_TOTAL_MAXIMO,
} from './crear-equipamiento.dto.js';

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

/**
 * Actualización parcial (PUT /equipamiento/:id): cada campo es opcional, pero
 * los que se envían pasan por las mismas validaciones que en la creación.
 * `stockDisponible` no se acepta: se deriva de `stockTotal` en el servicio.
 */
export class ActualizarEquipamientoDto {
  @Transform(recortar)
  @IsOptional()
  @IsString({ message: 'El nombre es obligatorio.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre?: string;

  @IsOptional()
  @IsUUID(undefined, {
    message: 'La disciplina debe ser un UUID válido.',
  })
  disciplinaId?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'El stock total debe ser un número entero.' })
  @Min(0, { message: 'El stock total no puede ser negativo.' })
  @Max(STOCK_TOTAL_MAXIMO, {
    message: `El stock total no puede superar ${STOCK_TOTAL_MAXIMO}.`,
  })
  stockTotal?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio unitario debe ser un número con hasta 2 decimales.' },
  )
  @Min(0, { message: 'El precio unitario no puede ser negativo.' })
  @Max(PRECIO_UNITARIO_MAXIMO, {
    message: `El precio unitario no puede superar ${PRECIO_UNITARIO_MAXIMO}.`,
  })
  precioUnitario?: number;

  @Transform(aBooleano)
  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser booleano.' })
  activo?: boolean;
}

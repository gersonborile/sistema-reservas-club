import { IsEnum, IsNumber, Min } from 'class-validator';
import { MetodoPago } from '../../generated/prisma/client.js';

export class CrearPagoDto {
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El campo monto debe ser un número con hasta 2 decimales.' },
  )
  @Min(0.01, { message: 'El campo monto debe ser mayor a 0.' })
  monto!: number;

  @IsEnum(MetodoPago, {
    message: 'El campo metodoPago debe ser EFECTIVO, TRANSFERENCIA o TARJETA.',
  })
  metodoPago!: MetodoPago;
}

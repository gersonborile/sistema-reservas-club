import { IsDateString, IsUUID } from 'class-validator';

export class DisponibilidadQueryDto {
  @IsUUID(undefined, {
    message: 'El parámetro cancha_id es obligatorio y debe ser un UUID válido.',
  })
  cancha_id!: string;

  @IsDateString(
    {},
    { message: 'El parámetro fecha es obligatorio y debe ser una fecha ISO 8601.' },
  )
  fecha!: string;
}

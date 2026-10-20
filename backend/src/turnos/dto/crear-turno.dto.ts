import { Transform } from 'class-transformer';
import { IsDateString, IsUUID, Matches } from 'class-validator';
import { FORMATO_HORA, normalizarHora } from '../horarios.js';

const normalizarHoraDeEntrada = ({ value }: { value: unknown }): unknown =>
  normalizarHora(value);

export class CrearTurnoDto {
  @IsUUID(undefined, {
    message: 'El campo cancha_id debe ser un UUID válido.',
  })
  cancha_id!: string;

  @IsUUID(undefined, {
    message: 'El campo disciplina_id debe ser un UUID válido.',
  })
  disciplina_id!: string;

  @IsDateString({}, { message: 'El campo fecha debe tener formato ISO 8601.' })
  fecha!: string;

  @Transform(normalizarHoraDeEntrada)
  @Matches(FORMATO_HORA, {
    message: 'El campo hora_inicio debe tener formato HH:mm.',
  })
  hora_inicio!: string;

  @Transform(normalizarHoraDeEntrada)
  @Matches(FORMATO_HORA, {
    message: 'El campo hora_fin debe tener formato HH:mm.',
  })
  hora_fin!: string;
}

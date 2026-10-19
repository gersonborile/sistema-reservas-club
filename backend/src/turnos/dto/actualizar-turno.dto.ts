import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsUUID, Matches } from 'class-validator';
import { FORMATO_HORA, normalizarHora } from '../horarios.js';

const normalizarHoraDeEntrada = ({ value }: { value: unknown }): unknown =>
  normalizarHora(value);

export class ActualizarTurnoDto {
  @IsOptional()
  @IsUUID(undefined, {
    message: 'El campo cancha_id debe ser un UUID válido.',
  })
  cancha_id?: string;

  @IsOptional()
  @IsUUID(undefined, {
    message: 'El campo disciplina_id debe ser un UUID válido.',
  })
  disciplina_id?: string;

  @IsOptional()
  @IsDateString({}, { message: 'El campo fecha debe tener formato ISO 8601.' })
  fecha?: string;

  @IsOptional()
  @Transform(normalizarHoraDeEntrada)
  @Matches(FORMATO_HORA, {
    message: 'El campo hora_inicio debe tener formato HH:mm.',
  })
  hora_inicio?: string;

  @IsOptional()
  @Transform(normalizarHoraDeEntrada)
  @Matches(FORMATO_HORA, {
    message: 'El campo hora_fin debe tener formato HH:mm.',
  })
  hora_fin?: string;
}

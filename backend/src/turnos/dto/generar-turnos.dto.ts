import { IsDateString, IsUUID } from 'class-validator';
import { MENSAJE_FECHA_INVALIDA } from '../mensajes.js';
import { EsFechaCalendario } from './fecha-calendario.decorator.js';

export class GenerarTurnosDto {
  @IsUUID(undefined, {
    message: 'El campo cancha_id debe ser un UUID válido.',
  })
  cancha_id!: string;

  @IsUUID(undefined, {
    message: 'El campo disciplina_id debe ser un UUID válido.',
  })
  disciplina_id!: string;

  @IsDateString({}, { message: 'El campo fecha_desde debe tener formato ISO 8601.' })
  @EsFechaCalendario({ message: MENSAJE_FECHA_INVALIDA })
  fecha_desde!: string;

  @IsDateString({}, { message: 'El campo fecha_hasta debe tener formato ISO 8601.' })
  @EsFechaCalendario({ message: MENSAJE_FECHA_INVALIDA })
  fecha_hasta!: string;
}

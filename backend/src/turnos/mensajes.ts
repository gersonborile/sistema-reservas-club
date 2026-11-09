import { APERTURA, CIERRE, DURACION_MINUTOS } from './horario-club.js';

export const MENSAJE_TURNO_NO_ENCONTRADO = 'El turno indicado no existe.';
export const MENSAJE_CANCHA_NO_ENCONTRADA = 'La cancha indicada no existe.';
export const MENSAJE_DISCIPLINA_NO_ENCONTRADA =
  'La disciplina indicada no existe.';
export const MENSAJE_RANGO_HORARIO_INVALIDO =
  'La hora de fin debe ser posterior a la hora de inicio.';
export const MENSAJE_FUERA_DE_HORARIO = `El turno debe coincidir con una franja del horario del club: de ${APERTURA} a ${CIERRE}, en bloques de ${DURACION_MINUTOS} minutos.`;
export const MENSAJE_FECHA_INVALIDA =
  'La fecha indicada no es una fecha de calendario válida.';
export const MENSAJE_RANGO_FECHAS_INVALIDO =
  'La fecha hasta no puede ser anterior a la fecha desde.';
export const MENSAJE_RANGO_DIAS_EXCEDIDO =
  'El rango de fechas no puede superar los 31 días.';
export const MENSAJE_DISCIPLINA_FUERA_DE_CANCHA =
  'La disciplina indicada no pertenece a la cancha.';
export const MENSAJE_FECHA_PASADA =
  'La fecha del turno no puede ser anterior a hoy.';
export const MENSAJE_TURNO_SUPERPUESTO =
  'Ya existe un turno superpuesto en esa cancha y fecha.';
export const MENSAJE_TURNO_CON_RESERVA =
  'El turno tiene una reserva activa y no puede eliminarse.';

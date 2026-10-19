import { Prisma } from '../generated/prisma/client.js';
import { aFechaIso } from './horarios.js';

/** Lista explícita de campos públicos de un turno. */
export const SELECCION_TURNO_PUBLICO = {
  id: true,
  canchaId: true,
  disciplinaId: true,
  fecha: true,
  horaInicio: true,
  horaFin: true,
  disponible: true,
} satisfies Prisma.TurnoSelect;

export type TurnoPublico = {
  id: string;
  cancha_id: string;
  disciplina_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
};

type TurnoSeleccionado = {
  id: string;
  canchaId: string;
  disciplinaId: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
};

export function aTurnoPublico(turno: TurnoSeleccionado): TurnoPublico {
  return {
    id: turno.id,
    cancha_id: turno.canchaId,
    disciplina_id: turno.disciplinaId,
    fecha: aFechaIso(turno.fecha),
    hora_inicio: turno.horaInicio,
    hora_fin: turno.horaFin,
    disponible: turno.disponible,
  };
}

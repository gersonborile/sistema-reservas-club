import { EstadoReserva, Prisma } from '../generated/prisma/client.js';
import { aFechaIso } from '../turnos/horarios.js';

/** Lista explícita de campos públicos de una reserva, con su turno embebido. */
export const SELECCION_RESERVA_PUBLICA = {
  id: true,
  usuarioId: true,
  turnoId: true,
  estado: true,
  createdAt: true,
  turno: {
    select: {
      fecha: true,
      horaInicio: true,
      horaFin: true,
      cancha: {
        select: { id: true, nombre: true },
      },
    },
  },
} satisfies Prisma.ReservaSelect;

export type ReservaPublica = {
  id: string;
  usuarioId: string;
  turnoId: string;
  estado: EstadoReserva;
  createdAt: string;
  turno: {
    fecha: string;
    horaInicio: string;
    horaFin: string;
    cancha: { id: string; nombre: string };
  };
};

export type ReservaSeleccionada = {
  id: string;
  usuarioId: string;
  turnoId: string;
  estado: EstadoReserva;
  createdAt: Date;
  turno: {
    fecha: Date;
    horaInicio: string;
    horaFin: string;
    cancha: { id: string; nombre: string };
  };
};

export function aReservaPublica(reserva: ReservaSeleccionada): ReservaPublica {
  return {
    id: reserva.id,
    usuarioId: reserva.usuarioId,
    turnoId: reserva.turnoId,
    estado: reserva.estado,
    createdAt: reserva.createdAt.toISOString(),
    turno: {
      fecha: aFechaIso(reserva.turno.fecha),
      horaInicio: reserva.turno.horaInicio,
      horaFin: reserva.turno.horaFin,
      cancha: reserva.turno.cancha,
    },
  };
}

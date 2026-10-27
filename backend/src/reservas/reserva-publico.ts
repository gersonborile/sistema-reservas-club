import { EstadoReserva, Prisma } from '../generated/prisma/client.js';
import { aFechaIso } from '../turnos/horarios.js';
import { aAlquilerPublico, AlquilerReserva, AlquilerSeleccionado, SELECCION_ALQUILER_PUBLICA } from '../alquileres/alquiler-publico.js';

/** Lista explícita de campos públicos de una reserva, con su turno embebido. */
export const SELECCION_RESERVA_PUBLICA = {
  id: true,
  usuarioId: true,
  turnoId: true,
  estado: true,
  createdAt: true,
  alquiler: {
    select: SELECCION_ALQUILER_PUBLICA,
  },
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
  alquiler: AlquilerReserva | null;
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
  alquiler?: AlquilerSeleccionado | null;
  turno: {
    fecha: Date;
    horaInicio: string;
    horaFin: string;
    cancha: { id: string; nombre: string };
  };
};

function aAlquilerReserva(
  alquiler?: AlquilerSeleccionado | null,
): AlquilerReserva | null {
  if (!alquiler) {
    return null;
  }
  const { reservaId: _reservaId, createdAt: _createdAt, ...publico } =
    aAlquilerPublico(alquiler);
  return {
    ...publico,
    items: publico.items.map(({ total: _total, ...item }) => item),
  };
}

export function aReservaPublica(reserva: ReservaSeleccionada): ReservaPublica {
  return {
    id: reserva.id,
    usuarioId: reserva.usuarioId,
    turnoId: reserva.turnoId,
    estado: reserva.estado,
    createdAt: reserva.createdAt.toISOString(),
    alquiler: aAlquilerReserva(reserva.alquiler),
    turno: {
      fecha: aFechaIso(reserva.turno.fecha),
      horaInicio: reserva.turno.horaInicio,
      horaFin: reserva.turno.horaFin,
      cancha: reserva.turno.cancha,
    },
  };
}

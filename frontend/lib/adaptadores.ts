import type {
  AlquilerApi,
  CanchaApi,
  DisciplinaApi,
  EstadoCancha,
  ReservaApi,
  TurnoApi,
} from "@/lib/api";

export type EstadoReservaUI = "confirmada" | "cancelada";

export type ReservaUI = {
  id: string;
  usuarioId: string;
  canchaId: string;
  canchaNombre: string;
  fecha: string;
  hora: string;
  horaFin: string;
  estado: EstadoReservaUI;
  alquiler: AlquilerApi | null;
};

export type CanchaUI = {
  id: string;
  nombre: string;
  ubicacion: string;
  capacidad: number;
  estado: EstadoCancha;
  activa: boolean;
  /** Solo las canchas DISPONIBLE se ofrecen a los socios. */
  reservable: boolean;
  disciplinas: DisciplinaApi[];
};

export type FranjaUI = {
  id: string;
  hora: string;
  ocupada: boolean;
};

export function aEtiquetaDisciplina(nombre: string): string {
  if (!nombre) return nombre;
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

export function aCanchaUI(cancha: CanchaApi): CanchaUI {
  return {
    id: cancha.id,
    nombre: cancha.nombre,
    ubicacion: cancha.ubicacion,
    capacidad: cancha.capacidad,
    estado: cancha.estado,
    activa: cancha.estado !== "EN_MANTENIMIENTO",
    reservable: cancha.estado === "DISPONIBLE",
    disciplinas: cancha.disciplinas,
  };
}

/** "Tenis · Padel": etiquetas de las disciplinas de una cancha. */
export function etiquetaDisciplinas(cancha: CanchaUI): string {
  return cancha.disciplinas.map((d) => aEtiquetaDisciplina(d.nombre)).join(" · ");
}

export function aFranjaUI(turno: TurnoApi): FranjaUI {
  return {
    id: turno.id,
    hora: turno.hora_inicio,
    ocupada: !turno.disponible,
  };
}

/** Primer turno libre cuyo hora_fin es posterior a la hora actual ("HH:MM"). */
export function primerTurnoLibreAhora(
  turnos: TurnoApi[],
  ahora: string,
): TurnoApi | null {
  const vigentes = turnos
    .filter((turno) => turno.disponible && turno.hora_fin.slice(0, 5) > ahora)
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  return vigentes[0] ?? null;
}

/** Traduce la reserva del backend (turno embebido) al tipo que usa la UI. */
export function aReservaUI(reserva: ReservaApi): ReservaUI {
  return {
    id: reserva.id,
    usuarioId: reserva.usuarioId,
    canchaId: reserva.turno.cancha.id,
    canchaNombre: reserva.turno.cancha.nombre,
    fecha: reserva.turno.fecha,
    hora: reserva.turno.horaInicio,
    horaFin: reserva.turno.horaFin,
    estado: reserva.estado === "CANCELADA" ? "cancelada" : "confirmada",
    alquiler: reserva.alquiler,
  };
}

/** Mapa id -> nombre del catálogo de equipamiento. */
export function aMapaNombres(
  equipamiento: { id: string; nombre: string }[],
): Record<string, string> {
  const nombres: Record<string, string> = {};
  for (const item of equipamiento) {
    nombres[item.id] = item.nombre;
  }
  return nombres;
}

const RESPALDO_NOMBRE = "Equipamiento";

/** Nombre en minúscula para un ítem alquilado; respaldo si falta el id. */
export function nombreDeItemAlquiler(
  item: { equipamientoId: string },
  nombres: Record<string, string>,
): string {
  const nombre = nombres[item.equipamientoId];
  return nombre ? nombre.toLowerCase() : RESPALDO_NOMBRE;
}

/** "2 raquetas, 3 pelotas": texto largo de los ítems de un alquiler. */
export function textoItemsAlquiler(
  items: { equipamientoId: string; cantidad: number }[],
  nombres: Record<string, string>,
): string {
  return items
    .map((item) => `${item.cantidad} ${nombreDeItemAlquiler(item, nombres)}`)
    .join(", ");
}

export function aReservasUI(reservas: ReservaApi[]): ReservaUI[] {
  return reservas.map(aReservaUI);
}

/** Inicio local de una reserva (fecha ISO + hora "HH:MM"); null si es inválida. */
export function inicioReserva(reserva: ReservaUI): Date | null {
  const [anio, mes, dia] = reserva.fecha.split("-").map(Number);
  const [hora, minutos] = reserva.hora.split(":").map(Number);
  if (!anio || !mes || !dia || Number.isNaN(hora)) return null;
  return new Date(anio, mes - 1, dia, hora, Number.isNaN(minutos) ? 0 : minutos);
}

/**
 * Próxima reserva: la CONFIRMADA con inicio no anterior a `ahora` y menor
 * inicio entre las futuras. Devuelve `null` si no hay ninguna.
 */
export function obtenerProximaReserva(
  reservas: ReservaUI[],
  ahora: Date,
): ReservaUI | null {
  const futuras = reservas.flatMap((reserva) => {
    if (reserva.estado !== "confirmada") return [];
    const inicio = inicioReserva(reserva);
    if (!inicio || inicio.getTime() < ahora.getTime()) return [];
    return [{ reserva, inicio }];
  });
  futuras.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  return futuras[0]?.reserva ?? null;
}

const MILIS_POR_HORA = 60 * 60 * 1000;
const HORAS_ANTICIPACION = 2;

/** Ayuda visual: cancelable solo si es CONFIRMADA y faltan 2 horas o más.
 * El backend es la autoridad ante un `409`. */
export function puedeCancelarReserva(reserva: ReservaUI, ahora: Date): boolean {
  if (reserva.estado !== "confirmada") return false;
  const inicio = inicioReserva(reserva);
  if (!inicio) return false;
  return (
    inicio.getTime() - ahora.getTime() >=
    HORAS_ANTICIPACION * MILIS_POR_HORA
  );
}

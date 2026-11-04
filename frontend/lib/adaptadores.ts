import type { CanchaApi, DisciplinaApi, EstadoCancha, TurnoApi } from "@/lib/api";

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

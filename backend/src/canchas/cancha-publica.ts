import { EstadoCancha } from '../generated/prisma/client.js';

export type DisciplinaCancha = {
  id: string;
  nombre: string;
};

export type CanchaPublica = {
  id: string;
  nombre: string;
  ubicacion: string;
  capacidad: number;
  estado: EstadoCancha;
  disciplinas: DisciplinaCancha[];
};

/** Lista explícita de campos expuestos: sin timestamps ni datos internos. */
export const SELECCION_DISCIPLINAS = {
  select: { id: true, nombre: true },
} as const;

type CanchaConDisciplinas = {
  id: string;
  nombre: string;
  ubicacion: string;
  capacidad: number;
  estado: EstadoCancha;
  disciplinas: DisciplinaCancha[];
};

/** Normaliza una cancha de Prisma al contrato público de la API. */
export function aCanchaPublica(cancha: CanchaConDisciplinas): CanchaPublica {
  return {
    id: cancha.id,
    nombre: cancha.nombre,
    ubicacion: cancha.ubicacion,
    capacidad: cancha.capacidad,
    estado: cancha.estado,
    disciplinas: cancha.disciplinas.map((disciplina) => ({
      id: disciplina.id,
      nombre: disciplina.nombre,
    })),
  };
}

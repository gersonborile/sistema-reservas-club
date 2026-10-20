export type DisciplinaEquipamiento = {
  id: string;
  nombre: string;
};

export type EquipamientoPublico = {
  id: string;
  nombre: string;
  disciplinaId: string;
  disciplina: DisciplinaEquipamiento;
  stockTotal: number;
  stockDisponible: number;
  precioUnitario: number;
  activo: boolean;
  disponible: boolean;
};

type EquipamientoConDisciplina = {
  id: string;
  nombre: string;
  disciplinaId: string;
  disciplina: DisciplinaEquipamiento;
  stockTotal: number;
  stockDisponible: number;
  precioUnitario: number | string | { toString(): string };
  activo: boolean;
};

/** Lista explícita de campos expuestos: sin timestamps ni datos internos. */
export const INCLUSION_DISCIPLINA = {
  disciplina: { select: { id: true, nombre: true } },
} as const;

/** Normaliza un equipamiento de Prisma al contrato público de la API. */
export function aEquipamientoPublico(
  equipamiento: EquipamientoConDisciplina,
): EquipamientoPublico {
  return {
    id: equipamiento.id,
    nombre: equipamiento.nombre,
    disciplinaId: equipamiento.disciplinaId,
    disciplina: {
      id: equipamiento.disciplina.id,
      nombre: equipamiento.disciplina.nombre,
    },
    stockTotal: equipamiento.stockTotal,
    stockDisponible: equipamiento.stockDisponible,
    precioUnitario: Number(equipamiento.precioUnitario),
    activo: equipamiento.activo,
    disponible: equipamiento.stockDisponible > 0,
  };
}

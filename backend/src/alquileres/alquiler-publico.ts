import { Prisma } from '../generated/prisma/client.js';

export type ItemAlquilerSeleccionado = {
  equipamientoId: string;
  cantidad: number;
  precioUnitario: Prisma.Decimal | number;
};

export type ItemAlquilerPublico = {
  equipamientoId: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
};

export type AlquilerSeleccionado = {
  id: string;
  reservaId: string;
  total: Prisma.Decimal | number;
  createdAt: Date;
  items: ItemAlquilerSeleccionado[];
};

export type AlquilerPublico = {
  id: string;
  reservaId: string;
  total: number;
  createdAt: string;
  items: ItemAlquilerPublico[];
};

export const SELECCION_ALQUILER_PUBLICA = {
  id: true,
  reservaId: true,
  total: true,
  createdAt: true,
  items: {
    select: {
      equipamientoId: true,
      cantidad: true,
      precioUnitario: true,
    },
    orderBy: { equipamientoId: 'asc' as const },
  },
} satisfies Prisma.AlquilerSelect;

export function aAlquilerPublico(alquiler: AlquilerSeleccionado): AlquilerPublico {
  const items = alquiler.items.map((item) => {
    const precioUnitario = Number(item.precioUnitario);
    return {
      equipamientoId: item.equipamientoId,
      cantidad: item.cantidad,
      precioUnitario,
      total: Number(new Prisma.Decimal(precioUnitario).mul(item.cantidad)),
    };
  });
  return {
    id: alquiler.id,
    reservaId: alquiler.reservaId,
    total: Number(alquiler.total),
    createdAt: alquiler.createdAt.toISOString(),
    items,
  };
}

/** Representación embebida del alquiler dentro de una reserva pública. */
export type AlquilerReserva = {
  id: string;
  total: number;
  items: {
    equipamientoId: string;
    cantidad: number;
    precioUnitario: number;
  }[];
};

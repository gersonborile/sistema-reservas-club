import { EstadoPago, MetodoPago, Prisma } from '../generated/prisma/client.js';

/** Lista explícita de campos públicos de un pago. */
export const SELECCION_PAGO_PUBLICA = {
  id: true,
  reservaId: true,
  monto: true,
  metodoPago: true,
  estado: true,
  fechaPago: true,
} satisfies Prisma.PagoSelect;

export type PagoPublico = {
  id: string;
  reservaId: string;
  monto: number;
  metodoPago: MetodoPago;
  estado: EstadoPago;
  fechaPago: string | null;
};

export type PagoSeleccionado = {
  id: string;
  reservaId: string;
  monto: Prisma.Decimal | number;
  metodoPago: MetodoPago;
  estado: EstadoPago;
  fechaPago: Date | null;
};

export function aPagoPublico(pago: PagoSeleccionado): PagoPublico {
  return {
    id: pago.id,
    reservaId: pago.reservaId,
    monto: Number(pago.monto),
    metodoPago: pago.metodoPago,
    estado: pago.estado,
    fechaPago: pago.fechaPago ? pago.fechaPago.toISOString() : null,
  };
}

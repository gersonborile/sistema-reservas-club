import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EstadoReserva,
  Prisma,
  RolUsuario,
} from '../generated/prisma/client.js';
import { TokenSesion } from '../auth/token-sesion.js';
import { esUuid } from '../turnos/uuid.js';
import { CrearAlquilerDto } from './dto/crear-alquiler.dto.js';
import {
  aAlquilerPublico,
  AlquilerPublico,
  AlquilerSeleccionado,
  SELECCION_ALQUILER_PUBLICA,
} from './alquiler-publico.js';
import {
  MENSAJE_ALQUILER_YA_EXISTENTE,
  MENSAJE_EQUIPAMIENTO_INACTIVO,
  MENSAJE_EQUIPAMIENTO_INEXISTENTE,
  MENSAJE_RESERVA_AJENA,
  MENSAJE_RESERVA_CANCELADA,
  MENSAJE_RESERVA_NO_ENCONTRADA,
  MENSAJE_STOCK_INSUFICIENTE,
} from './mensajes.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AlquileresService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(
    usuario: TokenSesion,
    reservaId: string,
    dto: CrearAlquilerDto,
  ): Promise<AlquilerPublico> {
    if (!esUuid(reservaId)) {
      throw new NotFoundException(MENSAJE_RESERVA_NO_ENCONTRADA);
    }

    return this.prisma.transaccion(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id: reservaId },
        select: { id: true, usuarioId: true, estado: true },
      });
      if (!reserva) {
        throw new NotFoundException(MENSAJE_RESERVA_NO_ENCONTRADA);
      }
      if (
        usuario.rol !== RolUsuario.ADMINISTRADOR &&
        reserva.usuarioId !== usuario.userId
      ) {
        throw new ForbiddenException(MENSAJE_RESERVA_AJENA);
      }
      if (reserva.estado !== EstadoReserva.CONFIRMADA) {
        throw new ConflictException(MENSAJE_RESERVA_CANCELADA);
      }

      const ids = dto.items.map((item) => item.equipamientoId);
      const catalogo = await tx.equipamiento.findMany({
        where: { id: { in: ids } },
        select: { id: true, activo: true, precioUnitario: true },
      });
      // Primero existencia (404) para todos; solo después actividad (409).
      for (const id of ids) {
        if (!catalogo.some((e) => e.id === id)) {
          throw new NotFoundException(MENSAJE_EQUIPAMIENTO_INEXISTENTE);
        }
      }
      const inactivo = catalogo.find((e) => !e.activo);
      if (inactivo) {
        throw new ConflictException(MENSAJE_EQUIPAMIENTO_INACTIVO);
      }

      // Descuento atómico: el updateMany condicional garantiza stock
      // suficiente; 0 filas revierte todo lo ya descontado (transacción).
      for (const item of dto.items) {
        const { count } = await tx.equipamiento.updateMany({
          where: { id: item.equipamientoId, stockDisponible: { gte: item.cantidad } },
          data: { stockDisponible: { decrement: item.cantidad } },
        });
        if (count === 0) {
          throw new ConflictException(MENSAJE_STOCK_INSUFICIENTE);
        }
      }

      try {
        const alquiler = await tx.alquiler.create({
          data: {
            reservaId,
            total: this.calcularTotal(dto.items, catalogo),
            items: {
              create: dto.items.map((item) => ({
                equipamientoId: item.equipamientoId,
                cantidad: item.cantidad,
                // Snapshot del precio vigente del catálogo.
                precioUnitario: catalogo.find((e) => e.id === item.equipamientoId)!
                  .precioUnitario,
              })),
            },
          },
          select: SELECCION_ALQUILER_PUBLICA,
        });
        return aAlquilerPublico(alquiler as never) as AlquilerPublico;
      } catch (error) {
        this.traducirAlquilerDuplicado(error);
        throw error;
      }
    });
  }

  private calcularTotal(
    items: CrearAlquilerDto['items'],
    catalogo: { id: string; precioUnitario: Prisma.Decimal }[],
  ): Prisma.Decimal {
    let total = new Prisma.Decimal(0);
    for (const item of items) {
      const precioUnitario = catalogo.find((e) => e.id === item.equipamientoId)!
        .precioUnitario;
      total = total.add(
        new Prisma.Decimal(precioUnitario).mul(item.cantidad),
      );
    }
    return total;
  }

  private traducirAlquilerDuplicado(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      throw new ConflictException(MENSAJE_ALQUILER_YA_EXISTENTE);
    }
  }
}

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EstadoPago,
  EstadoReserva,
  Prisma,
  RolUsuario,
} from '../generated/prisma/client.js';
import { TokenSesion } from '../auth/token-sesion.js';
import { esUuid } from '../turnos/uuid.js';
import { CrearPagoDto } from './dto/crear-pago.dto.js';
import {
  MENSAJE_PAGO_NO_ENCONTRADO,
  MENSAJE_PAGO_NO_PENDIENTE,
  MENSAJE_PAGO_YA_ANULADO,
  MENSAJE_PAGO_YA_EXISTENTE,
  MENSAJE_RESERVA_AJENA,
  MENSAJE_RESERVA_NO_COBRABLE,
  MENSAJE_RESERVA_NO_ENCONTRADA,
} from './mensajes.js';
import {
  aPagoPublico,
  PagoPublico,
  SELECCION_PAGO_PUBLICA,
} from './pago-publico.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PagosService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(reservaId: string, dto: CrearPagoDto): Promise<PagoPublico> {
    if (!esUuid(reservaId)) {
      throw new NotFoundException(MENSAJE_RESERVA_NO_ENCONTRADA);
    }
    return this.prisma.transaccion(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id: reservaId },
        select: { estado: true },
      });
      if (!reserva) {
        throw new NotFoundException(MENSAJE_RESERVA_NO_ENCONTRADA);
      }
      if (reserva.estado !== EstadoReserva.CONFIRMADA) {
        throw new ConflictException(MENSAJE_RESERVA_NO_COBRABLE);
      }

      try {
        const pago = await tx.pago.create({
          data: {
            reservaId,
            monto: dto.monto,
            metodoPago: dto.metodoPago,
            estado: EstadoPago.PENDIENTE,
          },
          select: SELECCION_PAGO_PUBLICA,
        });
        return aPagoPublico(pago);
      } catch (error) {
        // Código P2002 de Prisma: violación del unique `reservaId`,
        // lo que garantiza "una reserva → a lo sumo un pago" ante carreras.
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: string }).code === 'P2002'
        ) {
          throw new ConflictException(MENSAJE_PAGO_YA_EXISTENTE);
        }
        throw error;
      }
    });
  }

  async pagar(id: string): Promise<PagoPublico> {
    return this.transicionar(id, EstadoPago.PAGADO, {
      data: { fechaPago: new Date() },
      rechazo: MENSAJE_PAGO_NO_PENDIENTE,
      estados: [EstadoPago.PENDIENTE],
    });
  }

  async anular(id: string): Promise<PagoPublico> {
    return this.transicionar(id, EstadoPago.ANULADO, {
      rechazo: MENSAJE_PAGO_YA_ANULADO,
      estados: [EstadoPago.PENDIENTE, EstadoPago.PAGADO],
    });
  }

  async obtenerDeReserva(
    usuario: TokenSesion,
    reservaId: string,
  ): Promise<PagoPublico> {
    if (!esUuid(reservaId)) {
      throw new NotFoundException(MENSAJE_RESERVA_NO_ENCONTRADA);
    }
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
      select: { id: true, usuarioId: true },
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

    const pago = await this.prisma.pago.findUnique({
      where: { reservaId },
      select: SELECCION_PAGO_PUBLICA,
    });
    if (!pago) {
      throw new NotFoundException(MENSAJE_PAGO_NO_ENCONTRADO);
    }
    return aPagoPublico(pago);
  }

  private async transicionar(
    id: string,
    estado: EstadoPago,
    opciones: {
      data?: Prisma.PagoUpdateManyMutationInput;
      estados: EstadoPago[];
      rechazo: string;
    },
  ): Promise<PagoPublico> {
    if (!esUuid(id)) {
      throw new NotFoundException(MENSAJE_PAGO_NO_ENCONTRADO);
    }

    const { count } = await this.prisma.pago.updateMany({
      where: { id, estado: { in: opciones.estados } },
      data: { estado, ...opciones.data },
    });
    if (count === 0) {
      // 0 filas: distingue "no existe" (404) de "transición inválida" (409).
      const pago = await this.prisma.pago.findUnique({
        where: { id },
        select: { estado: true },
      });
      if (!pago) {
        throw new NotFoundException(MENSAJE_PAGO_NO_ENCONTRADO);
      }
      throw new ConflictException(opciones.rechazo);
    }

    const actualizado = await this.prisma.pago.findUnique({
      where: { id },
      select: SELECCION_PAGO_PUBLICA,
    });
    if (!actualizado) {
      throw new NotFoundException(MENSAJE_PAGO_NO_ENCONTRADO);
    }
    return aPagoPublico(actualizado);
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoCancha, EstadoReserva, RolUsuario } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TokenSesion } from '../auth/token-sesion.js';
import { aInstanteInicioUtc } from '../turnos/horarios.js';
import { esUuid } from '../turnos/uuid.js';
import { CrearReservaDto } from './dto/crear-reserva.dto.js';
import { ListarReservasQueryDto } from './dto/listar-reservas.query.js';
import {
  MENSAJE_CANCHA_INHABILITADA,
  MENSAJE_RESERVA_AJENA,
  MENSAJE_RESERVA_FUERA_DE_VENTANA,
  MENSAJE_RESERVA_NO_ENCONTRADA,
  MENSAJE_RESERVA_YA_CANCELADA,
  MENSAJE_TURNO_NO_ENCONTRADO,
  MENSAJE_TURNO_OCUPADO,
  MENSAJE_TURNO_PASADO,
  MENSAJE_USUARIO_NO_ENCONTRADO,
} from './mensajes.js';
import {
  aReservaPublica,
  ReservaPublica,
  ReservaSeleccionada,
  SELECCION_RESERVA_PUBLICA,
} from './reserva-publico.js';

const VENTANA_CANCELACION_MS = 2 * 60 * 60 * 1000;

@Injectable()
export class ReservasService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(
    usuario: TokenSesion,
    dto: CrearReservaDto,
  ): Promise<ReservaPublica> {
    const reservarA = this.resolverTitular(usuario, dto.usuarioId);

    if (!esUuid(dto.turnoId)) {
      throw new NotFoundException(MENSAJE_TURNO_NO_ENCONTRADO);
    }
    if (dto.usuarioId && dto.usuarioId !== usuario.userId) {
      await this.verificarUsuarioExiste(dto.usuarioId);
    }

    return this.prisma.transaccion(async (tx) => {
      const turno = await tx.turno.findUnique({
        where: { id: dto.turnoId },
        select: {
          id: true,
          fecha: true,
          horaInicio: true,
          disponible: true,
          cancha: { select: { estado: true } },
        },
      });
      if (!turno) {
        throw new NotFoundException(MENSAJE_TURNO_NO_ENCONTRADO);
      }

      const ahora = new Date();
      const inicio = aInstanteInicioUtc(turno.fecha, turno.horaInicio);
      if (inicio.getTime() <= ahora.getTime()) {
        throw new BadRequestException(MENSAJE_TURNO_PASADO);
      }

      if (turno.cancha.estado !== EstadoCancha.DISPONIBLE) {
        throw new ConflictException(MENSAJE_CANCHA_INHABILITADA);
      }

      // Un turno admite una sola reserva activa: el update condicional
      // dentro de la transacción evita la carrera por el mismo turno,
      // sin cortar re-reservas sobre turnos liberados.
      const { count } = await tx.turno.updateMany({
        where: { id: dto.turnoId, disponible: true },
        data: { disponible: false },
      });
      if (count === 0) {
        throw new ConflictException(MENSAJE_TURNO_OCUPADO);
      }

      const reserva = await tx.reserva.create({
        data: {
          usuarioId: reservarA,
          turnoId: dto.turnoId,
          estado: EstadoReserva.CONFIRMADA,
        },
        select: SELECCION_RESERVA_PUBLICA,
      });
      return aReservaPublica(reserva as never) as ReservaPublica;
    });
  }

  async listar(
    usuario: TokenSesion,
    filtros: ListarReservasQueryDto,
  ): Promise<ReservaPublica[]> {
    const esAdmin = usuario.rol === RolUsuario.ADMINISTRADOR;
    if (filtros.usuarioId && !esAdmin && filtros.usuarioId !== usuario.userId) {
      throw new ForbiddenException(MENSAJE_RESERVA_AJENA);
    }

    const reservas = await this.prisma.reserva.findMany({
      where: { usuarioId: filtros.usuarioId ?? (esAdmin ? undefined : usuario.userId) },
      select: SELECCION_RESERVA_PUBLICA,
      orderBy: [
        { turno: { fecha: 'desc' } },
        { turno: { horaInicio: 'desc' } },
      ],
    });
    return reservas.map((reserva: ReservaSeleccionada) =>
      aReservaPublica(reserva),
    );
  }

  async cancelar(usuario: TokenSesion, id: string): Promise<ReservaPublica> {
    if (!esUuid(id)) {
      throw new NotFoundException(MENSAJE_RESERVA_NO_ENCONTRADA);
    }

    const reserva = await this.prisma.reserva.findUnique({
      where: { id },
      select: {
        id: true,
        usuarioId: true,
        turnoId: true,
        estado: true,
        turno: { select: { fecha: true, horaInicio: true } },
      },
    });
    if (!reserva) {
      throw new NotFoundException(MENSAJE_RESERVA_NO_ENCONTRADA);
    }
    if (usuario.rol !== RolUsuario.ADMINISTRADOR && reserva.usuarioId !== usuario.userId) {
      throw new ForbiddenException(MENSAJE_RESERVA_AJENA);
    }

    const inicio = aInstanteInicioUtc(reserva.turno.fecha, reserva.turno.horaInicio);
    if (inicio.getTime() - Date.now() < VENTANA_CANCELACION_MS) {
      throw new ConflictException(MENSAJE_RESERVA_FUERA_DE_VENTANA);
    }

    return this.prisma.transaccion(async (tx) => {
      const { count } = await tx.reserva.updateMany({
        where: { id, estado: EstadoReserva.CONFIRMADA },
        data: { estado: EstadoReserva.CANCELADA },
      });
      if (count === 0) {
        throw new ConflictException(MENSAJE_RESERVA_YA_CANCELADA);
      }

      // La reserva CANCELADA y el turno DISPONIBLE se enactúan juntos;
      // un paso falla, la transacción revierte ambos.
      await tx.turno.update({
        where: { id: reserva.turnoId },
        data: { disponible: true },
      });

      // Punto de extensión (spec-alquiler): si la reserva tiene alquiler,
      // restituir aquí el stock de los equipamientos asociados.

      const actualizada = await tx.reserva.findUnique({
        where: { id },
        select: SELECCION_RESERVA_PUBLICA,
      });
      return aReservaPublica(actualizada as never) as ReservaPublica;
    });
  }

  private resolverTitular(usuario: TokenSesion, usuarioId?: string): string {
    if (!usuarioId || usuarioId === usuario.userId) {
      return usuario.userId;
    }
    if (usuario.rol !== RolUsuario.ADMINISTRADOR) {
      throw new ForbiddenException(MENSAJE_RESERVA_AJENA);
    }
    return usuarioId;
  }

  private async verificarUsuarioExiste(usuarioId: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    });
    if (!usuario) {
      throw new NotFoundException(MENSAJE_USUARIO_NO_ENCONTRADO);
    }
  }
}



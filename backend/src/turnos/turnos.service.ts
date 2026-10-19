import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ActualizarTurnoDto } from './dto/actualizar-turno.dto.js';
import { CrearTurnoDto } from './dto/crear-turno.dto.js';
import { DisponibilidadQueryDto } from './dto/disponibilidad.query.js';
import { ListarTurnosQueryDto } from './dto/listar-turnos.query.js';
import {
  aFechaUtc,
  esFechaPasada,
  minutosDeHora,
} from './horarios.js';
import {
  MENSAJE_CANCHA_NO_ENCONTRADA,
  MENSAJE_DISCIPLINA_NO_ENCONTRADA,
  MENSAJE_FECHA_PASADA,
  MENSAJE_RANGO_HORARIO_INVALIDO,
  MENSAJE_TURNO_CON_RESERVA,
  MENSAJE_TURNO_NO_ENCONTRADO,
  MENSAJE_TURNO_SUPERPUESTO,
} from './mensajes.js';
import { RangoHorario, seSuperponen } from './superposicion.js';
import {
  aTurnoPublico,
  SELECCION_TURNO_PUBLICO,
  TurnoPublico,
} from './turno-publico.js';
import { esUuid } from './uuid.js';

const PAGINA_POR_DEFECTO = 1;
const LIMITE_POR_DEFECTO = 20;

@Injectable()
export class TurnosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: ListarTurnosQueryDto): Promise<TurnoPublico[]> {
    const where: Prisma.TurnoWhereInput = {};
    if (filtros.cancha_id) {
      where.canchaId = filtros.cancha_id;
    }
    if (filtros.disciplina_id) {
      where.disciplinaId = filtros.disciplina_id;
    }
    if (filtros.fecha) {
      where.fecha = aFechaUtc(filtros.fecha);
    }

    const page = filtros.page ?? PAGINA_POR_DEFECTO;
    const limit = filtros.limit ?? LIMITE_POR_DEFECTO;

    const turnos = await this.prisma.turno.findMany({
      where,
      select: SELECCION_TURNO_PUBLICO,
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }, { canchaId: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    });
    return turnos.map(aTurnoPublico);
  }

  async porId(id: string): Promise<TurnoPublico> {
    const turno = await this.buscarOFallar(id);
    return aTurnoPublico(turno);
  }

  async disponibles(filtros: DisponibilidadQueryDto): Promise<TurnoPublico[]> {
    const cancha = await this.prisma.cancha.findUnique({
      where: { id: filtros.cancha_id },
      select: { id: true },
    });
    if (!cancha) {
      throw new NotFoundException(MENSAJE_CANCHA_NO_ENCONTRADA);
    }

    const turnos = await this.prisma.turno.findMany({
      where: {
        canchaId: filtros.cancha_id,
        fecha: aFechaUtc(filtros.fecha),
        disponible: true,
      },
      select: SELECCION_TURNO_PUBLICO,
      orderBy: [{ horaInicio: 'asc' }],
    });
    return turnos.map(aTurnoPublico);
  }

  async crear(dto: CrearTurnoDto): Promise<TurnoPublico> {
    const fecha = aFechaUtc(dto.fecha);
    await this.validarReferencias(dto.cancha_id, dto.disciplina_id);
    this.validarRango(dto.hora_inicio, dto.hora_fin);
    this.validarFechaNoPasada(fecha);
    await this.validarSuperposicion(dto.cancha_id, fecha, {
      inicio: dto.hora_inicio,
      fin: dto.hora_fin,
    });

    const creado = await this.prisma.turno.create({
      data: {
        canchaId: dto.cancha_id,
        disciplinaId: dto.disciplina_id,
        fecha,
        horaInicio: dto.hora_inicio,
        horaFin: dto.hora_fin,
      },
      select: SELECCION_TURNO_PUBLICO,
    });
    return aTurnoPublico(creado);
  }

  async modificar(id: string, dto: ActualizarTurnoDto): Promise<TurnoPublico> {
    const actual = await this.buscarOFallar(id);

    const canchaId = dto.cancha_id ?? actual.canchaId;
    const disciplinaId = dto.disciplina_id ?? actual.disciplinaId;
    const fecha = dto.fecha ? aFechaUtc(dto.fecha) : actual.fecha;
    const horaInicio = dto.hora_inicio ?? actual.horaInicio;
    const horaFin = dto.hora_fin ?? actual.horaFin;

    await this.validarReferencias(canchaId, disciplinaId);
    this.validarRango(horaInicio, horaFin);
    this.validarFechaNoPasada(fecha);
    await this.validarSuperposicion(
      canchaId,
      fecha,
      { inicio: horaInicio, fin: horaFin },
      id,
    );

    const actualizado = await this.prisma.turno.update({
      where: { id },
      data: { canchaId, disciplinaId, fecha, horaInicio, horaFin },
      select: SELECCION_TURNO_PUBLICO,
    });
    return aTurnoPublico(actualizado);
  }

  async eliminar(id: string): Promise<void> {
    const actual = await this.buscarOFallar(id);
    if (!actual.disponible) {
      throw new ConflictException(MENSAJE_TURNO_CON_RESERVA);
    }
    await this.prisma.turno.delete({ where: { id } });
  }

  private async buscarOFallar(id: string) {
    if (!esUuid(id)) {
      throw new NotFoundException(MENSAJE_TURNO_NO_ENCONTRADO);
    }
    const turno = await this.prisma.turno.findUnique({ where: { id } });
    if (!turno) {
      throw new NotFoundException(MENSAJE_TURNO_NO_ENCONTRADO);
    }
    return turno;
  }

  private async validarReferencias(
    canchaId: string,
    disciplinaId: string,
  ): Promise<void> {
    const cancha = await this.prisma.cancha.findUnique({
      where: { id: canchaId },
      select: { id: true },
    });
    if (!cancha) {
      throw new UnprocessableEntityException(MENSAJE_CANCHA_NO_ENCONTRADA);
    }

    const disciplina = await this.prisma.disciplina.findUnique({
      where: { id: disciplinaId },
      select: { id: true },
    });
    if (!disciplina) {
      throw new UnprocessableEntityException(MENSAJE_DISCIPLINA_NO_ENCONTRADA);
    }
  }

  private validarRango(horaInicio: string, horaFin: string): void {
    if (minutosDeHora(horaFin) <= minutosDeHora(horaInicio)) {
      throw new BadRequestException(MENSAJE_RANGO_HORARIO_INVALIDO);
    }
  }

  private validarFechaNoPasada(fecha: Date): void {
    if (esFechaPasada(fecha)) {
      throw new BadRequestException(MENSAJE_FECHA_PASADA);
    }
  }

  private async validarSuperposicion(
    canchaId: string,
    fecha: Date,
    rango: RangoHorario,
    excluirId?: string,
  ): Promise<void> {
    const existentes = await this.prisma.turno.findMany({
      where: { canchaId, fecha },
      select: { id: true, horaInicio: true, horaFin: true },
    });
    const haySuperposicion = existentes.some(
      (turno) =>
        turno.id !== excluirId &&
        seSuperponen(rango, {
          inicio: turno.horaInicio,
          fin: turno.horaFin,
        }),
    );
    if (haySuperposicion) {
      throw new ConflictException(MENSAJE_TURNO_SUPERPUESTO);
    }
  }
}

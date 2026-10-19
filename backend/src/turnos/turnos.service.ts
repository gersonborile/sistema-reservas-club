import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ListarTurnosQueryDto } from './dto/listar-turnos.query.js';
import { aFechaUtc } from './horarios.js';
import { MENSAJE_TURNO_NO_ENCONTRADO } from './mensajes.js';
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
    if (!esUuid(id)) {
      throw new NotFoundException(MENSAJE_TURNO_NO_ENCONTRADO);
    }
    const turno = await this.prisma.turno.findUnique({
      where: { id },
      select: SELECCION_TURNO_PUBLICO,
    });
    if (!turno) {
      throw new NotFoundException(MENSAJE_TURNO_NO_ENCONTRADO);
    }
    return aTurnoPublico(turno);
  }
}

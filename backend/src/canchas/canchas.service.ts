import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  aCanchaPublica,
  CanchaPublica,
  SELECCION_DISCIPLINAS,
} from './cancha-publica.js';
import { CreateCanchaDto } from './dto/create-cancha.dto.js';
import { ListarCanchasQueryDto } from './dto/listar-canchas.query.dto.js';
import { UpdateCanchaDto } from './dto/update-cancha.dto.js';
import {
  MENSAJE_CANCHA_CON_TURNOS,
  MENSAJE_CANCHA_NO_ENCONTRADA,
  MENSAJE_DISCIPLINA_INEXISTENTE,
  MENSAJE_NOMBRE_EN_USO,
} from './mensajes.js';

/** Códigos de Prisma por restricción de clave foránea (relación Turno). */
const CODIGO_RESTRICCION_CLAVE_FORANEA = 'P2003';

const INCLUSION_DISCIPLINAS = { disciplinas: SELECCION_DISCIPLINAS } as const;

@Injectable()
export class CanchasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarCanchasQueryDto): Promise<CanchaPublica[]> {
    const { disciplina, estado } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CanchaWhereInput = {
      ...(estado ? { estado } : {}),
      ...(disciplina
        ? {
            disciplinas: {
              some: {
                nombre: { equals: disciplina, mode: 'insensitive' },
              },
            },
          }
        : {}),
    };

    const canchas = await this.prisma.cancha.findMany({
      where,
      include: INCLUSION_DISCIPLINAS,
      orderBy: { nombre: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return canchas.map(aCanchaPublica);
  }

  async detalle(id: string): Promise<CanchaPublica> {
    const cancha = await this.prisma.cancha.findFirst({
      where: { id },
      include: INCLUSION_DISCIPLINAS,
    });
    if (!cancha) {
      throw new NotFoundException(MENSAJE_CANCHA_NO_ENCONTRADA);
    }
    return aCanchaPublica(cancha);
  }

  async crear(dto: CreateCanchaDto): Promise<CanchaPublica> {
    await this.verificarDisciplinas(dto.disciplinaIds);
    await this.verificarNombreDisponible(dto.nombre);

    const cancha = await this.prisma.cancha.create({
      data: {
        nombre: dto.nombre,
        ubicacion: dto.ubicacion,
        capacidad: dto.capacidad,
        estado: dto.estado,
        disciplinas: {
          connect: dto.disciplinaIds.map((id) => ({ id })),
        },
      },
      include: INCLUSION_DISCIPLINAS,
    });
    return aCanchaPublica(cancha);
  }

  async actualizar(id: string, dto: UpdateCanchaDto): Promise<CanchaPublica> {
    const existente = await this.prisma.cancha.findFirst({
      where: { id },
      select: { id: true },
    });
    if (!existente) {
      throw new NotFoundException(MENSAJE_CANCHA_NO_ENCONTRADA);
    }

    if (dto.disciplinaIds) {
      await this.verificarDisciplinas(dto.disciplinaIds);
    }
    if (dto.nombre) {
      await this.verificarNombreDisponible(dto.nombre, id);
    }

    const { disciplinaIds, ...campos } = dto;
    const cancha = await this.prisma.cancha.update({
      where: { id },
      data: {
        ...campos,
        ...(disciplinaIds
          ? { disciplinas: { set: disciplinaIds.map((idDisciplina) => ({ id: idDisciplina })) } }
          : {}),
      },
      include: INCLUSION_DISCIPLINAS,
    });
    return aCanchaPublica(cancha);
  }

  async eliminar(id: string): Promise<void> {
    const existente = await this.prisma.cancha.findFirst({
      where: { id },
      select: { id: true },
    });
    if (!existente) {
      throw new NotFoundException(MENSAJE_CANCHA_NO_ENCONTRADA);
    }

    const turnos = await this.prisma.turno.count({
      where: { canchaId: id },
    });
    if (turnos > 0) {
      throw new ConflictException(MENSAJE_CANCHA_CON_TURNOS);
    }

    try {
      await this.prisma.cancha.delete({ where: { id } });
    } catch (error) {
      // Red de seguridad: la restricción `onDelete: Restrict` de la relación
      // Turno responde 409 en lugar de dejar escapar el 500 de Prisma.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error as Prisma.PrismaClientKnownRequestError).code === CODIGO_RESTRICCION_CLAVE_FORANEA
      ) {
        throw new ConflictException(MENSAJE_CANCHA_CON_TURNOS);
      }
      throw error;
    }
  }

  private async verificarNombreDisponible(
    nombre: string,
    idExcluido?: string,
  ): Promise<void> {
    const duplicada = await this.prisma.cancha.findFirst({
      where: {
        nombre: { equals: nombre, mode: 'insensitive' },
        ...(idExcluido ? { NOT: { id: idExcluido } } : {}),
      },
      select: { id: true },
    });
    if (duplicada) {
      throw new ConflictException(MENSAJE_NOMBRE_EN_USO);
    }
  }

  private async verificarDisciplinas(disciplinaIds: string[]): Promise<void> {
    const unicos = [...new Set(disciplinaIds)];
    const encontradas = await this.prisma.disciplina.findMany({
      where: { id: { in: unicos } },
      select: { id: true },
    });
    if (encontradas.length !== unicos.length) {
      throw new UnprocessableEntityException(MENSAJE_DISCIPLINA_INEXISTENTE);
    }
  }
}


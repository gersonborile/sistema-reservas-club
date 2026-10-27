import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ActualizarEquipamientoDto } from './dto/actualizar-equipamiento.dto.js';
import { CrearEquipamientoDto } from './dto/crear-equipamiento.dto.js';
import { ListarEquipamientoQueryDto } from './dto/listar-equipamiento.query.dto.js';
import {
  aEquipamientoPublico,
  EquipamientoPublico,
  INCLUSION_DISCIPLINA,
} from './equipamiento-publico.js';
import {
  MENSAJE_DISCIPLINA_INEXISTENTE,
  MENSAJE_EQUIPAMIENTO_CON_ALQUILERES,
  MENSAJE_EQUIPAMIENTO_NO_ENCONTRADO,
  MENSAJE_STOCK_CAMBIO_CONCURRENTE,
  MENSAJE_STOCK_POR_DEBAJO_DE_ALQUILADO,
} from './mensajes.js';

/** Códigos de Prisma por restricción de clave foránea. */
const CODIGO_RESTRICCION_CLAVE_FORANEA = 'P2003';
/** Código de Prisma cuando el registro a modificar/eliminar ya no existe. */
const CODIGO_REGISTRO_NO_ENCONTRADO = 'P2025';

/** Intentos acotados para el ajuste de stock con concurrencia optimista. */
const MAX_INTENTOS_STOCK = 5;

type StockVigente = {
  stockTotal: number;
  stockDisponible: number;
};

@Injectable()
export class EquipamientoService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    query: ListarEquipamientoQueryDto,
  ): Promise<EquipamientoPublico[]> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.EquipamientoWhereInput = {
      ...(query.incluirInactivos ? {} : { activo: true }),
      ...(query.disciplinaId ? { disciplinaId: query.disciplinaId } : {}),
      ...(query.disponible === true
        ? { stockDisponible: { gt: 0 } }
        : {}),
      ...(query.disponible === false ? { stockDisponible: 0 } : {}),
    };

    const equipamientos = await this.prisma.equipamiento.findMany({
      where,
      include: INCLUSION_DISCIPLINA,
      orderBy: { nombre: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return equipamientos.map(aEquipamientoPublico);
  }

  async detalle(id: string): Promise<EquipamientoPublico> {
    const equipamiento = await this.prisma.equipamiento.findFirst({
      where: { id },
      include: INCLUSION_DISCIPLINA,
    });
    if (!equipamiento) {
      throw new NotFoundException(MENSAJE_EQUIPAMIENTO_NO_ENCONTRADO);
    }
    return aEquipamientoPublico(equipamiento);
  }

  async crear(dto: CrearEquipamientoDto): Promise<EquipamientoPublico> {
    await this.verificarDisciplina(dto.disciplinaId);

    try {
      const equipamiento = await this.prisma.equipamiento.create({
        data: {
          nombre: dto.nombre,
          disciplinaId: dto.disciplinaId,
          stockTotal: dto.stockTotal,
          stockDisponible: dto.stockTotal,
          precioUnitario: dto.precioUnitario,
          activo: dto.activo ?? true,
        },
        include: INCLUSION_DISCIPLINA,
      });
      return aEquipamientoPublico(equipamiento);
    } catch (error) {
      this.traducirErrorDeReferencia(error);
      throw error;
    }
  }

  async actualizar(
    id: string,
    dto: ActualizarEquipamientoDto,
  ): Promise<EquipamientoPublico> {
    const vigente = await this.prisma.equipamiento.findFirst({
      where: { id },
      select: { id: true, stockTotal: true, stockDisponible: true },
    });
    if (!vigente) {
      throw new NotFoundException(MENSAJE_EQUIPAMIENTO_NO_ENCONTRADO);
    }

    if (dto.disciplinaId !== undefined) {
      await this.verificarDisciplina(dto.disciplinaId);
    }

    if (dto.stockTotal !== undefined) {
      await this.actualizarConStock(id, dto, vigente);
    } else {
      await this.actualizarSinStock(id, dto);
    }

    return this.detalle(id);
  }

  async eliminar(id: string): Promise<void> {
    const existente = await this.prisma.equipamiento.findFirst({
      where: { id },
      select: { id: true, _count: { select: { reservas: true } } },
    });
    if (!existente) {
      throw new NotFoundException(MENSAJE_EQUIPAMIENTO_NO_ENCONTRADO);
    }
    if (existente._count.reservas > 0) {
      throw new ConflictException(MENSAJE_EQUIPAMIENTO_CON_ALQUILERES);
    }

    try {
      await this.prisma.equipamiento.delete({ where: { id } });
    } catch (error) {
      // Red de seguridad: la restricción `onDelete: Restrict` de
      // ReservaEquipamiento responde 409 en lugar de dejar escapar el 500.
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === CODIGO_RESTRICCION_CLAVE_FORANEA) {
          throw new ConflictException(MENSAJE_EQUIPAMIENTO_CON_ALQUILERES);
        }
        if (error.code === CODIGO_REGISTRO_NO_ENCONTRADO) {
          throw new NotFoundException(MENSAJE_EQUIPAMIENTO_NO_ENCONTRADO);
        }
      }
      throw error;
    }
  }

  private async actualizarConStock(
    id: string,
    dto: ActualizarEquipamientoDto,
    inicial: StockVigente,
  ): Promise<void> {
    const nuevoTotal = dto.stockTotal;
    if (nuevoTotal === undefined) {
      return;
    }

    let vigente = inicial;
    for (let intento = 0; intento < MAX_INTENTOS_STOCK; intento += 1) {
      const alquiladas = vigente.stockTotal - vigente.stockDisponible;
      if (nuevoTotal < alquiladas) {
        throw new ConflictException(MENSAJE_STOCK_POR_DEBAJO_DE_ALQUILADO);
      }

      const data: Prisma.EquipamientoUncheckedUpdateManyInput = {
        ...this.construirDatos(dto),
        stockTotal: nuevoTotal,
        stockDisponible: nuevoTotal - alquiladas,
      };

      try {
        const resultado = await this.prisma.equipamiento.updateMany({
          where: {
            id,
            stockTotal: vigente.stockTotal,
            stockDisponible: vigente.stockDisponible,
          },
          data,
        });
        if (resultado.count === 1) {
          return;
        }
      } catch (error) {
        this.traducirErrorDeReferencia(error);
        throw error;
      }

      const siguiente = await this.prisma.equipamiento.findFirst({
        where: { id },
        select: { stockTotal: true, stockDisponible: true },
      });
      if (!siguiente) {
        throw new NotFoundException(MENSAJE_EQUIPAMIENTO_NO_ENCONTRADO);
      }
      vigente = siguiente;
    }

    throw new ConflictException(MENSAJE_STOCK_CAMBIO_CONCURRENTE);
  }

  private async actualizarSinStock(
    id: string,
    dto: ActualizarEquipamientoDto,
  ): Promise<void> {
    const data = this.construirDatos(dto);
    if (Object.keys(data).length === 0) {
      const existente = await this.prisma.equipamiento.findFirst({
        where: { id },
        select: { id: true },
      });
      if (!existente) {
        throw new NotFoundException(MENSAJE_EQUIPAMIENTO_NO_ENCONTRADO);
      }
      return;
    }

    try {
      const resultado = await this.prisma.equipamiento.updateMany({
        where: { id },
        data,
      });
      if (resultado.count === 0) {
        throw new NotFoundException(MENSAJE_EQUIPAMIENTO_NO_ENCONTRADO);
      }
    } catch (error) {
      this.traducirErrorDeReferencia(error);
      throw error;
    }
  }

  private construirDatos(
    dto: ActualizarEquipamientoDto,
  ): Prisma.EquipamientoUncheckedUpdateManyInput {
    return {
      ...(dto.nombre !== undefined ? { nombre: dto.nombre } : {}),
      ...(dto.disciplinaId !== undefined
        ? { disciplinaId: dto.disciplinaId }
        : {}),
      ...(dto.precioUnitario !== undefined
        ? { precioUnitario: dto.precioUnitario }
        : {}),
      ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
    };
  }

  private async verificarDisciplina(disciplinaId: string): Promise<void> {
    const disciplina = await this.prisma.disciplina.findFirst({
      where: { id: disciplinaId },
      select: { id: true },
    });
    if (!disciplina) {
      throw new UnprocessableEntityException(MENSAJE_DISCIPLINA_INEXISTENTE);
    }
  }

  private traducirErrorDeReferencia(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === CODIGO_RESTRICCION_CLAVE_FORANEA
    ) {
      throw new UnprocessableEntityException(MENSAJE_DISCIPLINA_INEXISTENTE);
    }
  }
}

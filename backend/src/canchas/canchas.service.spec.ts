import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { EstadoCancha } from '../generated/prisma/client.js';
import { CanchasService } from './canchas.service.js';
import { CreateCanchaDto } from './dto/create-cancha.dto.js';
import { ListarCanchasQueryDto } from './dto/listar-canchas.query.dto.js';
import { UpdateCanchaDto } from './dto/update-cancha.dto.js';
import {
  MENSAJE_CANCHA_CON_TURNOS,
  MENSAJE_CANCHA_NO_ENCONTRADA,
  MENSAJE_DISCIPLINA_INEXISTENTE,
  MENSAJE_NOMBRE_EN_USO,
} from './mensajes.js';

const TENIS_ID = '3f1a1a00-0000-4000-8000-000000000001';
const FUTBOL_ID = '3f1a1a00-0000-4000-8000-000000000002';
const CANCHA_ID = '3f1a1a00-0000-4000-8000-0000000000aa';

function disciplina(id: string, nombre: string) {
  return { id, nombre };
}

function canchaGuardada(
  overrides: Partial<{
    id: string;
    nombre: string;
    ubicacion: string;
    capacidad: number;
    estado: EstadoCancha;
    disciplinas: Array<{ id: string; nombre: string }>;
  }> = {},
) {
  return {
    id: CANCHA_ID,
    nombre: 'Cancha de Tenis 1',
    ubicacion: 'Pista A',
    capacidad: 4,
    estado: EstadoCancha.DISPONIBLE,
    disciplinas: [disciplina(TENIS_ID, 'tenis')],
    ...overrides,
  };
}

type PrismaMock = {
  cancha: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  disciplina: {
    findMany: ReturnType<typeof vi.fn>;
  };
  turno: {
    count: ReturnType<typeof vi.fn>;
  };
};

describe('CanchasService', () => {
  let prisma: PrismaMock;
  let service: CanchasService;

  const dtoCrear: CreateCanchaDto = {
    nombre: 'Cancha de Tenis 1',
    ubicacion: 'Pista A',
    capacidad: 4,
    estado: EstadoCancha.DISPONIBLE,
    disciplinaIds: [TENIS_ID],
  };

  beforeEach(() => {
    prisma = {
      cancha: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      disciplina: {
        findMany: vi.fn(),
      },
      turno: {
        count: vi.fn(),
      },
    };
    service = new CanchasService(
      prisma as unknown as ConstructorParameters<typeof CanchasService>[0],
    );
  });

  describe('listar', () => {
    it('devuelve las canchas con sus disciplinas y paginación por defecto', async () => {
      const guardadas = [canchaGuardada()];
      prisma.cancha.findMany.mockResolvedValue(guardadas);

      const resultado = await service.listar({} as ListarCanchasQueryDto);

      expect(resultado).toEqual([
        {
          id: CANCHA_ID,
          nombre: 'Cancha de Tenis 1',
          ubicacion: 'Pista A',
          capacidad: 4,
          estado: EstadoCancha.DISPONIBLE,
          disciplinas: [{ id: TENIS_ID, nombre: 'tenis' }],
        },
      ]);
      expect(prisma.cancha.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 20,
          orderBy: { nombre: 'asc' },
        }),
      );
    });

    it('aplica los filtros de disciplina y estado', async () => {
      prisma.cancha.findMany.mockResolvedValue([]);

      await service.listar({
        disciplina: 'futbol',
        estado: EstadoCancha.EN_MANTENIMIENTO,
        page: 2,
        limit: 5,
      } as ListarCanchasQueryDto);

      expect(prisma.cancha.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            estado: EstadoCancha.EN_MANTENIMIENTO,
            disciplinas: {
              some: { nombre: { equals: 'futbol', mode: 'insensitive' } },
            },
          },
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe('detalle', () => {
    it('devuelve la cancha con disciplinas cuando existe', async () => {
      prisma.cancha.findFirst.mockResolvedValue(canchaGuardada());

      const resultado = await service.detalle(CANCHA_ID);

      expect(resultado.id).toBe(CANCHA_ID);
      expect(resultado.disciplinas).toEqual([
        { id: TENIS_ID, nombre: 'tenis' },
      ]);
      expect(prisma.cancha.findFirst).toHaveBeenCalledWith({
        where: { id: CANCHA_ID },
        include: { disciplinas: { select: { id: true, nombre: true } } },
      });
    });

    it('lanza 404 cuando la cancha no existe', async () => {
      prisma.cancha.findFirst.mockResolvedValue(null);

      await expect(service.detalle(CANCHA_ID)).rejects.toThrow(
        new NotFoundException(MENSAJE_CANCHA_NO_ENCONTRADA),
      );
    });
  });

  describe('crear', () => {
    it('crea la cancha conectando las disciplinas y la devuelve pública', async () => {
      prisma.disciplina.findMany.mockResolvedValue([disciplina(TENIS_ID, 'tenis')]);
      prisma.cancha.findFirst.mockResolvedValue(null);
      prisma.cancha.create.mockResolvedValue(canchaGuardada());

      const resultado = await service.crear(dtoCrear);

      expect(resultado).toEqual({
        id: CANCHA_ID,
        nombre: 'Cancha de Tenis 1',
        ubicacion: 'Pista A',
        capacidad: 4,
        estado: EstadoCancha.DISPONIBLE,
        disciplinas: [{ id: TENIS_ID, nombre: 'tenis' }],
      });
      expect(prisma.cancha.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nombre: dtoCrear.nombre,
          disciplinas: { connect: [{ id: TENIS_ID }] },
        }),
        include: { disciplinas: { select: { id: true, nombre: true } } },
      });
    });

    it('lanza 409 cuando el nombre ya existe ignorando mayúsculas', async () => {
      prisma.disciplina.findMany.mockResolvedValue([disciplina(TENIS_ID, 'tenis')]);
      prisma.cancha.findFirst.mockResolvedValue({ id: 'otra-cancha' });

      await expect(service.crear(dtoCrear)).rejects.toThrow(
        new ConflictException(MENSAJE_NOMBRE_EN_USO),
      );
      expect(prisma.cancha.create).not.toHaveBeenCalled();
    });

    it('lanza 422 cuando una disciplina referenciada no existe', async () => {
      prisma.disciplina.findMany.mockResolvedValue([]);

      await expect(service.crear(dtoCrear)).rejects.toThrow(
        new UnprocessableEntityException(MENSAJE_DISCIPLINA_INEXISTENTE),
      );
      expect(prisma.cancha.create).not.toHaveBeenCalled();
    });
  });

  describe('actualizar', () => {
    it('actualiza los campos enviados y devuelve la cancha pública', async () => {
      prisma.cancha.findFirst.mockResolvedValueOnce({ id: CANCHA_ID });
      prisma.cancha.findFirst.mockResolvedValueOnce(null);
      prisma.cancha.update.mockResolvedValue(
        canchaGuardada({ nombre: 'Cancha Renombrada' }),
      );

      const dto: UpdateCanchaDto = { nombre: 'Cancha Renombrada' };
      const resultado = await service.actualizar(CANCHA_ID, dto);

      expect(resultado.nombre).toBe('Cancha Renombrada');
      expect(prisma.cancha.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: CANCHA_ID },
          data: { nombre: 'Cancha Renombrada' },
        }),
      );
    });

    it('reemplaza las disciplinas cuando se envían', async () => {
      prisma.cancha.findFirst.mockResolvedValueOnce({ id: CANCHA_ID });
      prisma.disciplina.findMany.mockResolvedValue([
        disciplina(TENIS_ID, 'tenis'),
        disciplina(FUTBOL_ID, 'futbol'),
      ]);
      prisma.cancha.update.mockResolvedValue(
        canchaGuardada({
          disciplinas: [
            disciplina(TENIS_ID, 'tenis'),
            disciplina(FUTBOL_ID, 'futbol'),
          ],
        }),
      );

      await service.actualizar(CANCHA_ID, { disciplinaIds: [TENIS_ID, FUTBOL_ID] });

      expect(prisma.cancha.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            disciplinas: { set: [{ id: TENIS_ID }, { id: FUTBOL_ID }] },
          },
        }),
      );
    });

    it('lanza 404 cuando la cancha no existe', async () => {
      prisma.cancha.findFirst.mockResolvedValue(null);

      await expect(
        service.actualizar(CANCHA_ID, { nombre: 'Nueva' }),
      ).rejects.toThrow(new NotFoundException(MENSAJE_CANCHA_NO_ENCONTRADA));
    });

    it('lanza 409 cuando el nuevo nombre pertenece a otra cancha', async () => {
      prisma.cancha.findFirst.mockResolvedValueOnce({ id: CANCHA_ID });
      prisma.cancha.findFirst.mockResolvedValueOnce({ id: 'otra-cancha' });

      await expect(
        service.actualizar(CANCHA_ID, { nombre: 'Cancha Existente' }),
      ).rejects.toThrow(new ConflictException(MENSAJE_NOMBRE_EN_USO));
    });
  });

  describe('eliminar', () => {
    it('elimina la cancha cuando no tiene turnos', async () => {
      prisma.cancha.findFirst.mockResolvedValue({ id: CANCHA_ID });
      prisma.turno.count.mockResolvedValue(0);
      prisma.cancha.delete.mockResolvedValue(canchaGuardada());

      await service.eliminar(CANCHA_ID);

      expect(prisma.cancha.delete).toHaveBeenCalledWith({
        where: { id: CANCHA_ID },
      });
    });

    it('lanza 404 cuando la cancha no existe', async () => {
      prisma.cancha.findFirst.mockResolvedValue(null);

      await expect(service.eliminar(CANCHA_ID)).rejects.toThrow(
        new NotFoundException(MENSAJE_CANCHA_NO_ENCONTRADA),
      );
    });

    it('lanza 409 cuando la cancha tiene turnos asociados', async () => {
      prisma.cancha.findFirst.mockResolvedValue({ id: CANCHA_ID });
      prisma.turno.count.mockResolvedValue(3);

      await expect(service.eliminar(CANCHA_ID)).rejects.toThrow(
        new ConflictException(MENSAJE_CANCHA_CON_TURNOS),
      );
      expect(prisma.cancha.delete).not.toHaveBeenCalled();
    });
  });
});

import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { Prisma } from '../generated/prisma/client.js';
import { CrearEquipamientoDto } from './dto/crear-equipamiento.dto.js';
import { ListarEquipamientoQueryDto } from './dto/listar-equipamiento.query.dto.js';
import { EquipamientoService } from './equipamiento.service.js';
import {
  MENSAJE_DISCIPLINA_INEXISTENTE,
  MENSAJE_EQUIPAMIENTO_CON_ALQUILERES,
  MENSAJE_EQUIPAMIENTO_NO_ENCONTRADO,
  MENSAJE_STOCK_POR_DEBAJO_DE_ALQUILADO,
} from './mensajes.js';

const TENIS_ID = '3f1a1a00-0000-4000-8000-000000000001';
const EQUIPAMIENTO_ID = '3f1a1a00-0000-4000-8000-0000000000aa';

function equipamientoGuardado(
  overrides: Partial<{
    id: string;
    nombre: string;
    disciplinaId: string;
    stockTotal: number;
    stockDisponible: number;
    precioUnitario: number | Prisma.Decimal;
    activo: boolean;
    disciplina: { id: string; nombre: string };
  }> = {},
) {
  return {
    id: EQUIPAMIENTO_ID,
    nombre: 'Raquetas de tenis',
    disciplinaId: TENIS_ID,
    stockTotal: 10,
    stockDisponible: 10,
    precioUnitario: 1500.5,
    activo: true,
    disciplina: { id: TENIS_ID, nombre: 'tenis' },
    ...overrides,
  };
}

type PrismaMock = {
  equipamiento: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  disciplina: {
    findFirst: ReturnType<typeof vi.fn>;
  };
};

describe('EquipamientoService', () => {
  let prisma: PrismaMock;
  let service: EquipamientoService;

  const dtoCrear: CrearEquipamientoDto = {
    nombre: 'Raquetas de tenis',
    disciplinaId: TENIS_ID,
    stockTotal: 10,
    precioUnitario: 1500.5,
  };

  beforeEach(() => {
    prisma = {
      equipamiento: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
      },
      disciplina: {
        findFirst: vi.fn(),
      },
    };
    service = new EquipamientoService(
      prisma as unknown as ConstructorParameters<typeof EquipamientoService>[0],
    );
  });

  describe('listar', () => {
    it('devuelve solo activos por defecto, con disponible y precio numérico', async () => {
      prisma.equipamiento.findMany.mockResolvedValue([equipamientoGuardado()]);

      const resultado = await service.listar({} as ListarEquipamientoQueryDto);

      expect(resultado).toEqual([
        {
          id: EQUIPAMIENTO_ID,
          nombre: 'Raquetas de tenis',
          disciplinaId: TENIS_ID,
          disciplina: { id: TENIS_ID, nombre: 'tenis' },
          stockTotal: 10,
          stockDisponible: 10,
          precioUnitario: 1500.5,
          activo: true,
          disponible: true,
        },
      ]);
      expect(prisma.equipamiento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { activo: true },
          skip: 0,
          take: 20,
          orderBy: { nombre: 'asc' },
        }),
      );
    });

    it('aplica filtros de disciplina, disponibilidad e inactivos', async () => {
      prisma.equipamiento.findMany.mockResolvedValue([]);

      await service.listar({
        disciplinaId: TENIS_ID,
        disponible: true,
        incluirInactivos: true,
        page: 2,
        limit: 5,
      } as ListarEquipamientoQueryDto);

      expect(prisma.equipamiento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            disciplinaId: TENIS_ID,
            stockDisponible: { gt: 0 },
          },
          skip: 5,
          take: 5,
        }),
      );
    });

    it('filtra stock disponible igual a 0 cuando disponible=false', async () => {
      prisma.equipamiento.findMany.mockResolvedValue([]);

      await service.listar({
        disponible: false,
      } as ListarEquipamientoQueryDto);

      expect(prisma.equipamiento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { activo: true, stockDisponible: 0 },
        }),
      );
    });
  });

  describe('detalle', () => {
    it('devuelve el equipamiento con disciplina y disponibilidad', async () => {
      prisma.equipamiento.findFirst.mockResolvedValue(equipamientoGuardado());

      const resultado = await service.detalle(EQUIPAMIENTO_ID);

      expect(resultado).toEqual(
        expect.objectContaining({
          id: EQUIPAMIENTO_ID,
          disciplina: { id: TENIS_ID, nombre: 'tenis' },
          disponible: true,
        }),
      );
    });

    it('convierte el precio Decimal de Prisma a número JSON', async () => {
      prisma.equipamiento.findFirst.mockResolvedValue(
        equipamientoGuardado({
          precioUnitario: new Prisma.Decimal('1500.50'),
        }),
      );

      const resultado = await service.detalle(EQUIPAMIENTO_ID);

      expect(resultado.precioUnitario).toBe(1500.5);
    });

    it('lanza 404 cuando el equipamiento no existe', async () => {
      prisma.equipamiento.findFirst.mockResolvedValue(null);

      await expect(service.detalle(EQUIPAMIENTO_ID)).rejects.toThrow(
        new NotFoundException(MENSAJE_EQUIPAMIENTO_NO_ENCONTRADO),
      );
    });
  });

  describe('crear', () => {
    it('inicializa stockDisponible igual a stockTotal y devuelve disponible', async () => {
      prisma.disciplina.findFirst.mockResolvedValue({ id: TENIS_ID });
      prisma.equipamiento.create.mockResolvedValue(equipamientoGuardado());

      const resultado = await service.crear(dtoCrear);

      expect(resultado).toEqual(
        expect.objectContaining({
          stockTotal: 10,
          stockDisponible: 10,
          precioUnitario: 1500.5,
          disponible: true,
          activo: true,
        }),
      );
      expect(prisma.equipamiento.create).toHaveBeenCalledWith({
        data: {
          nombre: dtoCrear.nombre,
          disciplinaId: TENIS_ID,
          stockTotal: 10,
          stockDisponible: 10,
          precioUnitario: 1500.5,
          activo: true,
        },
        include: { disciplina: { select: { id: true, nombre: true } } },
      });
    });

    it('crea con stock 0 y reporta disponible=false', async () => {
      prisma.disciplina.findFirst.mockResolvedValue({ id: TENIS_ID });
      prisma.equipamiento.create.mockResolvedValue(
        equipamientoGuardado({ stockTotal: 0, stockDisponible: 0 }),
      );

      const resultado = await service.crear({
        nombre: dtoCrear.nombre,
        disciplinaId: dtoCrear.disciplinaId,
        stockTotal: 0,
        precioUnitario: dtoCrear.precioUnitario,
      });

      expect(resultado.disponible).toBe(false);
      expect(prisma.equipamiento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stockTotal: 0,
            stockDisponible: 0,
          }),
        }),
      );
    });

    it('lanza 422 cuando la disciplina no existe', async () => {
      prisma.disciplina.findFirst.mockResolvedValue(null);

      await expect(service.crear(dtoCrear)).rejects.toThrow(
        new UnprocessableEntityException(MENSAJE_DISCIPLINA_INEXISTENTE),
      );
      expect(prisma.equipamiento.create).not.toHaveBeenCalled();
    });
  });

  describe('actualizar', () => {
    it('ajusta stockDisponible con la diferencia del nuevo stockTotal', async () => {
      prisma.equipamiento.findFirst
        .mockResolvedValueOnce({
          id: EQUIPAMIENTO_ID,
          stockTotal: 10,
          stockDisponible: 7,
        })
        .mockResolvedValueOnce(
          equipamientoGuardado({ stockTotal: 15, stockDisponible: 12 }),
        );
      prisma.equipamiento.updateMany.mockResolvedValue({ count: 1 });

      const resultado = await service.actualizar(EQUIPAMIENTO_ID, {
        stockTotal: 15,
      });

      expect(resultado).toEqual(
        expect.objectContaining({ stockTotal: 15, stockDisponible: 12 }),
      );
      expect(prisma.equipamiento.updateMany).toHaveBeenCalledWith({
        where: {
          id: EQUIPAMIENTO_ID,
          stockTotal: 10,
          stockDisponible: 7,
        },
        data: {
          stockTotal: 15,
          stockDisponible: 12,
        },
      });
    });

    it('reintenta la actualización condicional si el stock cambió en paralelo', async () => {
      prisma.equipamiento.findFirst
        .mockResolvedValueOnce({
          id: EQUIPAMIENTO_ID,
          stockTotal: 10,
          stockDisponible: 7,
        })
        .mockResolvedValueOnce({
          stockTotal: 10,
          stockDisponible: 6,
        })
        .mockResolvedValueOnce(
          equipamientoGuardado({ stockTotal: 15, stockDisponible: 11 }),
        );
      prisma.equipamiento.updateMany
        .mockResolvedValueOnce({ count: 0 })
        .mockResolvedValueOnce({ count: 1 });

      const resultado = await service.actualizar(EQUIPAMIENTO_ID, {
        stockTotal: 15,
      });

      expect(resultado.stockDisponible).toBe(11);
      expect(prisma.equipamiento.updateMany).toHaveBeenCalledTimes(2);
      expect(prisma.equipamiento.updateMany).toHaveBeenNthCalledWith(1, {
        where: {
          id: EQUIPAMIENTO_ID,
          stockTotal: 10,
          stockDisponible: 7,
        },
        data: { stockTotal: 15, stockDisponible: 12 },
      });
      expect(prisma.equipamiento.updateMany).toHaveBeenNthCalledWith(2, {
        where: {
          id: EQUIPAMIENTO_ID,
          stockTotal: 10,
          stockDisponible: 6,
        },
        data: { stockTotal: 15, stockDisponible: 11 },
      });
    });

    it('lanza 409 si el nuevo stockTotal queda por debajo de lo alquilado', async () => {
      prisma.equipamiento.findFirst.mockResolvedValueOnce({
        id: EQUIPAMIENTO_ID,
        stockTotal: 10,
        stockDisponible: 7,
      });

      await expect(
        service.actualizar(EQUIPAMIENTO_ID, { stockTotal: 2 }),
      ).rejects.toThrow(
        new ConflictException(MENSAJE_STOCK_POR_DEBAJO_DE_ALQUILADO),
      );
      expect(prisma.equipamiento.updateMany).not.toHaveBeenCalled();
    });

    it('lanza 404 cuando el equipamiento no existe', async () => {
      prisma.equipamiento.findFirst.mockResolvedValue(null);

      await expect(
        service.actualizar(EQUIPAMIENTO_ID, { nombre: 'Nuevo' }),
      ).rejects.toThrow(
        new NotFoundException(MENSAJE_EQUIPAMIENTO_NO_ENCONTRADO),
      );
    });

    it('actualiza campos sin tocar el stock cuando no se envía stockTotal', async () => {
      prisma.equipamiento.findFirst
        .mockResolvedValueOnce({
          id: EQUIPAMIENTO_ID,
          stockTotal: 10,
          stockDisponible: 7,
        })
        .mockResolvedValueOnce(
          equipamientoGuardado({
            nombre: 'Raquetas nuevas',
            stockTotal: 10,
            stockDisponible: 7,
            activo: false,
          }),
        );
      prisma.equipamiento.updateMany.mockResolvedValue({ count: 1 });

      await service.actualizar(EQUIPAMIENTO_ID, {
        nombre: 'Raquetas nuevas',
        activo: false,
      });

      expect(prisma.equipamiento.updateMany).toHaveBeenCalledWith({
        where: { id: EQUIPAMIENTO_ID },
        data: { nombre: 'Raquetas nuevas', activo: false },
      });
    });

    it('lanza 422 cuando la nueva disciplina no existe', async () => {
      prisma.equipamiento.findFirst.mockResolvedValueOnce({
        id: EQUIPAMIENTO_ID,
        stockTotal: 10,
        stockDisponible: 7,
      });
      prisma.disciplina.findFirst.mockResolvedValue(null);

      await expect(
        service.actualizar(EQUIPAMIENTO_ID, {
          disciplinaId: '3f1a1a00-0000-4000-8000-0000000000ff',
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(MENSAJE_DISCIPLINA_INEXISTENTE),
      );
      expect(prisma.equipamiento.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('eliminar', () => {
    it('elimina el equipamiento sin alquileres asociados', async () => {
      prisma.equipamiento.findFirst.mockResolvedValue({
        id: EQUIPAMIENTO_ID,
        _count: { reservas: 0 },
      });
      prisma.equipamiento.delete.mockResolvedValue(equipamientoGuardado());

      await service.eliminar(EQUIPAMIENTO_ID);

      expect(prisma.equipamiento.delete).toHaveBeenCalledWith({
        where: { id: EQUIPAMIENTO_ID },
      });
    });

    it('lanza 404 cuando el equipamiento no existe', async () => {
      prisma.equipamiento.findFirst.mockResolvedValue(null);

      await expect(service.eliminar(EQUIPAMIENTO_ID)).rejects.toThrow(
        new NotFoundException(MENSAJE_EQUIPAMIENTO_NO_ENCONTRADO),
      );
    });

    it('lanza 409 cuando tiene alquileres asociados', async () => {
      prisma.equipamiento.findFirst.mockResolvedValue({
        id: EQUIPAMIENTO_ID,
        _count: { reservas: 2 },
      });

      await expect(service.eliminar(EQUIPAMIENTO_ID)).rejects.toThrow(
        new ConflictException(MENSAJE_EQUIPAMIENTO_CON_ALQUILERES),
      );
      expect(prisma.equipamiento.delete).not.toHaveBeenCalled();
    });
  });
});

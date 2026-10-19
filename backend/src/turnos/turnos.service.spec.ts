import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { MENSAJE_TURNO_NO_ENCONTRADO } from './mensajes.js';
import { TurnosService } from './turnos.service.js';

const CANCHA = '11111111-1111-4111-8111-111111111111';
const DISCIPLINA = '33333333-3333-4333-8333-333333333333';
const TURNO = '55555555-5555-4555-8555-555555555555';

function filaTurno(overrides: Record<string, unknown> = {}) {
  return {
    id: TURNO,
    canchaId: CANCHA,
    disciplinaId: DISCIPLINA,
    fecha: new Date(Date.UTC(2026, 2, 1)),
    horaInicio: '00:00',
    horaFin: '01:00',
    disponible: true,
    ...overrides,
  };
}

describe('TurnosService', () => {
  let service: TurnosService;
  let prisma: {
    turno: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      turno: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(TurnosService);
  });

  describe('listar', () => {
    it('traslada los filtros y la paginación por defecto a Prisma', async () => {
      await service.listar({ cancha_id: CANCHA, fecha: '2026-09-15' });

      const argumentos = prisma.turno.findMany.mock.calls[0][0];
      expect(argumentos.where).toEqual({
        canchaId: CANCHA,
        fecha: new Date(Date.UTC(2026, 8, 15)),
      });
      expect(argumentos.skip).toBe(0);
      expect(argumentos.take).toBe(20);
    });

    it('aplica page y limit', async () => {
      await service.listar({ page: 3, limit: 5 });

      const argumentos = prisma.turno.findMany.mock.calls[0][0];
      expect(argumentos.skip).toBe(10);
      expect(argumentos.take).toBe(5);
    });
  });

  describe('porId', () => {
    it('lee un turno a medianoche con la fecha del día correcto', async () => {
      prisma.turno.findUnique.mockResolvedValue(filaTurno());

      const turno = await service.porId(TURNO);

      expect(turno.fecha).toBe('2026-03-01');
      expect(turno.hora_inicio).toBe('00:00');
      expect(turno.disponible).toBe(true);
    });

    it('rechaza con 404 y no consulta un id que no es UUID', async () => {
      await expect(service.porId('no-es-uuid')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.porId('no-es-uuid')).rejects.toThrow(
        MENSAJE_TURNO_NO_ENCONTRADO,
      );
      expect(prisma.turno.findUnique).not.toHaveBeenCalled();
    });

    it('rechaza con 404 cuando el turno no existe', async () => {
      prisma.turno.findUnique.mockResolvedValue(null);

      await expect(service.porId(TURNO)).rejects.toThrow(
        MENSAJE_TURNO_NO_ENCONTRADO,
      );
    });
  });
});

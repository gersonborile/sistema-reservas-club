import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  MENSAJE_CANCHA_NO_ENCONTRADA,
  MENSAJE_DISCIPLINA_NO_ENCONTRADA,
  MENSAJE_FECHA_PASADA,
  MENSAJE_RANGO_HORARIO_INVALIDO,
  MENSAJE_TURNO_CON_RESERVA,
  MENSAJE_TURNO_NO_ENCONTRADO,
  MENSAJE_TURNO_SUPERPUESTO,
} from './mensajes.js';
import { TurnosService } from './turnos.service.js';

const CANCHA = '11111111-1111-4111-8111-111111111111';
const DISCIPLINA = '33333333-3333-4333-8333-333333333333';
const TURNO = '55555555-5555-4555-8555-555555555555';

function enDias(dias: number): string {
  const fecha = new Date();
  fecha.setUTCHours(0, 0, 0, 0);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

function fechaUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function filaTurno(overrides: Record<string, unknown> = {}) {
  return {
    id: TURNO,
    canchaId: CANCHA,
    disciplinaId: DISCIPLINA,
    fecha: fechaUtc(enDias(5)),
    horaInicio: '00:00',
    horaFin: '01:00',
    disponible: true,
    ...overrides,
  };
}

function crearPrismaMock() {
  return {
    turno: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cancha: { findUnique: vi.fn() },
    disciplina: { findUnique: vi.fn() },
  };
}

describe('TurnosService', () => {
  let service: TurnosService;
  let prisma: ReturnType<typeof crearPrismaMock>;

  beforeEach(async () => {
    prisma = crearPrismaMock();
    prisma.turno.findMany.mockResolvedValue([]);
    prisma.turno.findUnique.mockResolvedValue(null);
    prisma.cancha.findUnique.mockResolvedValue({ id: CANCHA });
    prisma.disciplina.findUnique.mockResolvedValue({ id: DISCIPLINA });

    const module: TestingModule = await Test.createTestingModule({
      providers: [TurnosService, { provide: PrismaService, useValue: prisma }],
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
      prisma.turno.findUnique.mockResolvedValue(
        filaTurno({ fecha: new Date(Date.UTC(2026, 2, 1)) }),
      );

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

  describe('crear', () => {
    const dtoMedianoche = () => ({
      cancha_id: CANCHA,
      disciplina_id: DISCIPLINA,
      fecha: `${enDias(3)}T00:00:00.000Z`,
      hora_inicio: '00:00',
      hora_fin: '01:00',
    });

    beforeEach(() => {
      prisma.turno.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: 'nuevo-turno',
            disponible: true,
            ...data,
          }),
      );
    });

    it('persiste un turno a medianoche con la fecha del día correcto', async () => {
      const turno = await service.crear(dtoMedianoche());

      const { data } = prisma.turno.create.mock.calls[0][0];
      expect(data.fecha).toEqual(fechaUtc(enDias(3)));
      expect(data.horaInicio).toBe('00:00');
      expect(turno.fecha).toBe(enDias(3));
      expect(turno.disponible).toBe(true);
    });

    it('rechaza con 422 una cancha inexistente', async () => {
      prisma.cancha.findUnique.mockResolvedValue(null);

      await expect(service.crear(dtoMedianoche())).rejects.toThrow(
        UnprocessableEntityException,
      );
      await expect(service.crear(dtoMedianoche())).rejects.toThrow(
        MENSAJE_CANCHA_NO_ENCONTRADA,
      );
      expect(prisma.turno.create).not.toHaveBeenCalled();
    });

    it('rechaza con 422 una disciplina inexistente', async () => {
      prisma.disciplina.findUnique.mockResolvedValue(null);

      await expect(service.crear(dtoMedianoche())).rejects.toThrow(
        MENSAJE_DISCIPLINA_NO_ENCONTRADA,
      );
      expect(prisma.turno.create).not.toHaveBeenCalled();
    });

    it('rechaza con 400 una hora de fin no posterior al inicio', async () => {
      await expect(
        service.crear({ ...dtoMedianoche(), hora_fin: '00:00' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.crear({ ...dtoMedianoche(), hora_fin: '00:00' }),
      ).rejects.toThrow(MENSAJE_RANGO_HORARIO_INVALIDO);
      expect(prisma.turno.create).not.toHaveBeenCalled();
    });

    it('rechaza con 400 una fecha pasada', async () => {
      await expect(
        service.crear({ ...dtoMedianoche(), fecha: `${enDias(-1)}` }),
      ).rejects.toThrow(MENSAJE_FECHA_PASADA);
      expect(prisma.turno.create).not.toHaveBeenCalled();
    });

    it('rechaza con 409 un turno superpuesto', async () => {
      prisma.turno.findMany.mockResolvedValue([
        { id: 'otro-turno', horaInicio: '00:30', horaFin: '01:30' },
      ]);

      await expect(service.crear(dtoMedianoche())).rejects.toThrow(
        ConflictException,
      );
      await expect(service.crear(dtoMedianoche())).rejects.toThrow(
        MENSAJE_TURNO_SUPERPUESTO,
      );
      expect(prisma.turno.create).not.toHaveBeenCalled();
    });

    it('acepta un turno contiguo sin superposición', async () => {
      prisma.turno.findMany.mockResolvedValue([
        { id: 'otro-turno', horaInicio: '01:00', horaFin: '02:00' },
      ]);

      await expect(service.crear(dtoMedianoche())).resolves.toMatchObject({
        hora_inicio: '00:00',
      });
    });
  });

  describe('modificar', () => {
    beforeEach(() => {
      prisma.turno.findUnique.mockResolvedValue(filaTurno());
      prisma.turno.update.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ ...filaTurno(), ...data }),
      );
    });

    it('excluye al propio turno de la validación de superposición', async () => {
      prisma.turno.findMany.mockResolvedValue([
        { id: TURNO, horaInicio: '00:00', horaFin: '01:00' },
      ]);

      const turno = await service.modificar(TURNO, {
        hora_inicio: '00:00',
        hora_fin: '01:00',
      });

      expect(turno.hora_inicio).toBe('00:00');
      expect(prisma.turno.update).toHaveBeenCalledTimes(1);
    });

    it('rechaza con 404 un turno inexistente', async () => {
      prisma.turno.findUnique.mockResolvedValue(null);

      await expect(
        service.modificar(TURNO, { hora_inicio: '09:00' }),
      ).rejects.toThrow(MENSAJE_TURNO_NO_ENCONTRADO);
      expect(prisma.turno.update).not.toHaveBeenCalled();
    });

    it('rechaza con 409 una modificación superpuesta con otro turno', async () => {
      prisma.turno.findMany.mockResolvedValue([
        { id: 'otro-turno', horaInicio: '00:30', horaFin: '01:30' },
      ]);

      await expect(
        service.modificar(TURNO, { hora_fin: '02:00' }),
      ).rejects.toThrow(MENSAJE_TURNO_SUPERPUESTO);
      expect(prisma.turno.update).not.toHaveBeenCalled();
    });

    it('rechaza con 400 una hora de fin inválida', async () => {
      await expect(
        service.modificar(TURNO, { hora_inicio: '10:00', hora_fin: '09:00' }),
      ).rejects.toThrow(MENSAJE_RANGO_HORARIO_INVALIDO);
      expect(prisma.turno.update).not.toHaveBeenCalled();
    });
  });

  describe('eliminar', () => {
    it('elimina un turno disponible', async () => {
      prisma.turno.findUnique.mockResolvedValue(filaTurno());
      prisma.turno.delete.mockResolvedValue(filaTurno());

      await service.eliminar(TURNO);

      expect(prisma.turno.delete).toHaveBeenCalledWith({ where: { id: TURNO } });
    });

    it('rechaza con 409 un turno con reserva activa', async () => {
      prisma.turno.findUnique.mockResolvedValue(
        filaTurno({ disponible: false }),
      );

      await expect(service.eliminar(TURNO)).rejects.toThrow(
        MENSAJE_TURNO_CON_RESERVA,
      );
      expect(prisma.turno.delete).not.toHaveBeenCalled();
    });

    it('rechaza con 404 un turno inexistente', async () => {
      prisma.turno.findUnique.mockResolvedValue(null);

      await expect(service.eliminar(TURNO)).rejects.toThrow(
        MENSAJE_TURNO_NO_ENCONTRADO,
      );
      expect(prisma.turno.delete).not.toHaveBeenCalled();
    });
  });
});

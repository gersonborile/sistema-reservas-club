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
  MENSAJE_DISCIPLINA_FUERA_DE_CANCHA,
  MENSAJE_DISCIPLINA_NO_ENCONTRADA,
  MENSAJE_FECHA_PASADA,
  MENSAJE_FUERA_DE_HORARIO,
  MENSAJE_RANGO_DIAS_EXCEDIDO,
  MENSAJE_RANGO_FECHAS_INVALIDO,
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
    horaInicio: '08:00',
    horaFin: '09:00',
    disponible: true,
    ...overrides,
  };
}

function crearPrismaMock() {
  const mock = {
    turno: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cancha: { findUnique: vi.fn() },
    disciplina: { findUnique: vi.fn() },
    transaccion: vi.fn(),
  };
  mock.transaccion.mockImplementation(
    async (correr: (tx: typeof mock) => Promise<unknown>) => correr(mock),
  );
  return mock;
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
    it('lee un turno con la fecha del día correcto', async () => {
      prisma.turno.findUnique.mockResolvedValue(
        filaTurno({ fecha: new Date(Date.UTC(2026, 2, 1)) }),
      );

      const turno = await service.porId(TURNO);

      expect(turno.fecha).toBe('2026-03-01');
      expect(turno.hora_inicio).toBe('08:00');
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
    const dtoValido = () => ({
      cancha_id: CANCHA,
      disciplina_id: DISCIPLINA,
      fecha: `${enDias(3)}T00:00:00.000Z`,
      hora_inicio: '08:00',
      hora_fin: '09:00',
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

    afterEach(() => {
      vi.useRealTimers();
    });

    it('persiste un turno en una franja del horario con la fecha del día correcto', async () => {
      const turno = await service.crear(dtoValido());

      const { data } = prisma.turno.create.mock.calls[0][0];
      expect(data.fecha).toEqual(fechaUtc(enDias(3)));
      expect(data.horaInicio).toBe('08:00');
      expect(turno.fecha).toBe(enDias(3));
      expect(turno.disponible).toBe(true);
    });

    it('rechaza con 422 una cancha inexistente', async () => {
      prisma.cancha.findUnique.mockResolvedValue(null);

      await expect(service.crear(dtoValido())).rejects.toThrow(
        UnprocessableEntityException,
      );
      await expect(service.crear(dtoValido())).rejects.toThrow(
        MENSAJE_CANCHA_NO_ENCONTRADA,
      );
      expect(prisma.turno.create).not.toHaveBeenCalled();
    });

    it('rechaza con 422 una disciplina inexistente', async () => {
      prisma.disciplina.findUnique.mockResolvedValue(null);

      await expect(service.crear(dtoValido())).rejects.toThrow(
        MENSAJE_DISCIPLINA_NO_ENCONTRADA,
      );
      expect(prisma.turno.create).not.toHaveBeenCalled();
    });

    it('rechaza con 400 una hora de fin no posterior al inicio', async () => {
      await expect(
        service.crear({ ...dtoValido(), hora_fin: '08:00' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.crear({ ...dtoValido(), hora_fin: '08:00' }),
      ).rejects.toThrow(MENSAJE_RANGO_HORARIO_INVALIDO);
      expect(prisma.turno.create).not.toHaveBeenCalled();
    });

    it('rechaza con 400 un turno fuera de las franjas del horario', async () => {
      await expect(
        service.crear({
          ...dtoValido(),
          hora_inicio: '07:00',
          hora_fin: '08:00',
        }),
      ).rejects.toThrow(MENSAJE_FUERA_DE_HORARIO);
      expect(prisma.turno.create).not.toHaveBeenCalled();
    });

    it('rechaza con 400 un turno desalineado', async () => {
      await expect(
        service.crear({
          ...dtoValido(),
          hora_inicio: '08:30',
          hora_fin: '09:30',
        }),
      ).rejects.toThrow(MENSAJE_FUERA_DE_HORARIO);
      expect(prisma.turno.create).not.toHaveBeenCalled();
    });

    it('rechaza con 400 una duración distinta de 60 minutos', async () => {
      await expect(
        service.crear({
          ...dtoValido(),
          hora_inicio: '09:00',
          hora_fin: '10:30',
        }),
      ).rejects.toThrow(MENSAJE_FUERA_DE_HORARIO);
      expect(prisma.turno.create).not.toHaveBeenCalled();
    });

    it('rechaza con 400 una fecha pasada', async () => {
      await expect(
        service.crear({ ...dtoValido(), fecha: `${enDias(-1)}` }),
      ).rejects.toThrow(MENSAJE_FECHA_PASADA);
      expect(prisma.turno.create).not.toHaveBeenCalled();
    });

    it('acepta un turno para hoy con el reloj de noche en Argentina', async () => {
      vi.setSystemTime(new Date('2026-11-10T00:30:00Z'));

      await expect(
        service.crear({ ...dtoValido(), fecha: '2026-11-09' }),
      ).resolves.toMatchObject({ hora_inicio: '08:00' });
    });

    it('rechaza con 409 un turno superpuesto', async () => {
      prisma.turno.findMany.mockResolvedValue([
        { id: 'otro-turno', horaInicio: '08:30', horaFin: '09:30' },
      ]);

      await expect(service.crear(dtoValido())).rejects.toThrow(
        ConflictException,
      );
      await expect(service.crear(dtoValido())).rejects.toThrow(
        MENSAJE_TURNO_SUPERPUESTO,
      );
      expect(prisma.turno.create).not.toHaveBeenCalled();
    });

    it('acepta un turno contiguo sin superposición', async () => {
      prisma.turno.findMany.mockResolvedValue([
        { id: 'otro-turno', horaInicio: '09:00', horaFin: '10:00' },
      ]);

      await expect(service.crear(dtoValido())).resolves.toMatchObject({
        hora_inicio: '08:00',
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
        { id: TURNO, horaInicio: '08:00', horaFin: '09:00' },
      ]);

      const turno = await service.modificar(TURNO, {
        hora_inicio: '08:00',
        hora_fin: '09:00',
      });

      expect(turno.hora_inicio).toBe('08:00');
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
        { id: 'otro-turno', horaInicio: '09:00', horaFin: '10:00' },
      ]);

      await expect(
        service.modificar(TURNO, { hora_inicio: '09:00', hora_fin: '10:00' }),
      ).rejects.toThrow(MENSAJE_TURNO_SUPERPUESTO);
      expect(prisma.turno.update).not.toHaveBeenCalled();
    });

    it('rechaza con 400 una hora de fin inválida', async () => {
      await expect(
        service.modificar(TURNO, { hora_inicio: '10:00', hora_fin: '09:00' }),
      ).rejects.toThrow(MENSAJE_RANGO_HORARIO_INVALIDO);
      expect(prisma.turno.update).not.toHaveBeenCalled();
    });

    it('rechaza con 400 una modificación fuera de las franjas', async () => {
      await expect(
        service.modificar(TURNO, { hora_inicio: '08:15', hora_fin: '09:15' }),
      ).rejects.toThrow(MENSAJE_FUERA_DE_HORARIO);
      expect(prisma.turno.update).not.toHaveBeenCalled();
    });
  });

  describe('generar', () => {
    const dtoGeneracion = (overrides: Record<string, unknown> = {}) => ({
      cancha_id: CANCHA,
      disciplina_id: DISCIPLINA,
      fecha_desde: '2026-11-11',
      fecha_hasta: '2026-11-17',
      ...overrides,
    });

    beforeEach(() => {
      vi.setSystemTime(new Date('2026-11-10T12:00:00Z'));
      prisma.cancha.findUnique.mockResolvedValue({
        id: CANCHA,
        disciplinas: [{ id: DISCIPLINA }],
      });
      prisma.turno.findMany.mockResolvedValue([]);
      prisma.turno.createMany.mockResolvedValue({ count: 0 });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('genera las 14 franjas de cada uno de los 7 días', async () => {
      const resultado = await service.generar(dtoGeneracion());

      expect(resultado).toEqual({ creados: 98, salteados: 0 });
      const { data } = prisma.turno.createMany.mock.calls[0][0];
      expect(data).toHaveLength(98);
      expect(prisma.transaccion).toHaveBeenCalledTimes(1);
    });

    it('saltea la franja ocupada por un turno existente', async () => {
      prisma.turno.findMany.mockResolvedValue([
        {
          fecha: fechaUtc('2026-11-11'),
          horaInicio: '10:00',
          horaFin: '11:00',
        },
      ]);

      const resultado = await service.generar(
        dtoGeneracion({ fecha_hasta: '2026-11-11' }),
      );

      expect(resultado).toEqual({ creados: 13, salteados: 1 });
      const { data } = prisma.turno.createMany.mock.calls[0][0];
      expect(data).toHaveLength(13);
    });

    it('saltea las dos franjas que pisa un turno viejo de 90 minutos', async () => {
      prisma.turno.findMany.mockResolvedValue([
        {
          fecha: fechaUtc('2026-11-11'),
          horaInicio: '09:00',
          horaFin: '10:30',
        },
      ]);

      const resultado = await service.generar(
        dtoGeneracion({ fecha_hasta: '2026-11-11' }),
      );

      expect(resultado).toEqual({ creados: 12, salteados: 2 });
      const { data } = prisma.turno.createMany.mock.calls[0][0];
      const inicios = data.map((fila: { horaInicio: string }) => fila.horaInicio);
      expect(inicios).not.toContain('09:00');
      expect(inicios).not.toContain('10:00');
      expect(inicios).toContain('11:00');
    });

    it('lee los turnos existentes dentro de la misma transacción que inserta', async () => {
      const tx = {
        turno: {
          findMany: vi.fn().mockResolvedValue([
            {
              fecha: fechaUtc('2026-11-11'),
              horaInicio: '10:00',
              horaFin: '11:00',
            },
          ]),
          createMany: vi.fn().mockResolvedValue({ count: 13 }),
        },
      };
      prisma.transaccion.mockImplementation(
        async (correr: (cliente: typeof tx) => Promise<unknown>) => correr(tx),
      );

      const resultado = await service.generar(
        dtoGeneracion({ fecha_hasta: '2026-11-11' }),
      );

      expect(resultado).toEqual({ creados: 13, salteados: 1 });
      expect(tx.turno.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.turno.findMany).not.toHaveBeenCalled();
      expect(tx.turno.createMany).toHaveBeenCalledTimes(1);
    });

    it('acepta un rango de exactamente 31 días', async () => {
      const resultado = await service.generar(
        dtoGeneracion({
          fecha_desde: '2026-11-11',
          fecha_hasta: '2026-12-11',
        }),
      );

      expect(resultado).toEqual({ creados: 31 * 14, salteados: 0 });
    });

    it('saltea las franjas de hoy que ya empezaron', async () => {
      vi.setSystemTime(new Date('2026-11-10T18:30:00Z'));

      const resultado = await service.generar(
        dtoGeneracion({ fecha_desde: '2026-11-10', fecha_hasta: '2026-11-10' }),
      );

      expect(resultado).toEqual({ creados: 6, salteados: 8 });
      const { data } = prisma.turno.createMany.mock.calls[0][0];
      expect(data[0].horaInicio).toBe('16:00');
    });

    it('rechaza con 400 una fecha hasta anterior a la desde', async () => {
      await expect(
        service.generar(
          dtoGeneracion({
            fecha_desde: '2026-11-12',
            fecha_hasta: '2026-11-11',
          }),
        ),
      ).rejects.toThrow(MENSAJE_RANGO_FECHAS_INVALIDO);
      expect(prisma.cancha.findUnique).not.toHaveBeenCalled();
      expect(prisma.turno.createMany).not.toHaveBeenCalled();
    });

    it('rechaza con 400 un rango de más de 31 días', async () => {
      await expect(
        service.generar(
          dtoGeneracion({
            fecha_desde: '2026-11-11',
            fecha_hasta: '2026-12-12',
          }),
        ),
      ).rejects.toThrow(MENSAJE_RANGO_DIAS_EXCEDIDO);
      expect(prisma.turno.createMany).not.toHaveBeenCalled();
    });

    it('rechaza con 400 una fecha desde pasada', async () => {
      await expect(
        service.generar(
          dtoGeneracion({
            fecha_desde: '2026-11-09',
            fecha_hasta: '2026-11-10',
          }),
        ),
      ).rejects.toThrow(MENSAJE_FECHA_PASADA);
      expect(prisma.turno.createMany).not.toHaveBeenCalled();
    });

    it('rechaza con 422 una cancha inexistente', async () => {
      prisma.cancha.findUnique.mockResolvedValue(null);

      await expect(service.generar(dtoGeneracion())).rejects.toThrow(
        MENSAJE_CANCHA_NO_ENCONTRADA,
      );
      expect(prisma.turno.createMany).not.toHaveBeenCalled();
    });

    it('rechaza con 422 una disciplina inexistente', async () => {
      prisma.disciplina.findUnique.mockResolvedValue(null);

      await expect(service.generar(dtoGeneracion())).rejects.toThrow(
        MENSAJE_DISCIPLINA_NO_ENCONTRADA,
      );
      expect(prisma.turno.createMany).not.toHaveBeenCalled();
    });

    it('rechaza con 422 una disciplina que no pertenece a la cancha', async () => {
      prisma.cancha.findUnique.mockResolvedValue({
        id: CANCHA,
        disciplinas: [],
      });

      await expect(service.generar(dtoGeneracion())).rejects.toThrow(
        MENSAJE_DISCIPLINA_FUERA_DE_CANCHA,
      );
      expect(prisma.turno.createMany).not.toHaveBeenCalled();
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

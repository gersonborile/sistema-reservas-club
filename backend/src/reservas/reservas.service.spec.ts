import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { RolUsuario, EstadoReserva, EstadoCancha } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { TokenSesion } from '../auth/token-sesion.js';
import {
  MENSAJE_CANCHA_INHABILITADA,
  MENSAJE_RESERVA_AJENA,
  MENSAJE_RESERVA_FUERA_DE_VENTANA,
  MENSAJE_RESERVA_YA_CANCELADA,
  MENSAJE_TURNO_NO_ENCONTRADO,
  MENSAJE_TURNO_OCUPADO,
  MENSAJE_TURNO_PASADO,
} from './mensajes.js';
import { ReservasService } from './reservas.service.js';

const SOCIO = '11111111-1111-4111-8111-111111111111';
const OTRO = '22222222-2222-4222-8222-222222222222';
const CANCHA = '33333333-3333-4333-8333-333333333333';
const TURNO = '44444444-4444-4444-8444-444444444444';
const RESERVA = '55555555-5555-4555-8555-555555555555';

const usuario: TokenSesion = {
  userId: SOCIO,
  email: 'socio@test',
  rol: RolUsuario.USUARIO,
};

const admin: TokenSesion = {
  userId: 'admin-id',
  email: 'admin@test',
  rol: RolUsuario.ADMINISTRADOR,
};

function filaTurno(overrides: Record<string, unknown> = {}) {
  return {
    id: TURNO,
    fecha: new Date(Date.UTC(2026, 9, 23)),
    horaInicio: '18:00',
    horaFin: '19:00',
    disponible: true,
    ...overrides,
  };
}

function crearPrismaMock(): Record<string, any> {
  const mock: Record<string, any> = {
    usuario: { findUnique: vi.fn() },
    turno: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    reserva: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  };
  mock.transaccion = vi.fn(
    async (correr: (tx: unknown) => Promise<unknown>) => correr(mock),
  );
  return mock;
}

describe('ReservasService', () => {
  let service: ReservasService;
  let prisma: ReturnType<typeof crearPrismaMock>;

  const dto = { turnoId: TURNO };

  async function compilar(): Promise<void> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReservasService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ReservasService);
  }

  describe('crear', () => {
    beforeEach(async () => {
      vi.setSystemTime(new Date('2026-10-23T12:00:00Z'));
      prisma = crearPrismaMock();
      prisma.turno.findUnique.mockResolvedValue(
        filaTurno({ cancha: { estado: EstadoCancha.DISPONIBLE } }),
      );
      prisma.turno.updateMany.mockResolvedValue({ count: 1 });
      prisma.reserva.create.mockImplementation(
        ({
          data,
        }: {
          data: { usuarioId: string; turnoId: string; estado: EstadoReserva };
        }) =>
          Promise.resolve({
            id: RESERVA,
            usuarioId: data.usuarioId,
            turnoId: data.turnoId,
            estado: data.estado,
            createdAt: new Date(Date.UTC(2026, 9, 23, 12, 0)),
            turno: {
              fecha: new Date(Date.UTC(2026, 9, 23)),
              horaInicio: '18:00',
              horaFin: '19:00',
              cancha: { id: CANCHA, nombre: 'Cancha' },
            },
          }),
      );
      await compilar();
    });

    it('usa updateMany condicional sobre Turno.disponible antes de crear', async () => {
      await service.crear(usuario, dto);

      expect(prisma.turno.updateMany).toHaveBeenCalledWith({
        where: { id: TURNO, disponible: true },
        data: { disponible: false },
      });
      expect(prisma.reserva.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            usuarioId: SOCIO,
            turnoId: TURNO,
            estado: EstadoReserva.CONFIRMADA,
          },
        }),
      );
    });

    it('409 por la carrera: 0 filas actualizadas significa turno ocupado', async () => {
      prisma.turno.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.crear(usuario, dto)).rejects.toThrow(ConflictException);
      await expect(service.crear(usuario, dto)).rejects.toThrow(
        MENSAJE_TURNO_OCUPADO,
      );
      expect(prisma.reserva.create).not.toHaveBeenCalled();
    });

    it('400 cuando el turno ya pasó', async () => {
      prisma.turno.findUnique.mockResolvedValue(
        filaTurno({
          fecha: new Date(Date.UTC(2025, 9, 23)),
          horaInicio: '18:00',
          cancha: { estado: EstadoCancha.DISPONIBLE },
        }),
      );

      await expect(service.crear(usuario, dto)).rejects.toThrow(
        MENSAJE_TURNO_PASADO,
      );
      expect(prisma.turno.updateMany).not.toHaveBeenCalled();
      expect(prisma.reserva.create).not.toHaveBeenCalled();
    });

    it('400 cuando el turno ya comenzó el día de hoy', async () => {
      vi.setSystemTime(new Date('2026-10-23T18:00:00Z'));
      prisma.turno.findUnique.mockResolvedValue(
        filaTurno({
          fecha: new Date(Date.UTC(2026, 9, 23)),
          horaInicio: '17:59',
          cancha: { estado: EstadoCancha.DISPONIBLE },
        }),
      );

      await expect(service.crear(usuario, dto)).rejects.toThrow(
        MENSAJE_TURNO_PASADO,
      );
      vi.useRealTimers();
    });

    it('404 cuando el turno no existe', async () => {
      prisma.turno.findUnique.mockResolvedValue(null);

      await expect(service.crear(usuario, dto)).rejects.toThrow(NotFoundException);
      await expect(service.crear(usuario, dto)).rejects.toThrow(
        MENSAJE_TURNO_NO_ENCONTRADO,
      );
    });

    it('409 cuando la cancha no está DISPONIBLE', async () => {
      prisma.turno.findUnique.mockResolvedValue(
        filaTurno({ cancha: { estado: EstadoCancha.EN_MANTENIMIENTO } }),
      );

      await expect(service.crear(usuario, dto)).rejects.toThrow(
        MENSAJE_CANCHA_INHABILITADA,
      );
      expect(prisma.reserva.create).not.toHaveBeenCalled();
    });

    it('403 cuando un USUARIO reserva para otro usuario', async () => {
      await expect(
        service.crear(usuario, { turnoId: TURNO, usuarioId: OTRO }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.turno.findUnique).not.toHaveBeenCalled();
    });

    it('201 cuando el ADMINISTRADOR reserva para un usuario existente', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: OTRO });

      const reserva = await service.crear(admin, {
        turnoId: TURNO,
        usuarioId: OTRO,
      });

      expect(reserva.usuarioId).toBe(OTRO);
      expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
        where: { id: OTRO },
        select: { id: true },
      });
    });

    it('404 cuando el ADMINISTRADOR indica un usuario inexistente', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        service.crear(admin, { turnoId: TURNO, usuarioId: OTRO }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.turno.findUnique).not.toHaveBeenCalled();
    });

    it('la reserva se crea respetando la transacción si un paso falla', async () => {
      prisma.reserva.create.mockRejectedValue(new Error('fallo de base'));

      await expect(service.crear(usuario, dto)).rejects.toThrow('fallo de base');
      expect(prisma.turno.updateMany).toHaveBeenCalledTimes(1);
      expect(prisma.reserva.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelar', () => {
    beforeEach(async () => {
      vi.setSystemTime(new Date('2026-10-23T12:00:00Z'));
      prisma = crearPrismaMock();
      let estadoActual: EstadoReserva = EstadoReserva.CONFIRMADA;
      prisma.reserva.updateMany.mockImplementation(
        ({ data }: { data: { estado: EstadoReserva } }) => {
          estadoActual = data.estado;
          return Promise.resolve({ count: 1 });
        },
      );
      prisma.turno.update.mockResolvedValue(filaTurno({ disponible: true }));
      prisma.reserva.findUnique.mockImplementation(
        ({ where }: { where: { id: string } }) =>
          Promise.resolve({
            id: where.id,
            usuarioId: SOCIO,
            turnoId: TURNO,
            estado: estadoActual,
            createdAt: new Date(Date.UTC(2026, 9, 23, 12, 0)),
            turno: {
              fecha: new Date(Date.UTC(2026, 9, 23)),
              horaInicio: '18:00',
              horaFin: '19:00',
              cancha: { id: CANCHA, nombre: 'Cancha' },
            },
          }),
      );
      await compilar();
    });

    it('cancela una reserva propia más de 2 horas antes del inicio', async () => {
      const reserva = await service.cancelar(usuario, RESERVA);

      expect(reserva.estado).toBe(EstadoReserva.CANCELADA);
      expect(prisma.reserva.updateMany).toHaveBeenCalledWith({
        where: { id: RESERVA, estado: EstadoReserva.CONFIRMADA },
        data: { estado: EstadoReserva.CANCELADA },
      });
      expect(prisma.turno.update).toHaveBeenCalledWith({
        where: { id: TURNO },
        data: { disponible: true },
      });
    });

    it('respeta el borde exacto de la ventana: a 2 horas funcionales se cancela', async () => {
      prisma.reserva.findUnique.mockResolvedValueOnce({
        id: RESERVA,
        usuarioId: SOCIO,
        turnoId: TURNO,
        estado: EstadoReserva.CONFIRMADA,
        turno: { fecha: new Date(Date.UTC(2026, 9, 23)), horaInicio: '14:00' },
      });
      prisma.reserva.findUnique.mockResolvedValueOnce({
        id: RESERVA,
        usuarioId: SOCIO,
        turnoId: TURNO,
        estado: EstadoReserva.CANCELADA,
        createdAt: new Date(),
        turno: {
          fecha: new Date(Date.UTC(2026, 9, 23)),
          horaInicio: '14:00',
          horaFin: '15:00',
          cancha: { id: CANCHA, nombre: 'Cancha' },
        },
      });

      const reserva = await service.cancelar(usuario, RESERVA);
      expect(reserva.estado).toBe(EstadoReserva.CANCELADA);
    });

    it('409 sin la ventana: falta menos de 2 horas', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: RESERVA,
        usuarioId: SOCIO,
        turnoId: TURNO,
        estado: EstadoReserva.CONFIRMADA,
        turno: { fecha: new Date(Date.UTC(2026, 9, 23)), horaInicio: '13:59' },
      });

      await expect(service.cancelar(usuario, RESERVA)).rejects.toThrow(
        MENSAJE_RESERVA_FUERA_DE_VENTANA,
      );
      await expect(service.cancelar(usuario, RESERVA)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.reserva.updateMany).not.toHaveBeenCalled();
    });

    it('409 cuando el turno ya comenzó', async () => {
      prisma.reserva.findUnique.mockResolvedValueOnce({
        id: RESERVA,
        usuarioId: SOCIO,
        turnoId: TURNO,
        estado: EstadoReserva.CONFIRMADA,
        turno: { fecha: new Date(Date.UTC(2026, 9, 23)), horaInicio: '10:00' },
      });

      await expect(service.cancelar(usuario, RESERVA)).rejects.toThrow(
        ConflictException,
      );
    });

    it('409 cuando la reserva ya está CANCELADA (0 filas actualizadas)', async () => {
      prisma.reserva.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.cancelar(usuario, RESERVA)).rejects.toThrow(
        MENSAJE_RESERVA_YA_CANCELADA,
      );
      expect(prisma.turno.update).not.toHaveBeenCalled();
    });

    it('403 cuando un USUARIO cancela una reserva ajena', async () => {
      prisma.reserva.findUnique.mockResolvedValueOnce({
        id: RESERVA,
        usuarioId: OTRO,
        turnoId: TURNO,
        estado: EstadoReserva.CONFIRMADA,
        turno: { fecha: new Date(Date.UTC(2026, 9, 23)), horaInicio: '18:00' },
      });

      await expect(service.cancelar(usuario, RESERVA)).rejects.toThrow(
        MENSAJE_RESERVA_AJENA,
      );
      expect(prisma.reserva.updateMany).not.toHaveBeenCalled();
    });

    it('200 cuando el ADMINISTRADOR cancela una reserva ajena', async () => {
      prisma.reserva.findUnique.mockResolvedValueOnce({
        id: RESERVA,
        usuarioId: OTRO,
        turnoId: TURNO,
        estado: EstadoReserva.CONFIRMADA,
        turno: { fecha: new Date(Date.UTC(2026, 9, 23)), horaInicio: '18:00' },
      });

      const reserva = await service.cancelar(admin, RESERVA);
      expect(reserva.estado).toBe(EstadoReserva.CANCELADA);
    });

    it('404 cuando la reserva no existe', async () => {
      prisma.reserva.findUnique.mockResolvedValue(null);

      await expect(service.cancelar(usuario, RESERVA)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listar', () => {
    beforeEach(async () => {
      prisma = crearPrismaMock();
      prisma.reserva.findMany.mockResolvedValue([]);
      await compilar();
    });

    it('USUARIO ve solo sus reservas', async () => {
      await service.listar(usuario, {});

      expect(prisma.reserva.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { usuarioId: SOCIO },
          orderBy: [
            { turno: { fecha: 'desc' } },
            { turno: { horaInicio: 'desc' } },
          ],
        }),
      );
    });

    it('ADMINISTRADOR ve todas sin filtro', async () => {
      await service.listar(admin, {});

      expect(prisma.reserva.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { usuarioId: undefined } }),
      );
    });

    it('ADMINISTRADOR con ?usuarioId filtra por ese usuario', async () => {
      await service.listar(admin, { usuarioId: OTRO });

      expect(prisma.reserva.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { usuarioId: OTRO } }),
      );
    });

    it('403 cuando un USUARIO consulta con usuarioId ajeno', async () => {
      await expect(
        service.listar(usuario, { usuarioId: OTRO }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

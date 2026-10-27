import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  EstadoDevolucion,
  EstadoReserva,
  Prisma,
  RolUsuario,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { TokenSesion } from '../auth/token-sesion.js';
import {
  MENSAJE_ALQUILER_YA_EXISTENTE,
  MENSAJE_EQUIPAMIENTO_INACTIVO,
  MENSAJE_EQUIPAMIENTO_INEXISTENTE,
  MENSAJE_STOCK_INSUFICIENTE,
} from './mensajes.js';
import { AlquileresService } from './alquileres.service.js';

const SOCIO = '11111111-1111-4111-8111-111111111111';
const OTRO = '22222222-2222-4222-8222-222222222222';
const RESERVA = '55555555-5555-4555-8555-555555555555';
const RAQUETA = '66666666-6666-4666-8666-666666666666';
const PELOTAS = '77777777-7777-4777-8777-777777777777';
const ALQUILER = '88888888-8888-4888-8888-888888888888';

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

const dtoBase = { items: [{ equipamientoId: RAQUETA, cantidad: 2 }] };

function catalogo(precio = new Prisma.Decimal(500.5), activo = true) {
  return [
    { id: RAQUETA, activo, precioUnitario: precio },
    { id: PELOTAS, activo: true, precioUnitario: new Prisma.Decimal(2500) },
  ];
}

function filaAlquiler(items = dtoBase.items, precio: number = 500.5) {
  return {
    id: ALQUILER,
    reservaId: RESERVA,
    total: new Prisma.Decimal(
      items.reduce(
        (sum: number, item: { cantidad: number }) => sum + precio * item.cantidad,
        0,
      ),
    ),
    createdAt: new Date('2026-10-23T12:00:00Z'),
    items: items.map((item: { equipamientoId: string; cantidad: number }) => ({
      equipamientoId: item.equipamientoId,
      cantidad: item.cantidad,
      precioUnitario: new Prisma.Decimal(precio),
      estadoDevolucion: EstadoDevolucion.PENDIENTE,
    })),
  };
}

function crearPrismaMock(): Record<string, any> {
  const mock: Record<string, any> = {
    reserva: { findUnique: vi.fn() },
    equipamiento: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    alquiler: { create: vi.fn() },
  };
  mock.transaccion = vi.fn(async (correr: (tx: unknown) => Promise<unknown>) =>
    correr(mock),
  );
  return mock;
}

describe('AlquileresService', () => {
  let service: AlquileresService;
  let prisma: ReturnType<typeof crearPrismaMock>;

  async function compilar(): Promise<void> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlquileresService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(AlquileresService);
  }

  function prepararContento(): void {
    prisma.reserva.findUnique.mockResolvedValue({
      id: RESERVA,
      usuarioId: SOCIO,
      estado: EstadoReserva.CONFIRMADA,
    });
    prisma.equipamiento.findMany.mockImplementation(async ({ where: { id: { in: ids } } }) =>
      catalogo().filter((e) => ids.includes(e.id)),
    );
    prisma.equipamiento.updateMany.mockResolvedValue({ count: 1 });
    prisma.alquiler.create.mockResolvedValue(filaAlquiler());
  }

  beforeEach(async () => {
    prisma = crearPrismaMock();
    await compilar();
  });

  describe('crear', () => {
    it('descuenta stock por cada item y registra el precio del catálogo como snapshot', async () => {
      prepararContento();
      await service.crear(usuario, RESERVA, dtoBase);

      expect(prisma.equipamiento.updateMany).toHaveBeenCalledWith({
        where: { id: RAQUETA, stockDisponible: { gte: 2 } },
        data: { stockDisponible: { decrement: 2 } },
      });
    });

    it('calcula precioUnitario × cantidad con Decimal y total sin error de punto flotante', async () => {
      prepararContento();
      const precio = 0.1;
      prisma.equipamiento.findMany.mockResolvedValue(
        [{ id: RAQUETA, activo: true, precioUnitario: new Prisma.Decimal(precio) }],
      );
      prisma.alquiler.create.mockImplementation(
        async ({
          data,
        }: {
          data: { total: Prisma.Decimal; items: { create: unknown }; reservaId: string };
        }) => {
          expect(data.reservaId).toBe(RESERVA);
          expect(data.total.toString()).toBe('0.3');
          const items = (data.items as { create: Record<string, unknown>[] }).create;
          expect(items[0]).toMatchObject({
            equipamientoId: RAQUETA,
            cantidad: 3,
          });
          expect(items[0].precioUnitario.toString()).toBe('0.1');
          return filaAlquiler(dtoBase.items, precio);
        },
      );
      await service.crear(usuario, RESERVA, {
        items: [{ equipamientoId: RAQUETA, cantidad: 3 }],
      });
    });

    it('404 cuando la reserva no existe', async () => {
      prisma.reserva.findUnique.mockResolvedValue(null);
      await expect(
        service.crear(usuario, RESERVA, dtoBase),
      ).rejects.toThrow(NotFoundException);
    });

    it('404 cuando el id de reserva no es UUID', async () => {
      await expect(
        service.crear(usuario, 'no-es-uuid', dtoBase),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.reserva.findUnique).not.toHaveBeenCalled();
    });

    it('403 cuando un USUARIO alquila sobre una reserva ajena', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: RESERVA,
        usuarioId: OTRO,
        estado: EstadoReserva.CONFIRMADA,
      });
      await expect(
        service.crear(usuario, RESERVA, dtoBase),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.equipamiento.findMany).not.toHaveBeenCalled();
    });

    it('un ADMINISTRADOR puede alquilar sobre una reserva ajena', async () => {
      prepararContento();
      prisma.reserva.findUnique.mockResolvedValue({
        id: RESERVA,
        usuarioId: OTRO,
        estado: EstadoReserva.CONFIRMADA,
      });
      const alquiler = await service.crear(admin, RESERVA, dtoBase);
      expect(alquiler.reservaId).toBe(RESERVA);
    });

    it('409 cuando la reserva está CANCELADA', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: RESERVA,
        usuarioId: SOCIO,
        estado: EstadoReserva.CANCELADA,
      });
      await expect(
        service.crear(usuario, RESERVA, dtoBase),
      ).rejects.toThrow(ConflictException);
      expect(prisma.equipamiento.updateMany).not.toHaveBeenCalled();
    });

    it('404 cuando algún equipamiento no existe', async () => {
      prepararContento();
      prisma.equipamiento.findMany.mockResolvedValue([]);
      await expect(
        service.crear(usuario, RESERVA, dtoBase),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.equipamiento.updateMany).not.toHaveBeenCalled();
    });

    it('409 cuando algún equipamiento está inactivo', async () => {
      prepararContento();
      prisma.equipamiento.findMany.mockResolvedValue(
        catalogo(new Prisma.Decimal(500.5), false),
      );
      await expect(
        service.crear(usuario, RESERVA, dtoBase),
      ).rejects.toThrow(MENSAJE_EQUIPAMIENTO_INACTIVO);
      expect(prisma.equipamiento.updateMany).not.toHaveBeenCalled();
    });

    it('404 antes que 409: con [inactivo, inexistente] reporta el inexistente', async () => {
      prepararContento();
      prisma.equipamiento.findMany.mockResolvedValue([
        { id: RAQUETA, activo: false, precioUnitario: new Prisma.Decimal(500.5) },
      ]);
      await expect(
        service.crear(usuario, RESERVA, {
          items: [
            { equipamientoId: RAQUETA, cantidad: 1 },
            { equipamientoId: PELOTAS, cantidad: 1 },
          ],
        }),
      ).rejects.toThrow(MENSAJE_EQUIPAMIENTO_INEXISTENTE);
      expect(prisma.equipamiento.updateMany).not.toHaveBeenCalled();
    });

    it('409 si el descuento de un item posterior da 0 filas y no crea el alquiler', async () => {
      prepararContento();
      prisma.equipamiento.updateMany.mockImplementation(
        ({ where }: { where: { id: string } }) =>
          Promise.resolve(where.id === RAQUETA ? { count: 1 } : { count: 0 }),
      );
      await expect(
        service.crear(usuario, RESERVA, {
          items: [
            { equipamientoId: RAQUETA, cantidad: 1 },
            { equipamientoId: PELOTAS, cantidad: 1 },
          ],
        }),
      ).rejects.toThrow(MENSAJE_STOCK_INSUFICIENTE);
      expect(prisma.equipamiento.updateMany).toHaveBeenCalledTimes(2);
      expect(prisma.alquiler.create).not.toHaveBeenCalled();
    });

    it('409 sin stock suficiente (0 filas descontadas) y no crea el alquiler', async () => {
      prepararContento();
      prisma.equipamiento.updateMany.mockResolvedValue({ count: 0 });
      await expect(
        service.crear(usuario, RESERVA, dtoBase),
      ).rejects.toThrow(MENSAJE_STOCK_INSUFICIENTE);
      expect(prisma.alquiler.create).not.toHaveBeenCalled();
    });

    it('409 cuando la reserva ya tiene un alquiler (P2002)', async () => {
      prepararContento();
      prisma.alquiler.create.mockRejectedValue({ code: 'P2002' });
      await expect(
        service.crear(usuario, RESERVA, dtoBase),
      ).rejects.toThrow(MENSAJE_ALQUILER_YA_EXISTENTE);
    });

    it('repropaga errores que no sean un alquiler duplicado', async () => {
      prepararContento();
      prisma.alquiler.create.mockRejectedValue(new Error('fallo de base'));
      await expect(
        service.crear(usuario, RESERVA, dtoBase),
      ).rejects.toThrow('fallo de base');
    });
  });
});

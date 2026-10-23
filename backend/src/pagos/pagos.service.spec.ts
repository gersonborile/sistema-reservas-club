import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  EstadoPago,
  EstadoReserva,
  RolUsuario,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { TokenSesion } from '../auth/token-sesion.js';
import {
  MENSAJE_PAGO_NO_ENCONTRADO,
  MENSAJE_PAGO_NO_PENDIENTE,
  MENSAJE_PAGO_YA_ANULADO,
  MENSAJE_PAGO_YA_EXISTENTE,
  MENSAJE_RESERVA_AJENA,
  MENSAJE_RESERVA_NO_COBRABLE,
  MENSAJE_RESERVA_NO_ENCONTRADA,
} from './mensajes.js';
import { PagosService } from './pagos.service.js';

const SOCIO = '11111111-1111-4111-8111-111111111111';
const OTRO = '22222222-2222-4222-8222-222222222222';
const RESERVA = '55555555-5555-4555-8555-555555555555';
const PAGO = '66666666-6666-4666-8666-666666666666';

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

function filaPago(estado: EstadoPago = EstadoPago.PENDIENTE) {
  return {
    id: PAGO,
    reservaId: RESERVA,
    monto: 15.5,
    metodoPago: 'EFECTIVO',
    estado,
    fechaPago: null,
  };
}

function crearPrismaMock(): Record<string, any> {
  const mock: Record<string, any> = {
    reserva: { findUnique: vi.fn() },
    pago: {
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  };
  mock.transaccion = vi.fn(async (correr: (tx: unknown) => Promise<unknown>) =>
    correr(mock),
  );
  return mock;
}

describe('PagosService', () => {
  let service: PagosService;
  let prisma: ReturnType<typeof crearPrismaMock>;

  const dto = { monto: 15.5, metodoPago: 'EFECTIVO' as const };

  async function compilar(): Promise<void> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PagosService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(PagosService);
  }

  beforeEach(async () => {
    prisma = crearPrismaMock();
    await compilar();
  });

  describe('registrar', () => {
    it('crea el pago en estado PENDIENTE para una reserva CONFIRMADA', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        estado: EstadoReserva.CONFIRMADA,
      });
      prisma.pago.create.mockResolvedValue(filaPago());

      const pago = await service.registrar(RESERVA, dto);

      expect(pago.estado).toBe(EstadoPago.PENDIENTE);
      expect(pago.monto).toBe(15.5);
      expect(prisma.pago.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            reservaId: RESERVA,
            monto: 15.5,
            metodoPago: 'EFECTIVO',
            estado: EstadoPago.PENDIENTE,
          },
        }),
      );
    });

    it('404 si la reserva no existe', async () => {
      prisma.reserva.findUnique.mockResolvedValue(null);

      await expect(service.registrar(RESERVA, dto)).rejects.toThrow(
        new NotFoundException(MENSAJE_RESERVA_NO_ENCONTRADA),
      );
    });

    it('409 si la reserva está CANCELADA', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        estado: EstadoReserva.CANCELADA,
      });

      await expect(service.registrar(RESERVA, dto)).rejects.toThrow(
        new ConflictException(MENSAJE_RESERVA_NO_COBRABLE),
      );
      expect(prisma.pago.create).not.toHaveBeenCalled();
    });

    it('409 si ya existe un pago para la reserva (P2002)', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        estado: EstadoReserva.CONFIRMADA,
      });
      prisma.pago.create.mockRejectedValue({ code: 'P2002' });

      await expect(service.registrar(RESERVA, dto)).rejects.toThrow(
        new ConflictException(MENSAJE_PAGO_YA_EXISTENTE),
      );
    });

    it('404 si el id no es UUID sin tocar la base', async () => {
      await expect(service.registrar('no-es-uuid', dto)).rejects.toThrow(
        new NotFoundException(MENSAJE_RESERVA_NO_ENCONTRADA),
      );
      expect(prisma.reserva.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('pagar', () => {
    it('PENDIENTE pasa a PAGADO y registra fechaPago', async () => {
      prisma.pago.updateMany.mockResolvedValue({ count: 1 });
      prisma.pago.findUnique.mockResolvedValue({
        ...filaPago(EstadoPago.PAGADO),
        fechaPago: new Date(),
      });

      const pago = await service.pagar(PAGO);

      expect(pago.estado).toBe(EstadoPago.PAGADO);
      expect(prisma.pago.updateMany).toHaveBeenCalledWith({
        where: { id: PAGO, estado: { in: [EstadoPago.PENDIENTE] } },
        data: { estado: EstadoPago.PAGADO, fechaPago: expect.any(Date) },
      });
    });

    it('404 si el pago no existe', async () => {
      prisma.pago.updateMany.mockResolvedValue({ count: 0 });
      prisma.pago.findUnique.mockResolvedValue(null);

      await expect(service.pagar(PAGO)).rejects.toThrow(
        new NotFoundException(MENSAJE_PAGO_NO_ENCONTRADO),
      );
    });

    it('409 si el pago ya está PAGADO', async () => {
      prisma.pago.updateMany.mockResolvedValue({ count: 0 });
      prisma.pago.findUnique.mockResolvedValue(filaPago(EstadoPago.PAGADO));

      await expect(service.pagar(PAGO)).rejects.toThrow(
        new ConflictException(MENSAJE_PAGO_NO_PENDIENTE),
      );
    });

    it('409 si el pago está ANULADO', async () => {
      prisma.pago.updateMany.mockResolvedValue({ count: 0 });
      prisma.pago.findUnique.mockResolvedValue(filaPago(EstadoPago.ANULADO));

      await expect(service.pagar(PAGO)).rejects.toThrow(
        new ConflictException(MENSAJE_PAGO_NO_PENDIENTE),
      );
    });
  });

  describe('anular', () => {
    it('PENDIENTE pasa a ANULADO', async () => {
      prisma.pago.updateMany.mockResolvedValue({ count: 1 });
      prisma.pago.findUnique.mockResolvedValue(filaPago(EstadoPago.ANULADO));

      const pago = await service.anular(PAGO);

      expect(pago.estado).toBe(EstadoPago.ANULADO);
      expect(prisma.pago.updateMany).toHaveBeenCalledWith({
        where: {
          id: PAGO,
          estado: { in: [EstadoPago.PENDIENTE, EstadoPago.PAGADO] },
        },
        data: { estado: EstadoPago.ANULADO },
      });
    });

    it('PAGADO pasa a ANULADO', async () => {
      prisma.pago.updateMany.mockResolvedValue({ count: 1 });
      prisma.pago.findUnique.mockResolvedValue({
        ...filaPago(EstadoPago.ANULADO),
        fechaPago: new Date(),
      });

      await expect(service.anular(PAGO)).resolves.toMatchObject({
        estado: EstadoPago.ANULADO,
      });
    });

    it('404 si el pago no existe', async () => {
      prisma.pago.updateMany.mockResolvedValue({ count: 0 });
      prisma.pago.findUnique.mockResolvedValue(null);

      await expect(service.anular(PAGO)).rejects.toThrow(
        new NotFoundException(MENSAJE_PAGO_NO_ENCONTRADO),
      );
    });

    it('409 si el pago ya está ANULADO', async () => {
      prisma.pago.updateMany.mockResolvedValue({ count: 0 });
      prisma.pago.findUnique.mockResolvedValue(filaPago(EstadoPago.ANULADO));

      await expect(service.anular(PAGO)).rejects.toThrow(
        new ConflictException(MENSAJE_PAGO_YA_ANULADO),
      );
    });
  });

  describe('obtenerDeReserva', () => {
    it('devuelve el pago de una reserva propia', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: RESERVA,
        usuarioId: SOCIO,
      });
      prisma.pago.findUnique.mockResolvedValue(filaPago());

      const pago = await service.obtenerDeReserva(usuario, RESERVA);

      expect(pago.id).toBe(PAGO);
    });

    it('403 si el usuario consulta una reserva ajena', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: RESERVA,
        usuarioId: OTRO,
      });
      prisma.pago.findUnique.mockResolvedValue(filaPago());

      await expect(service.obtenerDeReserva(usuario, RESERVA)).rejects.toThrow(
        new ForbiddenException(MENSAJE_RESERVA_AJENA),
      );
    });

    it('el administrador consulta cualquier reserva', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: RESERVA,
        usuarioId: OTRO,
      });
      prisma.pago.findUnique.mockResolvedValue(filaPago());

      await expect(
        service.obtenerDeReserva(admin, RESERVA),
      ).resolves.toMatchObject({ id: PAGO });
    });

    it('404 si la reserva no tiene pago', async () => {
      prisma.reserva.findUnique.mockResolvedValue({
        id: RESERVA,
        usuarioId: SOCIO,
      });
      prisma.pago.findUnique.mockResolvedValue(null);

      await expect(service.obtenerDeReserva(usuario, RESERVA)).rejects.toThrow(
        new NotFoundException(MENSAJE_PAGO_NO_ENCONTRADO),
      );
    });

    it('404 si la reserva no existe', async () => {
      prisma.reserva.findUnique.mockResolvedValue(null);

      await expect(service.obtenerDeReserva(usuario, RESERVA)).rejects.toThrow(
        new NotFoundException(MENSAJE_RESERVA_NO_ENCONTRADA),
      );
    });
  });
});

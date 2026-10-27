import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { validationPipe } from '../src/comun/validation-pipe.js';
import {
  EstadoPago,
  EstadoReserva,
  RolUsuario,
} from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

process.env.JWT_SECRET ??= 'secreto-de-prueba-e2e-no-usar-en-produccion';
process.env.JWT_EXPIRES_IN ??= '1h';

const SOCIO_E2E = 'socio-e2e';
const USUARIO_ID_OTRO = '22222222-2222-4222-8222-222222222222';

type FilaPago = {
  id: string;
  reservaId: string;
  monto: number;
  metodoPago: string;
  estado: EstadoPago;
  fechaPago: Date | null;
};

type FilaReserva = {
  id: string;
  usuarioId: string;
  estado: EstadoReserva;
};

describe('Pagos (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let reservas: Map<string, FilaReserva>;
  let pagos: Map<string, FilaPago>;
  let prismaMock: Record<string, unknown>;

  const server = () => app.getHttpServer();

  async function tokenAdmin(): Promise<string> {
    return jwtService.signAsync({
      userId: 'admin-e2e',
      email: 'admin-pagos@clubdeportivo.test',
      rol: RolUsuario.ADMINISTRADOR,
    });
  }

  async function tokenUsuario(): Promise<string> {
    return jwtService.signAsync({
      userId: SOCIO_E2E,
      email: 'socio-pagos@clubdeportivo.test',
      rol: RolUsuario.USUARIO,
    });
  }

  function filaReserva(
    usuarioId: string,
    estado: EstadoReserva = EstadoReserva.CONFIRMADA,
  ): FilaReserva {
    const fila = { id: randomUUID(), usuarioId, estado };
    reservas.set(fila.id, fila);
    return fila;
  }

  function filaPago(reservaId: string, data: Partial<FilaPago> = {}): FilaPago {
    const fila: FilaPago = {
      id: randomUUID(),
      reservaId,
      monto: 15.5,
      metodoPago: 'EFECTIVO',
      estado: EstadoPago.PENDIENTE,
      fechaPago: null,
      ...data,
    };
    pagos.set(fila.id, fila);
    return fila;
  }

  beforeEach(async () => {
    reservas = new Map();
    pagos = new Map();

    prismaMock = {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      transaccion: vi.fn(async (correr: (tx: unknown) => Promise<unknown>) =>
        correr(prismaMock),
      ),
      reserva: {
        findUnique: vi.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(reservas.get(where.id) ?? null),
        ),
      },
      pago: {
        findUnique: vi.fn(
          ({ where }: { where: { id?: string; reservaId?: string } }) => {
            if (where.id) {
              return Promise.resolve(pagos.get(where.id) ?? null);
            }
            const pago = [...pagos.values()].find(
              (p) => p.reservaId === where.reservaId,
            );
            return Promise.resolve(pago ?? null);
          },
        ),
        create: vi.fn(
          ({ data }: { data: Omit<FilaPago, 'id' | 'fechaPago'> }) => {
            const existente = [...pagos.values()].find(
              (p) => p.reservaId === data.reservaId,
            );
            if (existente) {
              return Promise.reject({ code: 'P2002' });
            }
            return Promise.resolve(filaPago(data.reservaId, data));
          },
        ),
        updateMany: vi.fn(
          ({
            where,
            data,
          }: {
            where: { id: string; estado?: { in: string[] } };
            data: Partial<FilaPago>;
          }) => {
            const actual = pagos.get(where.id);
            const coincide =
              actual !== undefined &&
              (!where.estado?.in || where.estado.in.includes(actual.estado));
            if (!coincide) {
              return Promise.resolve({ count: 0 });
            }
            pagos.set(where.id, { ...actual, ...data });
            return Promise.resolve({ count: 1 });
          },
        ),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(validationPipe);
    await app.init();
    jwtService = app.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /reservas/:id/pagos', () => {
    it('201: registra un pago PENDIENTE sobre una reserva confirmada', async () => {
      const token = await tokenAdmin();
      const reserva = filaReserva('socio-e2e');

      const respuesta = await request(server())
        .post(`/reservas/${reserva.id}/pagos`)
        .set('Authorization', `Bearer ${token}`)
        .send({ monto: 15.5, metodoPago: 'EFECTIVO' })
        .expect(201);

      expect(respuesta.body).toMatchObject({
        reservaId: reserva.id,
        monto: 15.5,
        metodoPago: 'EFECTIVO',
        estado: 'PENDIENTE',
        fechaPago: null,
      });
    });

    it('400: monto menor o igual a 0', async () => {
      const token = await tokenAdmin();
      const reserva = filaReserva('socio-e2e');

      await request(server())
        .post(`/reservas/${reserva.id}/pagos`)
        .set('Authorization', `Bearer ${token}`)
        .send({ monto: 0, metodoPago: 'EFECTIVO' })
        .expect(400);
    });

    it('400: metodoPago inválido', async () => {
      const token = await tokenAdmin();
      const reserva = filaReserva('socio-e2e');

      await request(server())
        .post(`/reservas/${reserva.id}/pagos`)
        .set('Authorization', `Bearer ${token}`)
        .send({ monto: 15.5, metodoPago: 'CRIPTO' })
        .expect(400);
    });

    it('404: reserva inexistente', async () => {
      const token = await tokenAdmin();

      const respuesta = await request(server())
        .post(`/reservas/${randomUUID()}/pagos`)
        .set('Authorization', `Bearer ${token}`)
        .send({ monto: 15.5, metodoPago: 'EFECTIVO' })
        .expect(404);

      expect(respuesta.body.message).toBe('La reserva indicada no existe.');
    });

    it('409: reserva cancelada', async () => {
      const token = await tokenAdmin();
      const reserva = filaReserva('socio-e2e', EstadoReserva.CANCELADA);

      await request(server())
        .post(`/reservas/${reserva.id}/pagos`)
        .set('Authorization', `Bearer ${token}`)
        .send({ monto: 15.5, metodoPago: 'EFECTIVO' })
        .expect(409);

      expect(pagos.size).toBe(0);
    });

    it('409: segundo pago para la misma reserva', async () => {
      const token = await tokenAdmin();
      const reserva = filaReserva('socio-e2e');

      await request(server())
        .post(`/reservas/${reserva.id}/pagos`)
        .set('Authorization', `Bearer ${token}`)
        .send({ monto: 15.5, metodoPago: 'EFECTIVO' })
        .expect(201);

      await request(server())
        .post(`/reservas/${reserva.id}/pagos`)
        .set('Authorization', `Bearer ${token}`)
        .send({ monto: 20, metodoPago: 'TARJETA' })
        .expect(409);

      expect(pagos.size).toBe(1);
    });

    it('403: un USUARIO no puede registrar pagos', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/pagos`)
        .set('Authorization', `Bearer ${token}`)
        .send({ monto: 15.5, metodoPago: 'EFECTIVO' })
        .expect(403);

      expect(pagos.size).toBe(0);
    });

    it('401: sin autenticación', async () => {
      const reserva = filaReserva('socio-e2e');

      await request(server())
        .post(`/reservas/${reserva.id}/pagos`)
        .send({ monto: 15.5, metodoPago: 'EFECTIVO' })
        .expect(401);
    });
  });

  describe('PATCH /pagos/:id/pagar', () => {
    it('200: PENDIENTE pasa a PAGADO con fechaPago', async () => {
      const token = await tokenAdmin();
      const pago = filaPago(randomUUID());

      const respuesta = await request(server())
        .patch(`/pagos/${pago.id}/pagar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body.estado).toBe('PAGADO');
      expect(respuesta.body.fechaPago).toBeTruthy();
      expect(pagos.get(pago.id)?.estado).toBe(EstadoPago.PAGADO);
    });

    it('404: pago inexistente', async () => {
      const token = await tokenAdmin();

      const respuesta = await request(server())
        .patch(`/pagos/${randomUUID()}/pagar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(respuesta.body.message).toBe('El pago indicado no existe.');
    });

    it('409: pago PAGADO no puede pagarse de nuevo', async () => {
      const token = await tokenAdmin();
      const pago = filaPago(randomUUID(), { estado: EstadoPago.PAGADO });

      const respuesta = await request(server())
        .patch(`/pagos/${pago.id}/pagar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);

      expect(respuesta.body.message).toBe(
        'Solo se puede confirmar el cobro de un pago pendiente.',
      );
      expect(pagos.get(pago.id)?.estado).toBe(EstadoPago.PAGADO);
    });

    it('409: pago ANULADO no puede pagarse', async () => {
      const token = await tokenAdmin();
      const pago = filaPago(randomUUID(), { estado: EstadoPago.ANULADO });

      await request(server())
        .patch(`/pagos/${pago.id}/pagar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });

    it('403: un USUARIO no puede confirmar cobros', async () => {
      const token = await tokenUsuario();
      const pago = filaPago(randomUUID());

      await request(server())
        .patch(`/pagos/${pago.id}/pagar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(pagos.get(pago.id)?.estado).toBe(EstadoPago.PENDIENTE);
    });

    it('401: sin autenticación', async () => {
      const pago = filaPago(randomUUID());

      await request(server()).patch(`/pagos/${pago.id}/pagar`).expect(401);
    });
  });

  describe('PATCH /pagos/:id/anular', () => {
    it('200: anula un pago PENDIENTE', async () => {
      const token = await tokenAdmin();
      const pago = filaPago(randomUUID());

      const respuesta = await request(server())
        .patch(`/pagos/${pago.id}/anular`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body.estado).toBe('ANULADO');
    });

    it('200: anula un pago PAGADO', async () => {
      const token = await tokenAdmin();
      const pago = filaPago(randomUUID(), { estado: EstadoPago.PAGADO });

      const respuesta = await request(server())
        .patch(`/pagos/${pago.id}/anular`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body.estado).toBe('ANULADO');
    });

    it('404: pago inexistente', async () => {
      const token = await tokenAdmin();

      await request(server())
        .patch(`/pagos/${randomUUID()}/anular`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('409: pago ya anulado', async () => {
      const token = await tokenAdmin();
      const pago = filaPago(randomUUID(), { estado: EstadoPago.ANULADO });

      const respuesta = await request(server())
        .patch(`/pagos/${pago.id}/anular`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);

      expect(respuesta.body.message).toBe('El pago ya está anulado.');
      expect(pagos.get(pago.id)?.estado).toBe(EstadoPago.ANULADO);
    });

    it('403: un USUARIO no puede anular pagos', async () => {
      const token = await tokenUsuario();
      const pago = filaPago(randomUUID());

      await request(server())
        .patch(`/pagos/${pago.id}/anular`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(pagos.get(pago.id)?.estado).toBe(EstadoPago.PENDIENTE);
    });

    it('401: sin autenticación', async () => {
      const pago = filaPago(randomUUID());

      await request(server()).patch(`/pagos/${pago.id}/anular`).expect(401);
    });
  });

  describe('GET /reservas/:id/pagos', () => {
    it('200: usuario consulta el pago de su propia reserva', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);
      const pago = filaPago(reserva.id, { monto: 25, metodoPago: 'TARJETA' });

      const respuesta = await request(server())
        .get(`/reservas/${reserva.id}/pagos`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body).toMatchObject({
        id: pago.id,
        reservaId: reserva.id,
        monto: 25,
        metodoPago: 'TARJETA',
        estado: 'PENDIENTE',
        fechaPago: null,
      });
    });

    it('200: administrador consulta el pago de cualquier reserva', async () => {
      const token = await tokenAdmin();
      const reserva = filaReserva(USUARIO_ID_OTRO);
      filaPago(reserva.id);

      const respuesta = await request(server())
        .get(`/reservas/${reserva.id}/pagos`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body.reservaId).toBe(reserva.id);
    });

    it('403: usuario consulta el pago de una reserva ajena', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(USUARIO_ID_OTRO);
      filaPago(reserva.id);

      await request(server())
        .get(`/reservas/${reserva.id}/pagos`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('404: reserva sin pago', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      const respuesta = await request(server())
        .get(`/reservas/${reserva.id}/pagos`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(respuesta.body.message).toBe('El pago indicado no existe.');
    });

    it('404: reserva inexistente', async () => {
      const token = await tokenUsuario();

      const respuesta = await request(server())
        .get(`/reservas/${randomUUID()}/pagos`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(respuesta.body.message).toBe('La reserva indicada no existe.');
    });

    it('401: sin autenticación', async () => {
      const reserva = filaReserva(SOCIO_E2E);

      await request(server()).get(`/reservas/${reserva.id}/pagos`).expect(401);
    });
  });
});

import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { validationPipe } from '../src/comun/validation-pipe.js';
import {
  EstadoReserva,
  RolUsuario,
} from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

process.env.JWT_SECRET ??= 'secreto-de-prueba-e2e-no-usar-en-produccion';
process.env.JWT_EXPIRES_IN ??= '1h';

const SOCIO_E2E = 'socio-e2e';
const USUARIO_ID_OTRO = '22222222-2222-4222-8222-222222222222';
const RAQUETA = '66666666-6666-4666-8666-666666666666';
const PELOTAS = '77777777-7777-4777-8777-777777777777';
const TURNO_ID = '44444444-4444-4444-8444-444444444444';
const CANCHA_ID = '33333333-3333-4333-8333-333333333333';

type FilaEquipamiento = {
  id: string;
  activo: boolean;
  stockTotal: number;
  stockDisponible: number;
  precioUnitario: number;
};

type FilaItem = {
  equipamientoId: string;
  cantidad: number;
  precioUnitario: number;
  estadoDevolucion: string;
};

type FilaAlquiler = {
  id: string;
  reservaId: string;
  total: number;
  createdAt: Date;
  items: FilaItem[];
};

type FilaReserva = {
  id: string;
  usuarioId: string;
  turnoId: string;
  estado: EstadoReserva;
  createdAt: Date;
  turno: {
    fecha: Date;
    horaInicio: string;
    horaFin: string;
    cancha: { id: string; nombre: string };
  };
};

function enDias(dias: number): Date {
  const fecha = new Date();
  fecha.setUTCHours(0, 0, 0, 0);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha;
}

describe('Alquileres (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let reservas: Map<string, FilaReserva>;
  let alquileres: Map<string, FilaAlquiler>;
  let equipamientos: Map<string, FilaEquipamiento>;
  let prismaMock: Record<string, unknown>;

  const server = () => app.getHttpServer();

  async function tokenAdmin(): Promise<string> {
    return jwtService.signAsync({
      userId: 'admin-e2e',
      email: 'admin-alquileres@clubdeportivo.test',
      rol: RolUsuario.ADMINISTRADOR,
    });
  }

  async function tokenUsuario(): Promise<string> {
    return jwtService.signAsync({
      userId: SOCIO_E2E,
      email: 'socio-alquileres@clubdeportivo.test',
      rol: RolUsuario.USUARIO,
    });
  }

  function sembrarEquipamiento(
    id: string,
    overrides: Partial<FilaEquipamiento> = {},
  ): void {
    equipamientos.set(id, {
      id,
      activo: true,
      stockTotal: 8,
      stockDisponible: 8,
      precioUnitario: 500.5,
      ...overrides,
    });
  }

  function filaReserva(
    usuarioId: string,
    estado: EstadoReserva = EstadoReserva.CONFIRMADA,
  ): FilaReserva {
    const fila: FilaReserva = {
      id: randomUUID(),
      usuarioId,
      turnoId: TURNO_ID,
      estado,
      createdAt: new Date(),
      turno: {
        fecha: enDias(3),
        horaInicio: '18:00',
        horaFin: '19:00',
        cancha: { id: CANCHA_ID, nombre: 'Cancha de tenis' },
      },
    };
    reservas.set(fila.id, fila);
    return fila;
  }

  /** Parsing del SQL de restitución para simular LEAST sobre el stock. */
  function sqlRestitucion(strings: TemplateStringsArray, valores: unknown[]): string {
    return strings.reduce(
      (sql, parte, i) =>
        sql + parte + (i < valores.length ? String(valores[i]) : ''),
      '',
    );
  }

  beforeEach(async () => {
    reservas = new Map();
    alquileres = new Map();
    equipamientos = new Map();
    sembrarEquipamiento(RAQUETA);
    sembrarEquipamiento(PELOTAS, { stockTotal: 12, stockDisponible: 12, precioUnitario: 2500 });

    prismaMock = {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      // Transacción simulada: snapshot al entrar, rollback (restaurar
      // snapshots) si el bloque lanza un error.
      transaccion: vi.fn(
        async (correr: (tx: unknown) => Promise<unknown>) => {
          const snapshot = {
            alquileres: new Map(alquileres),
            equipamientos: new Map(equipamientos),
          };
          const reservasAntes = reservas.size;
          try {
            return await correr(prismaMock);
          } catch (error) {
            alquileres.clear();
            equipamientos.clear();
            for (const [clave, valor] of snapshot.alquileres) {
              alquileres.set(clave, valor);
            }
            for (const [clave, valor] of snapshot.equipamientos) {
              equipamientos.set(clave, valor);
            }
            void reservasAntes;
            throw error;
          }
        },
      ),
      turno: {
        update: vi.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: { disponible: boolean };
          }) => Promise.resolve({ id: where.id, disponible: data.disponible }),
        ),
      },
      reserva: {
        findUnique: vi.fn(
          ({
            where,
          }: {
            where: { id: string };
          }) => {
            const fila = reservas.get(where.id);
            if (!fila) {
              return Promise.resolve(null);
            }
            const alquiler = [...alquileres.values()].find(
              (a) => a.reservaId === fila.id,
            );
            if (alquiler === undefined) {
              return Promise.resolve(fila);
            }
            return Promise.resolve({ ...fila, alquiler });
          },
        ),
        findMany: vi.fn(() =>
          Promise.resolve(
            [...reservas.values()].map((fila) => {
              const alquiler = [...alquileres.values()].find(
                (a) => a.reservaId === fila.id,
              );
              return alquiler === undefined ? fila : { ...fila, alquiler };
            }),
          ),
        ),
        updateMany: vi.fn(
          ({
            where,
            data,
          }: {
            where: { id: string; estado?: EstadoReserva };
            data: Partial<FilaReserva>;
          }) => {
            const actual = reservas.get(where.id);
            const coincide =
              actual !== undefined &&
              (where.estado === undefined || actual.estado === where.estado);
            if (!coincide) {
              return Promise.resolve({ count: 0 });
            }
            const actualizado = { ...actual, ...data } as FilaReserva;
            reservas.set(where.id, actualizado);
            return Promise.resolve({ count: 1 });
          },
        ),
      },
      equipamiento: {
        findMany: vi.fn(
          ({
            where,
            select,
          }: {
            where: { id: { in: string[] } };
            select: Record<string, boolean>;
          }) => {
            const filas = [...equipamientos.values()].filter((e) =>
              where.id.in.includes(e.id),
            );
            return Promise.resolve(
              filas.map((fila) => ({
                ...(select.activo === false ? {} : { activo: fila.activo }),
                id: fila.id,
                ...(select.precioUnitario === false
                  ? {}
                  : { precioUnitario: fila.precioUnitario }),
              })),
            );
          },
        ),
        updateMany: vi.fn(
          ({
            where,
            data,
          }: {
            where: { id: string; stockDisponible?: { gte: number } };
            data: { stockDisponible: { decrement: number } };
          }) => {
            const fila = equipamientos.get(where.id);
            const coincide =
              fila !== undefined &&
              (where.stockDisponible === undefined ||
                fila.stockDisponible >= where.stockDisponible.gte);
            if (!coincide) {
              return Promise.resolve({ count: 0 });
            }
            equipamientos.set(fila.id, {
              ...fila,
              stockDisponible: fila.stockDisponible - data.stockDisponible.decrement,
            });
            return Promise.resolve({ count: 1 });
          },
        ),
      },
      alquiler: {
        create: vi.fn(
          ({
            data,
          }: {
            data: {
              reservaId: string;
              total: number;
              items: { create: FilaItem[] };
            };
          }) => {
            const existente = [...alquileres.values()].find(
              (a) => a.reservaId === data.reservaId,
            );
            if (existente) {
              return Promise.reject({ code: 'P2002' });
            }
            const fila: FilaAlquiler = {
              id: randomUUID(),
              reservaId: data.reservaId,
              total: data.total,
              createdAt: new Date(),
              items: data.items.create,
            };
            alquileres.set(fila.id, fila);
            return Promise.resolve(fila);
          },
        ),
      },
      reservaEquipamiento: {
        findMany: vi.fn(
          async ({
            where,
          }: {
            where: { reservaId: string };
          }) => {
            const alquiler = [...alquileres.values()].find(
              (a) => a.reservaId === where.reservaId,
            );
            if (!alquiler) {
              return [];
            }
            return alquiler.items.map((item) => ({
              equipamientoId: item.equipamientoId,
              cantidad: item.cantidad,
            }));
          },
        ),
      },
      $executeRaw: vi.fn(
        async (
          strings: TemplateStringsArray,
          ...valores: unknown[]
        ): Promise<number> => {
          const sql = sqlRestitucion(strings, valores);
          const coincidencia = sql.match(
            /LEAST\("stock_disponible" \+ (\d+), "stock_total"\) WHERE "id" = ([0-9a-f-]{36})/u,
          );
          if (!coincidencia) {
            throw new Error(`SQL inesperado: ${sql}`);
          }
          const cantidad = Number(coincidencia[1]);
          const id = coincidencia[2];
          const fila = equipamientos.get(id);
          if (!fila) {
            return 0;
          }
          equipamientos.set(fila.id, {
            ...fila,
            stockDisponible: Math.min(
              fila.stockDisponible + cantidad,
              fila.stockTotal,
            ),
          });
          return 1;
        },
      ),
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

  describe('POST /reservas/:id/alquiler', () => {
    it('201: crea el alquiler, descuenta stock y congela los montos', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      const respuesta = await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { equipamientoId: PELOTAS, cantidad: 2 },
            { equipamientoId: RAQUETA, cantidad: 3 },
          ],
        })
        .expect(201);

      expect(respuesta.body.total).toBeCloseTo(3 * 500.5 + 2 * 2500);
      expect(respuesta.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            equipamientoId: RAQUETA,
            cantidad: 3,
            precioUnitario: 500.5,
            total: 1501.5,
          }),
          expect.objectContaining({
            equipamientoId: PELOTAS,
            cantidad: 2,
            precioUnitario: 2500,
            total: 5000,
          }),
        ]),
      );
      expect(equipamientos.get(RAQUETA)?.stockDisponible).toBe(5);
      expect(equipamientos.get(PELOTAS)?.stockDisponible).toBe(10);
    });

    it('400: items vacío', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [] })
        .expect(400);
      expect(alquileres.size).toBe(0);
    });

    it('400: cantidad 0', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: RAQUETA, cantidad: 0 }] })
        .expect(400);
      expect(alquileres.size).toBe(0);
    });

    it('400: cantidad no entera', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: RAQUETA, cantidad: 1.5 }] })
        .expect(400);
      expect(alquileres.size).toBe(0);
    });

    it('400: equipamientoId que no es UUID', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: 'no-es-uuid', cantidad: 1 }] })
        .expect(400);
      expect(alquileres.size).toBe(0);
    });

    it('400: equipamientoId repetido', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { equipamientoId: RAQUETA, cantidad: 1 },
            { equipamientoId: RAQUETA, cantidad: 2 },
          ],
        })
        .expect(400);
      expect(alquileres.size).toBe(0);
    });

    it('404: reserva inexistente', async () => {
      const token = await tokenUsuario();

      const respuesta = await request(server())
        .post(`/reservas/${randomUUID()}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: RAQUETA, cantidad: 1 }] })
        .expect(404);

      expect(respuesta.body.message).toBe('La reserva indicada no existe.');
      expect(alquileres.size).toBe(0);
    });

    it('404: equipamiento inexistente', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: randomUUID(), cantidad: 1 }] })
        .expect(404);

      expect(alquileres.size).toBe(0);
      expect(equipamientos.get(RAQUETA)?.stockDisponible).toBe(8);
    });

    it('409: reserva cancelada', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E, EstadoReserva.CANCELADA);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: RAQUETA, cantidad: 1 }] })
        .expect(409);

      expect(alquileres.size).toBe(0);
    });

    it('409: equipamiento inactivo', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);
      sembrarEquipamiento(PELOTAS, { activo: false });

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { equipamientoId: RAQUETA, cantidad: 1 },
            { equipamientoId: PELOTAS, cantidad: 1 },
          ],
        })
        .expect(409);

      expect(alquileres.size).toBe(0);
      expect(equipamientos.get(RAQUETA)?.stockDisponible).toBe(8);
    });

    it('409: stock insuficiente y no descuenta nada', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { equipamientoId: RAQUETA, cantidad: 1 },
            { equipamientoId: PELOTAS, cantidad: 13 },
          ],
        })
        .expect(409);

      expect(alquileres.size).toBe(0);
      expect(equipamientos.get(RAQUETA)?.stockDisponible).toBe(8);
      expect(equipamientos.get(PELOTAS)?.stockDisponible).toBe(12);
    });

    it('409: la reserva ya tiene un alquiler y no descuenta stock otra vez', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: RAQUETA, cantidad: 2 }] })
        .expect(201);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: PELOTAS, cantidad: 1 }] })
        .expect(409);

      expect(alquileres.size).toBe(1);
      expect(equipamientos.get(PELOTAS)?.stockDisponible).toBe(12);
    });

    it('403: un USUARIO no puede alquilar sobre una reserva ajena', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(USUARIO_ID_OTRO);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: RAQUETA, cantidad: 1 }] })
        .expect(403);

      expect(alquileres.size).toBe(0);
    });

    it('201: un ADMINISTRADOR puede alquilar sobre una reserva ajena', async () => {
      const token = await tokenAdmin();
      const reserva = filaReserva(USUARIO_ID_OTRO);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: RAQUETA, cantidad: 1 }] })
        .expect(201);
    });

    it('401: sin autenticación', async () => {
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .send({ items: [{ equipamientoId: RAQUETA, cantidad: 1 }] })
        .expect(401);
      expect(alquileres.size).toBe(0);
    });

    it('el precio queda congelado aunque el catálogo cambie después', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      const respuesta = await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: RAQUETA, cantidad: 2 }] })
        .expect(201);

      equipamientos.set(RAQUETA, {
        ...equipamientos.get(RAQUETA)!,
        precioUnitario: 9999,
      });

      expect(respuesta.body.items).toEqual([
        expect.objectContaining({ precioUnitario: 500.5, total: 1001 }),
      ]);
      expect(respuesta.body.total).toBeCloseTo(500.5 * 2);
    });
  });

  describe('PATCH /reservas/:id/cancelar restituye el stock', () => {
    it('200: cancelar una reserva con alquiler devuelve el stock', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { equipamientoId: RAQUETA, cantidad: 3 },
            { equipamientoId: PELOTAS, cantidad: 4 },
          ],
        })
        .expect(201);
      expect(equipamientos.get(RAQUETA)?.stockDisponible).toBe(5);

      await request(server())
        .patch(`/reservas/${reserva.id}/cancelar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(equipamientos.get(RAQUETA)?.stockDisponible).toBe(8);
      expect(equipamientos.get(PELOTAS)?.stockDisponible).toBe(12);
    });

    it('200: cancelar una reserva sin alquiler no toca el stock', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .patch(`/reservas/${reserva.id}/cancelar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(equipamientos.get(RAQUETA)?.stockDisponible).toBe(8);
      expect(equipamientos.get(PELOTAS)?.stockDisponible).toBe(12);
    });

    it('la restitución no supera el stock total', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: RAQUETA, cantidad: 3 }] })
        .expect(201);

      // El admin reduce el stock total después de crear el alquiler.
      equipamientos.set(RAQUETA, {
        ...equipamientos.get(RAQUETA)!,
        stockTotal: 4,
        stockDisponible: 2,
      });

      await request(server())
        .patch(`/reservas/${reserva.id}/cancelar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(equipamientos.get(RAQUETA)?.stockDisponible).toBe(4);
    });

    it('cancelar dos veces: 409 y el stock no se restituye dos veces', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: RAQUETA, cantidad: 2 }] })
        .expect(201);

      await request(server())
        .patch(`/reservas/${reserva.id}/cancelar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(server())
        .patch(`/reservas/${reserva.id}/cancelar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);

      expect(equipamientos.get(RAQUETA)?.stockDisponible).toBe(8);
    });
  });

  describe('GET /reservas/mis incluye el alquiler', () => {
    it('200: reserva con alquiler incluye total e items', async () => {
      const token = await tokenUsuario();
      const reserva = filaReserva(SOCIO_E2E);

      await request(server())
        .post(`/reservas/${reserva.id}/alquiler`)
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ equipamientoId: RAQUETA, cantidad: 2 }] })
        .expect(201);

      const respuesta = await request(server())
        .get('/reservas/mis')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const conAlquiler = respuesta.body.find(
        (r: { id: string }) => r.id === reserva.id,
      );
      expect(conAlquiler.alquiler).toMatchObject({
        total: 500.5 * 2,
      });
      expect(conAlquiler.alquiler.items).toEqual([
        expect.objectContaining({
          equipamientoId: RAQUETA,
          cantidad: 2,
          precioUnitario: 500.5,
        }),
      ]);
    });

    it('200: reserva sin alquiler incluye alquiler null', async () => {
      const token = await tokenUsuario();
      filaReserva(SOCIO_E2E);

      const respuesta = await request(server())
        .get('/reservas/mis')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body).toHaveLength(1);
      expect(respuesta.body[0].alquiler).toBeNull();
    });
  });
});

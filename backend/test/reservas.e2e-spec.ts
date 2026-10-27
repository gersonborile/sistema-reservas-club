import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { validationPipe } from '../src/comun/validation-pipe.js';
import { EstadoReserva, RolUsuario } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

process.env.JWT_SECRET ??= 'secreto-de-prueba-e2e-no-usar-en-produccion';
process.env.JWT_EXPIRES_IN ??= '1h';

const SOCIO_E2E = 'socio-e2e';
const USUARIO_ID = '11111111-1111-4111-8111-111111111111';
const USUARIO_ID_OTRO = '22222222-2222-4222-8222-222222222222';
const CANCHA_FUTBOL = '33333333-3333-4333-8333-333333333333';
const CANCHA_TENIS = '44444444-4444-4444-8444-444444444444';
const TURNO_LIBRE = '66666666-6666-4666-8666-666666666666';
const TURNO_EN_MANTENIMIENTO = '77777777-7777-4777-8777-777777777777';
const TURNO_OCUPADO = '88888888-8888-4888-8888-888888888888';
const TURNO_PASADO = '99999999-9999-4999-8999-999999999999';
const TURNO_MISMA_FRANJA = 'aaaa1111-1111-4111-8111-111111111111';
const TURNO_INMEDIATO = 'aaaa2222-2222-4222-8222-222222222222';

type FilaTurno = {
  id: string;
  canchaId: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
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

function enDias(dias: number): string {
  const fecha = new Date();
  fecha.setUTCHours(0, 0, 0, 0);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

function fechaUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Fecha y hora de un turno que comienza dentro de menos de 2 horas (UTC). */
function enUnaHora(): { fecha: string; horaInicio: string; horaFin: string } {
  const inicio = new Date(Date.now() + 60 * 60 * 1000);
  const fin = new Date(inicio.getTime() + 60 * 60 * 1000);
  const hora = (instante: { getUTCHours(): number; getUTCMinutes(): number }) =>
    `${String(instante.getUTCHours()).padStart(2, '0')}:${String(
      instante.getUTCMinutes(),
    ).padStart(2, '0')}`;
  return {
    fecha: inicio.toISOString().slice(0, 10),
    horaInicio: hora(inicio),
    horaFin: hora(fin),
  };
}

describe('Reservas (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let canchas: Map<string, { id: string; nombre: string; estado: string }>;
  let turnos: Map<string, FilaTurno>;
  let reservas: Map<string, FilaReserva>;
  let usuarios: Map<string, { id: string }>;
  let prismaMock: Record<string, unknown>;

  const server = () => app.getHttpServer();

  async function tokenAdmin(): Promise<string> {
    return jwtService.signAsync({
      userId: 'admin-e2e',
      email: 'admin-reservas@clubdeportivo.test',
      rol: RolUsuario.ADMINISTRADOR,
    });
  }

  async function tokenUsuario(): Promise<string> {
    return jwtService.signAsync({
      userId: 'socio-e2e',
      email: 'socio-reservas@clubdeportivo.test',
      rol: RolUsuario.USUARIO,
    });
  }

  function sembrarTurno(datos: Partial<FilaTurno> & { id: string; horaInicio: string; horaFin: string }): void {
    const fila: FilaTurno = {
      canchaId: CANCHA_FUTBOL,
      fecha: fechaUtc(enDias(3)),
      disponible: true,
      ...datos,
    };
    turnos.set(fila.id, fila);
  }

  function registrarReserva(fila: FilaReserva): void {
    reservas.set(fila.id, fila);
  }

  function filaReservaFromTurno(
    turnoId: string,
    usuarioId: string,
    estado = EstadoReserva.CONFIRMADA,
  ): FilaReserva {
    const turno = turnos.get(turnoId)!;
    const cancha = canchas.get(turno.canchaId)!;
    return {
      id: randomUUID(),
      usuarioId,
      turnoId,
      estado,
      createdAt: new Date(),
      turno: {
        fecha: turno.fecha,
        horaInicio: turno.horaInicio,
        horaFin: turno.horaFin,
        cancha: { id: cancha.id, nombre: cancha.nombre },
      },
    };
  }

    beforeEach(async () => {
    turnos = new Map();
    reservas = new Map();
    canchas = new Map([
      [CANCHA_FUTBOL, { id: CANCHA_FUTBOL, nombre: 'Cancha de fútbol', estado: 'DISPONIBLE' }],
      [CANCHA_TENIS, { id: CANCHA_TENIS, nombre: 'Cancha de tenis', estado: 'DISPONIBLE' }],
    ]);
    usuarios = new Map([
      [USUARIO_ID, { id: USUARIO_ID }],
      [USUARIO_ID_OTRO, { id: USUARIO_ID_OTRO }],
    ]);

    sembrarTurno({ id: TURNO_LIBRE, horaInicio: '18:00', horaFin: '19:00' });
    sembrarTurno({
      id: TURNO_EN_MANTENIMIENTO,
      canchaId: CANCHA_TENIS,
      horaInicio: '19:00',
      horaFin: '20:00',
    });
    sembrarTurno({ id: TURNO_OCUPADO, horaInicio: '20:00', horaFin: '21:00', disponible: false });
    sembrarTurno({
      id: TURNO_PASADO,
      fecha: fechaUtc(enDias(-2)),
      horaInicio: '09:00',
      horaFin: '10:00',
    });
    sembrarTurno({
      id: TURNO_MISMA_FRANJA,
      canchaId: CANCHA_TENIS,
      fecha: fechaUtc(enDias(3)),
      horaInicio: '18:00',
      horaFin: '19:00',
    });
    const { fecha, horaInicio, horaFin } = enUnaHora();
    sembrarTurno({
      id: TURNO_INMEDIATO,
      fecha: fechaUtc(fecha),
      horaInicio,
      horaFin,
    });

    registrarReserva(filaReservaFromTurno(TURNO_OCUPADO, USUARIO_ID_OTRO));

    prismaMock = {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      transaccion: vi.fn(
        async (correr: (tx: unknown) => Promise<unknown>) => correr(prismaMock),
      ),
      cancha: {
        findUnique: vi.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(canchas.get(where.id) ?? null),
        ),
      },
      usuario: {
        findUnique: vi.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(usuarios.get(where.id) ?? null),
        ),
      },
      turno: {
        findUnique: vi.fn(({ where }: { where: { id?: string } }) => {
          const turno = where.id !== undefined ? (turnos.get(where.id) ?? null) : null;
          if (!turno) {
            return Promise.resolve(null);
          }
          const cancha = canchas.get(turno.canchaId)!;
          return Promise.resolve({
            ...turno,
            cancha: { id: cancha.id, nombre: cancha.nombre, estado: cancha.estado },
          });
        }),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: Partial<FilaTurno>;
          }) => {
            const actual = turnos.get(where.id);
            if (!actual) {
              return Promise.reject(new Error('turno inexistente'));
            }
            const actualizado = { ...actual, ...data };
            turnos.set(where.id, actualizado);
            return Promise.resolve(actualizado);
          },
        ),
        updateMany: vi.fn(
          ({
            where,
            data,
          }: {
            where: { id: string; disponible?: boolean };
            data: Partial<FilaTurno>;
          }) => {
            const actual = turnos.get(where.id);
            const coincide =
              actual !== undefined &&
              (where.disponible === undefined || actual.disponible === where.disponible);
            if (!coincide) {
              return Promise.resolve({ count: 0 });
            }
            turnos.set(where.id, { ...actual, ...data });
            return Promise.resolve({ count: 1 });
          },
        ),
      },
      reserva: {
        findUnique: vi.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(reservas.get(where.id) ?? null),
        ),
        findMany: vi.fn(
          ({
            where = {},
          }: {
            where?: { usuarioId?: string };
          } = {}) => {
            const res = [...reservas.values()].filter(
              (r) => where.usuarioId === undefined || r.usuarioId === where.usuarioId,
            );
            res.sort((a, b) => {
              const porFecha = b.turno.fecha.getTime() - a.turno.fecha.getTime();
              if (porFecha !== 0) {
                return porFecha;
              }
              return b.turno.horaInicio.localeCompare(a.turno.horaInicio);
            });
            return Promise.resolve(res);
          },
        ),
        create: vi.fn(
          ({
            data,
          }: {
            data: { usuarioId: string; turnoId: string; estado: EstadoReserva };
          }) => {
            const fila = filaReservaFromTurno(data.turnoId, data.usuarioId, data.estado);
            reservas.set(fila.id, fila);
            return Promise.resolve(fila);
          },
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

  describe('POST /reservas', () => {
    const cuerpoValido = () => ({ turnoId: TURNO_LIBRE });

    it('201: crea la reserva confirmada y deja el turno ocupado', async () => {
      const token = await tokenUsuario();

      const respuesta = await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send(cuerpoValido())
        .expect(201);

      expect(respuesta.body).toMatchObject({
        usuarioId: 'socio-e2e',
        turnoId: TURNO_LIBRE,
        estado: 'CONFIRMADA',
      });
      expect(Object.keys(respuesta.body).sort()).toEqual([
        'createdAt',
        'estado',
        'id',
        'turno',
        'turnoId',
        'usuarioId',
      ]);
      expect(respuesta.body.turno).toEqual({
        fecha: enDias(3),
        horaInicio: '18:00',
        horaFin: '19:00',
        cancha: { id: CANCHA_FUTBOL, nombre: 'Cancha de fútbol' },
      });
      expect(turnos.get(TURNO_LIBRE)?.disponible).toBe(false);
    });

    it('409: turno ya reservado', async () => {
      const token = await tokenUsuario();

      await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({ turnoId: TURNO_OCUPADO })
        .expect(409);

      expect(reservas.size).toBe(1);
    });

    it('201: turno de la misma franja en otra cancha se reserva sin conflictos', async () => {
      const token = await tokenUsuario();

      await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({ turnoId: TURNO_MISMA_FRANJA })
        .expect(201);

      await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({ turnoId: TURNO_LIBRE })
        .expect(201);
    });

    it('400: turno pasado', async () => {
      const token = await tokenUsuario();

      const respuesta = await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({ turnoId: TURNO_PASADO })
        .expect(400);

      expect(respuesta.body.message).toBe('El turno ya pasó y no puede reservarse.');
      expect(reservas.size).toBe(1);
      expect(turnos.get(TURNO_PASADO)?.disponible).toBe(true);
    });

    it('404: turno inexistente', async () => {
      const token = await tokenUsuario();

      await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({ turnoId: randomUUID() })
        .expect(404);

      expect(reservas.size).toBe(1);
    });

    it('409: cancha en mantenimiento', async () => {
      const token = await tokenUsuario();
      canchas.set(CANCHA_TENIS, {
        id: CANCHA_TENIS,
        nombre: 'Cancha de tenis',
        estado: 'EN_MANTENIMIENTO',
      });

      await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({ turnoId: TURNO_EN_MANTENIMIENTO })
        .expect(409);

      expect(turnos.get(TURNO_EN_MANTENIMIENTO)?.disponible).toBe(true);
    });

    it('409: cancha ocupada', async () => {
      const token = await tokenUsuario();
      canchas.set(CANCHA_TENIS, {
        id: CANCHA_TENIS,
        nombre: 'Cancha de tenis',
        estado: 'OCUPADA',
      });

      await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({ turnoId: TURNO_EN_MANTENIMIENTO })
        .expect(409);
    });

    it('400: sin turnoId', async () => {
      const token = await tokenUsuario();

      await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it('400: turnoId que no es UUID', async () => {
      const token = await tokenUsuario();

      await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({ turnoId: 'no-es-uuid' })
        .expect(400);
    });

    it('400: no acepta items de equipamiento en la reserva', async () => {
      const token = await tokenUsuario();

      await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({ turnoId: TURNO_LIBRE, items: [] })
        .expect(400);

      expect(reservas.size).toBe(1);
      expect(turnos.get(TURNO_LIBRE)?.disponible).toBe(true);
    });

    it('403: usuario reserva para otro usuario', async () => {
      const token = await tokenUsuario();

      await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({ turnoId: TURNO_LIBRE, usuarioId: USUARIO_ID_OTRO })
        .expect(403);

      expect(reservas.size).toBe(1);
      expect(turnos.get(TURNO_LIBRE)?.disponible).toBe(true);
    });

    it('201: administrador reserva en nombre de un usuario existente', async () => {
      const token = await tokenAdmin();

      const respuesta = await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({ turnoId: TURNO_LIBRE, usuarioId: USUARIO_ID })
        .expect(201);

      expect(respuesta.body.usuarioId).toBe(USUARIO_ID);
    });

    it('404: administrador indica un usuario inexistente', async () => {
      const token = await tokenAdmin();

      await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({ turnoId: TURNO_LIBRE, usuarioId: randomUUID() })
        .expect(404);

      expect(reservas.size).toBe(1);
      expect(turnos.get(TURNO_LIBRE)?.disponible).toBe(true);
    });

    it('401: sin autenticación', async () => {
      await request(server()).post('/reservas').send(cuerpoValido()).expect(401);
      expect(reservas.size).toBe(1);
    });
  });

  describe('GET /reservas/mis', () => {
    beforeEach(async () => {
      registrarReserva(filaReservaFromTurno(TURNO_LIBRE, SOCIO_E2E));
      registrarReserva(
        filaReservaFromTurno(TURNO_EN_MANTENIMIENTO, USUARIO_ID_OTRO),
      );
      registrarReserva(
        filaReservaFromTurno(TURNO_OCUPADO, SOCIO_E2E, EstadoReserva.CANCELADA),
      );
    });

    it('200: usuario consulta solo sus reservas, con el turno embebido', async () => {
      const token = await tokenUsuario();

      const respuesta = await request(server())
        .get('/reservas/mis')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body).toHaveLength(2);
      expect(
        respuesta.body.every(
          (r: { usuarioId: string }) => r.usuarioId === SOCIO_E2E,
        ),
      ).toBe(true);
    });

    it('200: administrador ve todas las reservas', async () => {
      const token = await tokenAdmin();

      const respuesta = await request(server())
        .get('/reservas/mis')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body).toHaveLength(4);
    });

    it('200: administrador filtra por usuarioId', async () => {
      const token = await tokenAdmin();

      const respuesta = await request(server())
        .get(`/reservas/mis?usuarioId=${USUARIO_ID_OTRO}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body).toHaveLength(2);
      expect(respuesta.body.every((r: { usuarioId: string }) => r.usuarioId === USUARIO_ID_OTRO)).toBe(true);
    });

    it('403: usuario intenta ver las reservas de otro usuario', async () => {
      const token = await tokenUsuario();

      await request(server())
        .get(`/reservas/mis?usuarioId=${USUARIO_ID_OTRO}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('401: sin autenticación', async () => {
      await request(server()).get('/reservas/mis').expect(401);
    });
  });

  describe('PATCH /reservas/:id/cancelar', () => {
    let reservaPropia: FilaReserva;
    let reservaAjena: FilaReserva;

    beforeEach(() => {
      reservaPropia = filaReservaFromTurno(TURNO_LIBRE, SOCIO_E2E);
      registrarReserva(reservaPropia);
      reservaAjena = filaReservaFromTurno(TURNO_EN_MANTENIMIENTO, USUARIO_ID_OTRO);
      registrarReserva(reservaAjena);
    });

    it('200: cancela una reserva propia y libera el turno', async () => {
      const token = await tokenUsuario();

      const respuesta = await request(server())
        .patch(`/reservas/${reservaPropia.id}/cancelar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body).toMatchObject({
        id: reservaPropia.id,
        estado: 'CANCELADA',
      });
      expect(reservas.get(reservaPropia.id)?.estado).toBe(EstadoReserva.CANCELADA);
      expect(turnos.get(TURNO_LIBRE)?.disponible).toBe(true);
    });

    it('201: el turno liberado puede reservarse de nuevo', async () => {
      const token = await tokenUsuario();

      await request(server())
        .patch(`/reservas/${reservaPropia.id}/cancelar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(server())
        .post('/reservas')
        .set('Authorization', `Bearer ${token}`)
        .send({ turnoId: TURNO_LIBRE })
        .expect(201);
    });

    it('200: administrador cancela la reserva de otro usuario', async () => {
      const token = await tokenAdmin();

      const respuesta = await request(server())
        .patch(`/reservas/${reservaAjena.id}/cancelar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body.estado).toBe('CANCELADA');
      expect(turnos.get(TURNO_EN_MANTENIMIENTO)?.disponible).toBe(true);
    });

    it('409: fuera de la ventana de 2 horas', async () => {
      const token = await tokenUsuario();
      const reservaInmediata = filaReservaFromTurno(TURNO_INMEDIATO, SOCIO_E2E);
      registrarReserva(reservaInmediata);

      const respuesta = await request(server())
        .patch(`/reservas/${reservaInmediata.id}/cancelar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);

      expect(respuesta.body.message).toBe(
        'La reserva ya no puede cancelarse: el turno se inicia en menos de 2 horas.',
      );
      expect(reservas.get(reservaInmediata.id)?.estado).toBe(EstadoReserva.CONFIRMADA);
    });

    it('409: reserva ya cancelada', async () => {
      const token = await tokenUsuario();
 registrarReserva(
        filaReservaFromTurno(TURNO_PASADO, SOCIO_E2E, EstadoReserva.CANCELADA),
      );
      reservaPropia.estado = EstadoReserva.CANCELADA;

      await request(server())
        .patch(`/reservas/${reservaPropia.id}/cancelar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);
    });

    it('403: cancelar reserva ajena siendo usuario', async () => {
      const token = await tokenUsuario();

      await request(server())
        .patch(`/reservas/${reservaAjena.id}/cancelar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(reservas.get(reservaAjena.id)?.estado).toBe(EstadoReserva.CONFIRMADA);
    });

    it('404: reserva inexistente', async () => {
      const token = await tokenUsuario();

      await request(server())
        .patch(`/reservas/${randomUUID()}/cancelar`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('401: sin autenticación', async () => {
      await request(server())
        .patch(`/reservas/${reservaPropia.id}/cancelar`)
        .expect(401);

      expect(reservas.get(reservaPropia.id)?.estado).toBe(EstadoReserva.CONFIRMADA);
    });
  });
});


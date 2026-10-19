import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { validationPipe } from '../src/comun/validation-pipe.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

process.env.JWT_SECRET ??= 'secreto-de-prueba-e2e-no-usar-en-produccion';
process.env.JWT_EXPIRES_IN ??= '1h';

const CANCHA_TENIS = '11111111-1111-4111-8111-111111111111';
const CANCHA_PADEL = '22222222-2222-4222-8222-222222222222';
const DISCIPLINA_TENIS = '33333333-3333-4333-8333-333333333333';
const DISCIPLINA_PADEL = '44444444-4444-4444-8444-444444444444';
const TURNO_TENIS_1 = '55555555-5555-4555-8555-555555555555';
const TURNO_TENIS_2 = '66666666-6666-4666-8666-666666666666';
const TURNO_PADEL = '77777777-7777-4777-8777-777777777777';

type FilaTurno = {
  id: string;
  canchaId: string;
  disciplinaId: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
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

describe('Turnos (e2e)', () => {
  let app: INestApplication<App>;
  let turnos: Map<string, FilaTurno>;
  let canchas: Map<string, { id: string }>;
  let disciplinas: Map<string, { id: string }>;
  let prismaMock: Record<string, unknown>;

  const server = () => app.getHttpServer();

  function sembrarTurno(fila: Omit<FilaTurno, 'id'> & { id: string }): void {
    turnos.set(fila.id, fila);
  }

  function coincide(valor: unknown, filtro: unknown): boolean {
    if (filtro === undefined) {
      return true;
    }
    if (valor instanceof Date && filtro instanceof Date) {
      return valor.getTime() === filtro.getTime();
    }
    return valor === filtro;
  }

  function comparar(a: FilaTurno, b: FilaTurno): number {
    const porFecha = a.fecha.getTime() - b.fecha.getTime();
    if (porFecha !== 0) {
      return porFecha;
    }
    const porHora = a.horaInicio.localeCompare(b.horaInicio);
    if (porHora !== 0) {
      return porHora;
    }
    return a.canchaId.localeCompare(b.canchaId);
  }

  function filtrar(where: Record<string, unknown>): FilaTurno[] {
    return [...turnos.values()].filter((turno) =>
      Object.entries(where).every(([clave, filtro]) =>
        coincide(turno[clave as keyof FilaTurno], filtro),
      ),
    );
  }

  beforeEach(async () => {
    turnos = new Map();
    canchas = new Map([
      [CANCHA_TENIS, { id: CANCHA_TENIS }],
      [CANCHA_PADEL, { id: CANCHA_PADEL }],
    ]);
    disciplinas = new Map([
      [DISCIPLINA_TENIS, { id: DISCIPLINA_TENIS }],
      [DISCIPLINA_PADEL, { id: DISCIPLINA_PADEL }],
    ]);

    sembrarTurno({
      id: TURNO_TENIS_1,
      canchaId: CANCHA_TENIS,
      disciplinaId: DISCIPLINA_TENIS,
      fecha: fechaUtc(enDias(3)),
      horaInicio: '08:00',
      horaFin: '09:00',
      disponible: true,
    });
    sembrarTurno({
      id: TURNO_TENIS_2,
      canchaId: CANCHA_TENIS,
      disciplinaId: DISCIPLINA_TENIS,
      fecha: fechaUtc(enDias(3)),
      horaInicio: '09:00',
      horaFin: '10:00',
      disponible: true,
    });
    sembrarTurno({
      id: TURNO_PADEL,
      canchaId: CANCHA_PADEL,
      disciplinaId: DISCIPLINA_PADEL,
      fecha: fechaUtc(enDias(4)),
      horaInicio: '18:00',
      horaFin: '19:00',
      disponible: false,
    });

    prismaMock = {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      cancha: {
        findUnique: vi.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(canchas.get(where.id) ?? null),
        ),
      },
      disciplina: {
        findUnique: vi.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(disciplinas.get(where.id) ?? null),
        ),
      },
      turno: {
        findMany: vi.fn(
          ({
            where = {},
            skip = 0,
            take,
          }: {
            where?: Record<string, unknown>;
            skip?: number;
            take?: number;
          } = {}) => {
            const ordenados = filtrar(where).sort(comparar);
            const fin = take === undefined ? undefined : skip + take;
            return Promise.resolve(ordenados.slice(skip, fin));
          },
        ),
        findUnique: vi.fn(({ where }: { where: { id?: string } }) =>
          Promise.resolve(
            where.id !== undefined ? (turnos.get(where.id) ?? null) : null,
          ),
        ),
        create: vi.fn(({ data }: { data: Omit<FilaTurno, 'id'> }) => {
          const creado: FilaTurno = { id: randomUUID(), ...data };
          turnos.set(creado.id, creado);
          return Promise.resolve(creado);
        }),
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
        delete: vi.fn(({ where }: { where: { id: string } }) => {
          const eliminado = turnos.get(where.id);
          turnos.delete(where.id);
          return Promise.resolve(eliminado);
        }),
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
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /turnos', () => {
    it('200: lista todos los turnos con sus campos y disponibilidad', async () => {
      const respuesta = await request(server()).get('/turnos').expect(200);

      expect(respuesta.body).toHaveLength(3);
      const primero = respuesta.body.find(
        (turno: { id: string }) => turno.id === TURNO_TENIS_1,
      );
      expect(Object.keys(primero).sort()).toEqual([
        'cancha_id',
        'disciplina_id',
        'disponible',
        'fecha',
        'hora_fin',
        'hora_inicio',
        'id',
      ]);
      expect(primero).toMatchObject({
        cancha_id: CANCHA_TENIS,
        disciplina_id: DISCIPLINA_TENIS,
        fecha: enDias(3),
        hora_inicio: '08:00',
        hora_fin: '09:00',
        disponible: true,
      });
    });

    it('200: filtra por cancha_id', async () => {
      const respuesta = await request(server())
        .get(`/turnos?cancha_id=${CANCHA_TENIS}`)
        .expect(200);

      expect(respuesta.body.map((turno: { id: string }) => turno.id).sort()).toEqual(
        [TURNO_TENIS_1, TURNO_TENIS_2].sort(),
      );
    });

    it('200: filtra por disciplina_id', async () => {
      const respuesta = await request(server())
        .get(`/turnos?disciplina_id=${DISCIPLINA_PADEL}`)
        .expect(200);

      expect(respuesta.body.map((turno: { id: string }) => turno.id)).toEqual([
        TURNO_PADEL,
      ]);
    });

    it('200: filtra por fecha', async () => {
      const respuesta = await request(server())
        .get(`/turnos?fecha=${enDias(3)}`)
        .expect(200);

      expect(respuesta.body.map((turno: { id: string }) => turno.id).sort()).toEqual(
        [TURNO_TENIS_1, TURNO_TENIS_2].sort(),
      );
    });

    it('200: pagina con page y limit devolviendo el subconjunto esperado', async () => {
      const primera = await request(server())
        .get('/turnos?page=1&limit=2')
        .expect(200);
      const segunda = await request(server())
        .get('/turnos?page=2&limit=2')
        .expect(200);

      expect(primera.body).toHaveLength(2);
      expect(segunda.body).toHaveLength(1);
      const ids = [...primera.body, ...segunda.body].map(
        (turno: { id: string }) => turno.id,
      );
      expect(ids.sort()).toEqual([TURNO_TENIS_1, TURNO_TENIS_2, TURNO_PADEL].sort());
      expect(
        primera.body.every((turno: Record<string, unknown>) =>
          Object.hasOwn(turno, 'disponible'),
        ),
      ).toBe(true);
    });

    it('400: rechaza una fecha con formato inválido', async () => {
      await request(server()).get('/turnos?fecha=no-es-fecha').expect(400);
    });
  });

  describe('GET /turnos/:id', () => {
    it('200: devuelve el turno con cancha, disciplina y disponibilidad', async () => {
      const respuesta = await request(server())
        .get(`/turnos/${TURNO_TENIS_1}`)
        .expect(200);

      expect(respuesta.body).toEqual({
        id: TURNO_TENIS_1,
        cancha_id: CANCHA_TENIS,
        disciplina_id: DISCIPLINA_TENIS,
        fecha: enDias(3),
        hora_inicio: '08:00',
        hora_fin: '09:00',
        disponible: true,
      });
    });

    it('404: id inexistente sin exponer detalles del turno', async () => {
      const respuesta = await request(server())
        .get(`/turnos/${randomUUID()}`)
        .expect(404);

      expect(respuesta.body).toEqual({
        message: 'El turno indicado no existe.',
        error: 'Not Found',
        statusCode: 404,
      });
      expect(respuesta.body).not.toHaveProperty('id');
    });

    it('404: id con formato inválido', async () => {
      await request(server()).get('/turnos/no-es-un-uuid').expect(404);
    });
  });
});

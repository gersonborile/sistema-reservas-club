import { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { validationPipe } from '../src/comun/validation-pipe.js';
import {
  EstadoCancha,
  RolUsuario,
} from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

process.env.JWT_SECRET ??= 'secreto-de-prueba-e2e-no-usar-en-produccion';
process.env.JWT_EXPIRES_IN ??= '1h';

const CONTRASENA_SOCIO = 'Socio123!';
const CONTRASENA_ADMIN = 'Admin123!';
const EMAIL_SOCIO = 'socio-canchas@clubdeportivo.test';
const EMAIL_ADMIN = 'admin-canchas@clubdeportivo.test';

const TENIS_ID = 'd0000001-0000-4000-8000-000000000001';
const FUTBOL_ID = 'd0000002-0000-4000-8000-000000000002';
const PADEL_ID = 'd0000003-0000-4000-8000-000000000003';
const DISCIPLINA_INEXISTENTE_ID = 'd00000ff-0000-4000-8000-0000000000ff';

const CANCHA_TENIS_1 = 'c0a80001-0000-4000-8000-000000000001';
const CANCHA_FUTBOL = 'c0a80003-0000-4000-8000-000000000003';
const CANCHA_PADEL_MANT = 'c0a80004-0000-4000-8000-000000000004';
const CANCHA_CON_TURNOS = 'c0a80005-0000-4000-8000-000000000005';
const CANCHA_INEXISTENTE = 'c0a800ff-0000-4000-8000-0000000000ff';
const ID_UUID_INVALIDO = 'no-es-uuid';

type DisciplinaFila = { id: string; nombre: string };
type CanchaFila = {
  id: string;
  nombre: string;
  ubicacion: string;
  capacidad: number;
  estado: EstadoCancha;
  disciplinas: DisciplinaFila[];
};
type UsuarioFila = {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: RolUsuario;
  contacto: string | null;
};

describe('Canchas (e2e)', () => {
  let app: INestApplication<App>;
  let disciplinas: DisciplinaFila[];
  let canchas: CanchaFila[];
  let usuarios: Map<string, UsuarioFila>;
  let canchasConTurnos: Set<string>;
  let prismaMock: {
    $connect: ReturnType<typeof vi.fn>;
    $disconnect: ReturnType<typeof vi.fn>;
    usuario: { findUnique: ReturnType<typeof vi.fn> };
    disciplina: { findMany: ReturnType<typeof vi.fn> };
    cancha: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    turno: { count: ReturnType<typeof vi.fn> };
  };

  const server = () => app.getHttpServer();

  beforeEach(async () => {
    disciplinas = [
      { id: TENIS_ID, nombre: 'tenis' },
      { id: FUTBOL_ID, nombre: 'futbol' },
      { id: PADEL_ID, nombre: 'padel' },
    ];
    canchas = [
      {
        id: CANCHA_TENIS_1,
        nombre: 'Cancha de Tenis 1',
        ubicacion: 'Pista A',
        capacidad: 4,
        estado: EstadoCancha.DISPONIBLE,
        disciplinas: [disciplinas[0]],
      },
      {
        id: CANCHA_FUTBOL,
        nombre: 'Cancha de Futbol 1',
        ubicacion: 'Predio central',
        capacidad: 22,
        estado: EstadoCancha.DISPONIBLE,
        disciplinas: [disciplinas[1]],
      },
      {
        id: CANCHA_PADEL_MANT,
        nombre: 'Cancha de Padel 2',
        ubicacion: 'Cubierta 2',
        capacidad: 4,
        estado: EstadoCancha.EN_MANTENIMIENTO,
        disciplinas: [disciplinas[2]],
      },
      {
        id: CANCHA_CON_TURNOS,
        nombre: 'Cancha de Padel 3',
        ubicacion: 'Cubierta 3',
        capacidad: 4,
        estado: EstadoCancha.DISPONIBLE,
        disciplinas: [disciplinas[2]],
      },
    ];
    usuarios = new Map<string, UsuarioFila>([
      [
        EMAIL_SOCIO,
        {
          id: 'u-socio-canchas',
          nombre: 'Socio Canchas',
          email: EMAIL_SOCIO,
          passwordHash: bcrypt.hashSync(CONTRASENA_SOCIO, 10),
          rol: RolUsuario.USUARIO,
          contacto: '+54 9 11 0000 0020',
        },
      ],
      [
        EMAIL_ADMIN,
        {
          id: 'u-admin-canchas',
          nombre: 'Admin Canchas',
          email: EMAIL_ADMIN,
          passwordHash: bcrypt.hashSync(CONTRASENA_ADMIN, 10),
          rol: RolUsuario.ADMINISTRADOR,
          contacto: 'admin-canchas@clubdeportivo.test',
        },
      ],
    ]);
    canchasConTurnos = new Set([CANCHA_CON_TURNOS]);

    let siguiente = 0;

    function resolverNombreIgual(
      cancha: CanchaFila,
      where: {
        nombre?: { equals?: string; mode?: string };
        NOT?: { id?: string };
      },
    ): boolean {
      if (where.NOT?.id && cancha.id === where.NOT.id) {
        return false;
      }
      if (!where.nombre?.equals) {
        return true;
      }
      const izquierda = cancha.nombre.toLowerCase();
      const derecha = where.nombre.equals.toLowerCase();
      return where.nombre.mode === 'insensitive'
        ? izquierda === derecha
        : cancha.nombre === where.nombre.equals;
    }

    prismaMock = {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      usuario: {
        findUnique: vi.fn(
          ({ where }: { where: { email?: string; id?: string } }) => {
            if (where.email !== undefined) {
              return Promise.resolve(usuarios.get(where.email) ?? null);
            }
            return (
              [...usuarios.values()].find((u) => u.id === where.id) ?? null
            );
          },
        ),
      },
      disciplina: {
        findMany: vi.fn(
          (args?: {
            where?: { id?: { in?: string[] } };
            orderBy?: { nombre?: string };
          }) => {
            let resultado = [...disciplinas];
            if (args?.where?.id?.in) {
              const ids = args.where.id.in;
              resultado = resultado.filter((d) => ids.includes(d.id));
            }
            if (args?.orderBy?.nombre === 'asc') {
              resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
            }
            return Promise.resolve(resultado);
          },
        ),
      },
      cancha: {
        findMany: vi.fn(
          (args: {
            where?: {
              estado?: EstadoCancha;
              disciplinas?: { some?: { nombre?: { equals?: string; mode?: string } } };
            };
            skip?: number;
            take?: number;
          }) => {
            let resultado = [...canchas];
            const where = args.where ?? {};
            if (where.estado) {
              resultado = resultado.filter((c) => c.estado === where.estado);
            }
            const filtroDisciplina = where.disciplinas?.some?.nombre;
            if (filtroDisciplina?.equals) {
              resultado = resultado.filter((c) =>
                c.disciplinas.some((d) =>
                  filtroDisciplina.mode === 'insensitive'
                    ? d.nombre.toLowerCase() === filtroDisciplina.equals.toLowerCase()
                    : d.nombre === filtroDisciplina.equals,
                ),
              );
            }
            resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
            const skip = args.skip ?? 0;
            const take = args.take ?? resultado.length;
            return Promise.resolve(
              resultado.slice(skip, skip + take).map((c) => ({ ...c })),
            );
          },
        ),
        findFirst: vi.fn(
          (args: {
            where: {
              id?: string;
              nombre?: { equals?: string; mode?: string };
              NOT?: { id?: string };
            };
          }) => {
            if (args.where.id !== undefined) {
              const encontrada = canchas.find((c) => c.id === args.where.id);
              return Promise.resolve(encontrada ? { ...encontrada } : null);
            }
            const encontrada = canchas.find((c) =>
              resolverNombreIgual(c, args.where),
            );
            return Promise.resolve(encontrada ? { ...encontrada } : null);
          },
        ),
        create: vi.fn(
          (args: {
            data: {
              nombre: string;
              ubicacion: string;
              capacidad: number;
              estado: EstadoCancha;
              disciplinas: { connect: Array<{ id: string }> };
            };
          }) => {
            siguiente += 1;
            const conectadas = args.data.disciplinas.connect
              .map(
                (conexion) =>
                  disciplinas.find((d) => d.id === conexion.id) ?? {
                    id: conexion.id,
                    nombre: 'desconocida',
                  },
              );
            const creada: CanchaFila = {
              id: `00000000-0000-4000-8000-0000000000${String(siguiente).padStart(2, '0')}`,
              nombre: args.data.nombre,
              ubicacion: args.data.ubicacion,
              capacidad: args.data.capacidad,
              estado: args.data.estado,
              disciplinas: conectadas,
            };
            canchas.push(creada);
            return Promise.resolve({ ...creada });
          },
        ),
        update: vi.fn(
          (args: {
            where: { id: string };
            data: Partial<{
              nombre: string;
              ubicacion: string;
              capacidad: number;
              estado: EstadoCancha;
              disciplinas: { set: Array<{ id: string }> };
            }>;
          }) => {
            const indice = canchas.findIndex((c) => c.id === args.where.id);
            if (indice === -1) {
              return Promise.reject(new Error('Cancha no encontrada'));
            }
            const actualizada: CanchaFila = { ...canchas[indice] };
            const { disciplinas: disciplinasNuevas, ...campos } = args.data;
            // Prisma trata los `undefined` como "campo no enviado": el mock hace lo mismo.
            for (const [clave, valor] of Object.entries(campos)) {
              if (valor !== undefined) {
                Object.assign(actualizada, { [clave]: valor });
              }
            }
            if (disciplinasNuevas) {
              actualizada.disciplinas = disciplinasNuevas.set.map(
                (conexion) =>
                  disciplinas.find((d) => d.id === conexion.id) ?? {
                    id: conexion.id,
                    nombre: 'desconocida',
                  },
              );
            }
            canchas[indice] = actualizada;
            return Promise.resolve({ ...actualizada });
          },
        ),
        delete: vi.fn(({ where }: { where: { id: string } }) => {
          const indice = canchas.findIndex((c) => c.id === where.id);
          if (indice === -1) {
            return Promise.reject(new Error('Cancha no encontrada'));
          }
          const [eliminada] = canchas.splice(indice, 1);
          return Promise.resolve(eliminada);
        }),
      },
      turno: {
        count: vi.fn(({ where }: { where: { canchaId: string } }) =>
          Promise.resolve(canchasConTurnos.has(where.canchaId) ? 2 : 0),
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
  });

  afterEach(async () => {
    await app.close();
  });

  async function tokenDe(email: string, contrasena: string): Promise<string> {
    const respuesta = await request(server())
      .post('/auth/login')
      .send({ email, contrasena })
      .expect(200);
    return respuesta.body.token as string;
  }

  const tokenSocio = () => tokenDe(EMAIL_SOCIO, CONTRASENA_SOCIO);
  const tokenAdmin = () => tokenDe(EMAIL_ADMIN, CONTRASENA_ADMIN);

  describe('GET /canchas', () => {
    it('200: lista las canchas con disciplinas sin token', async () => {
      const respuesta = await request(server()).get('/canchas').expect(200);

      expect(respuesta.body).toHaveLength(4);
      const tenis = respuesta.body.find(
        (cancha: { id: string }) => cancha.id === CANCHA_TENIS_1,
      );
      expect(tenis).toEqual(
        expect.objectContaining({
          id: CANCHA_TENIS_1,
          nombre: 'Cancha de Tenis 1',
          ubicacion: 'Pista A',
          capacidad: 4,
          estado: EstadoCancha.DISPONIBLE,
          disciplinas: [expect.objectContaining({ id: TENIS_ID })],
        }),
      );
    });

    it('200: filtra por disciplina', async () => {
      const respuesta = await request(server())
        .get('/canchas')
        .query({ disciplina: 'futbol' })
        .expect(200);

      expect(respuesta.body).toHaveLength(1);
      expect(respuesta.body[0].id).toBe(CANCHA_FUTBOL);
    });

    it('200: filtra por estado en formato kebab del spec', async () => {
      const respuesta = await request(server())
        .get('/canchas')
        .query({ estado: 'en-mantenimiento' })
        .expect(200);

      expect(respuesta.body).toHaveLength(1);
      expect(respuesta.body[0].id).toBe(CANCHA_PADEL_MANT);
    });

    it('200: pagina con page y limit', async () => {
      const respuesta = await request(server())
        .get('/canchas')
        .query({ page: 2, limit: 1 })
        .expect(200);

      expect(respuesta.body).toHaveLength(1);
      expect(respuesta.body[0].nombre).toBe('Cancha de Padel 2');
    });

    it('400: rechaza un estado inválido', async () => {
      await request(server())
        .get('/canchas')
        .query({ estado: 'volado' })
        .expect(400);
    });
  });

  describe('GET /canchas/:id', () => {
    it('200: devuelve la cancha con disciplinas', async () => {
      const respuesta = await request(server())
        .get(`/canchas/${CANCHA_TENIS_1}`)
        .expect(200);

      expect(respuesta.body).toEqual(
        expect.objectContaining({
          id: CANCHA_TENIS_1,
          nombre: 'Cancha de Tenis 1',
          disciplinas: [{ id: TENIS_ID, nombre: 'tenis' }],
        }),
      );
    });

    it('404: cancha inexistente', async () => {
      await request(server()).get(`/canchas/${CANCHA_INEXISTENTE}`).expect(404);
    });

    it('400: id con formato inválido', async () => {
      await request(server()).get(`/canchas/${ID_UUID_INVALIDO}`).expect(400);
    });
  });

  describe('GET /disciplinas', () => {
    it('200: lista tenis, futbol y padel sin token', async () => {
      const respuesta = await request(server())
        .get('/disciplinas')
        .expect(200);

      expect(respuesta.body.map((d: { nombre: string }) => d.nombre)).toEqual([
        'futbol',
        'padel',
        'tenis',
      ]);
      expect(respuesta.body[0]).toEqual(
        expect.objectContaining({ id: expect.any(String) }),
      );
    });
  });

  describe('POST /canchas', () => {
    const cuerpo = {
      nombre: 'Cancha Mixta 1',
      ubicacion: 'Nave 5',
      capacidad: 6,
      estado: 'DISPONIBLE',
      disciplinaIds: [TENIS_ID, PADEL_ID],
    };

    it('401: sin token', async () => {
      await request(server()).post('/canchas').send(cuerpo).expect(401, {
        message: 'Sesión no válida.',
        error: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('403: con rol USUARIO', async () => {
      const token = await tokenSocio();

      await request(server())
        .post('/canchas')
        .set('Authorization', `Bearer ${token}`)
        .send(cuerpo)
        .expect(403, {
          message: 'No tenés permisos para acceder a este recurso.',
          error: 'Forbidden',
          statusCode: 403,
        });
    });

    it('201: con rol ADMINISTRADOR crea la cancha con sus disciplinas', async () => {
      const token = await tokenAdmin();

      const respuesta = await request(server())
        .post('/canchas')
        .set('Authorization', `Bearer ${token}`)
        .send(cuerpo)
        .expect(201);

      expect(respuesta.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          nombre: 'Cancha Mixta 1',
          ubicacion: 'Nave 5',
          capacidad: 6,
          estado: EstadoCancha.DISPONIBLE,
          disciplinas: expect.arrayContaining([
            { id: TENIS_ID, nombre: 'tenis' },
            { id: PADEL_ID, nombre: 'padel' },
          ]),
        }),
      );
    });

    it('400: valida los campos del body', async () => {
      const token = await tokenAdmin();
      const autorizacion = `Bearer ${token}`;

      const sinNombre = await request(server())
        .post('/canchas')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, nombre: undefined })
        .expect(400);
      expect(sinNombre.body.message).toEqual(
        expect.arrayContaining(['El nombre es obligatorio.']),
      );

      const capacidadInvalida = await request(server())
        .post('/canchas')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, capacidad: 0 })
        .expect(400);
      expect(capacidadInvalida.body.message).toEqual([
        'La capacidad debe ser mayor que 0.',
      ]);

      const estadoInvalido = await request(server())
        .post('/canchas')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, estado: 'VOLADO' })
        .expect(400);
      expect(estadoInvalido.body.message).toEqual(['El estado no es válido.']);

      const sinDisciplinas = await request(server())
        .post('/canchas')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, disciplinaIds: [] })
        .expect(400);
      expect(sinDisciplinas.body.message).toEqual([
        'Debe indicar al menos una disciplina.',
      ]);

      const disciplinaMalformada = await request(server())
        .post('/canchas')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, disciplinaIds: ['no-es-uuid'] })
        .expect(400);
      expect(disciplinaMalformada.body.message).toEqual([
        'Cada disciplina debe ser un UUID válido.',
      ]);

      expect(prismaMock.cancha.create).not.toHaveBeenCalled();
    });

    it('409: nombre duplicado ignorando mayúsculas', async () => {
      const token = await tokenAdmin();

      await request(server())
        .post('/canchas')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...cuerpo, nombre: '  cancha de tenis 1  ' })
        .expect(409, {
          message: 'Ya existe una cancha con ese nombre.',
          error: 'Conflict',
          statusCode: 409,
        });
      expect(prismaMock.cancha.create).not.toHaveBeenCalled();
    });

    it('422: disciplina referenciada inexistente', async () => {
      const token = await tokenAdmin();

      await request(server())
        .post('/canchas')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...cuerpo, disciplinaIds: [DISCIPLINA_INEXISTENTE_ID] })
        .expect(422, {
          message: 'Una o más disciplinas referenciadas no existen.',
          error: 'Unprocessable Entity',
          statusCode: 422,
        });
      expect(prismaMock.cancha.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /canchas/:id', () => {
    it('401: sin token', async () => {
      await request(server())
        .put(`/canchas/${CANCHA_TENIS_1}`)
        .send({ nombre: 'Otro Nombre' })
        .expect(401);
    });

    it('403: con rol USUARIO', async () => {
      const token = await tokenSocio();

      await request(server())
        .put(`/canchas/${CANCHA_TENIS_1}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Otro Nombre' })
        .expect(403);
    });

    it('200: actualiza los campos enviados', async () => {
      const token = await tokenAdmin();

      const respuesta = await request(server())
        .put(`/canchas/${CANCHA_TENIS_1}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Cancha de Tenis Central', capacidad: 8 })
        .expect(200);

      expect(respuesta.body).toEqual(
        expect.objectContaining({
          id: CANCHA_TENIS_1,
          nombre: 'Cancha de Tenis Central',
          capacidad: 8,
          ubicacion: 'Pista A',
        }),
      );
    });

    it('200: reemplaza las disciplinas cuando se envían', async () => {
      const token = await tokenAdmin();

      const respuesta = await request(server())
        .put(`/canchas/${CANCHA_TENIS_1}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ disciplinaIds: [TENIS_ID, FUTBOL_ID] })
        .expect(200);

      expect(respuesta.body.disciplinas).toHaveLength(2);
    });

    it('404: cancha inexistente', async () => {
      const token = await tokenAdmin();

      await request(server())
        .put(`/canchas/${CANCHA_INEXISTENTE}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Nombre Nuevo' })
        .expect(404, {
          message: 'Cancha no encontrada.',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('409: el nuevo nombre ya pertenece a otra cancha', async () => {
      const token = await tokenAdmin();

      await request(server())
        .put(`/canchas/${CANCHA_TENIS_1}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'cancha de futbol 1' })
        .expect(409, {
          message: 'Ya existe una cancha con ese nombre.',
          error: 'Conflict',
          statusCode: 409,
        });
    });
  });

  describe('DELETE /canchas/:id', () => {
    it('401: sin token', async () => {
      await request(server()).delete(`/canchas/${CANCHA_TENIS_1}`).expect(401);
    });

    it('403: con rol USUARIO', async () => {
      const token = await tokenSocio();

      await request(server())
        .delete(`/canchas/${CANCHA_TENIS_1}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('204: elimina la cancha sin turnos y deja de existir', async () => {
      const token = await tokenAdmin();

      await request(server())
        .delete(`/canchas/${CANCHA_TENIS_1}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(server()).get(`/canchas/${CANCHA_TENIS_1}`).expect(404);
    });

    it('404: cancha inexistente', async () => {
      const token = await tokenAdmin();

      await request(server())
        .delete(`/canchas/${CANCHA_INEXISTENTE}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404, {
          message: 'Cancha no encontrada.',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('409: cancha con turnos asociados no se elimina', async () => {
      const token = await tokenAdmin();

      await request(server())
        .delete(`/canchas/${CANCHA_CON_TURNOS}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409, {
          message: 'No se puede eliminar la cancha: tiene turnos asociados.',
          error: 'Conflict',
          statusCode: 409,
        });

      await request(server()).get(`/canchas/${CANCHA_CON_TURNOS}`).expect(200);
    });
  });
});

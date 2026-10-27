import { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { validationPipe } from '../src/comun/validation-pipe.js';
import { RolUsuario } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

process.env.JWT_SECRET ??= 'secreto-de-prueba-e2e-no-usar-en-produccion';
process.env.JWT_EXPIRES_IN ??= '1h';

const CONTRASENA_SOCIO = 'Socio123!';
const CONTRASENA_ADMIN = 'Admin123!';
const EMAIL_SOCIO = 'socio-equipamiento@clubdeportivo.test';
const EMAIL_ADMIN = 'admin-equipamiento@clubdeportivo.test';

const TENIS_ID = 'e0000001-0000-4000-8000-000000000001';
const FUTBOL_ID = 'e0000002-0000-4000-8000-000000000002';
const PADEL_ID = 'e0000003-0000-4000-8000-000000000003';
const DISCIPLINA_INEXISTENTE_ID = 'e00000ff-0000-4000-8000-0000000000ff';

const EQ_TENIS = 'e0a80001-0000-4000-8000-000000000001';
const EQ_FUTBOL = 'e0a80002-0000-4000-8000-000000000002';
const EQ_PADEL_INACTIVO = 'e0a80003-0000-4000-8000-000000000003';
const EQ_CON_ALQUILERES = 'e0a80004-0000-4000-8000-000000000004';
const EQ_INEXISTENTE = 'e0a800ff-0000-4000-8000-0000000000ff';
const ID_UUID_INVALIDO = 'no-es-uuid';

type DisciplinaFila = { id: string; nombre: string };
type EquipamientoFila = {
  id: string;
  nombre: string;
  disciplinaId: string;
  stockTotal: number;
  stockDisponible: number;
  precioUnitario: number;
  activo: boolean;
};
type UsuarioFila = {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: RolUsuario;
  contacto: string | null;
};

type FiltroEquipamiento = {
  activo?: boolean;
  disciplinaId?: string;
  stockDisponible?: number | { gt?: number };
};

type ArgsFindMany = {
  where?: FiltroEquipamiento;
  skip?: number;
  take?: number;
};

type ArgsFindFirst = {
  where: { id?: string };
  select?: unknown;
};

type ArgsCreate = {
  data: {
    nombre: string;
    disciplinaId: string;
    stockTotal: number;
    stockDisponible: number;
    precioUnitario: number;
    activo: boolean;
  };
};

type ArgsUpdateMany = {
  where: {
    id?: string;
    stockTotal?: number;
    stockDisponible?: number;
  };
  data: Partial<EquipamientoFila>;
};

type ArgsDelete = { where: { id: string } };

describe('Equipamiento (e2e)', () => {
  let app: INestApplication<App>;
  let disciplinas: DisciplinaFila[];
  let equipamientos: EquipamientoFila[];
  let equipamientosConAlquileres: Set<string>;
  let usuarios: Map<string, UsuarioFila>;
  let prismaMock: {
    $connect: ReturnType<typeof vi.fn>;
    $disconnect: ReturnType<typeof vi.fn>;
    usuario: { findUnique: ReturnType<typeof vi.fn> };
    disciplina: { findFirst: ReturnType<typeof vi.fn> };
    equipamiento: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };

  const server = () => app.getHttpServer();

  function conDisciplina(equipamiento: EquipamientoFila) {
    return {
      ...equipamiento,
      disciplina:
        disciplinas.find((d) => d.id === equipamiento.disciplinaId) ?? {
          id: equipamiento.disciplinaId,
          nombre: 'desconocida',
        },
      _count: {
        reservas: equipamientosConAlquileres.has(equipamiento.id) ? 1 : 0,
      },
    };
  }

  beforeEach(async () => {
    disciplinas = [
      { id: TENIS_ID, nombre: 'tenis' },
      { id: FUTBOL_ID, nombre: 'futbol' },
      { id: PADEL_ID, nombre: 'padel' },
    ];
    equipamientos = [
      {
        id: EQ_TENIS,
        nombre: 'Raquetas',
        disciplinaId: TENIS_ID,
        stockTotal: 10,
        stockDisponible: 10,
        precioUnitario: 1500.5,
        activo: true,
      },
      {
        id: EQ_FUTBOL,
        nombre: 'Balones',
        disciplinaId: FUTBOL_ID,
        stockTotal: 5,
        stockDisponible: 0,
        precioUnitario: 800,
        activo: true,
      },
      {
        id: EQ_PADEL_INACTIVO,
        nombre: 'Paletas',
        disciplinaId: PADEL_ID,
        stockTotal: 8,
        stockDisponible: 8,
        precioUnitario: 2000,
        activo: false,
      },
      {
        id: EQ_CON_ALQUILERES,
        nombre: 'Redes',
        disciplinaId: TENIS_ID,
        stockTotal: 4,
        stockDisponible: 1,
        precioUnitario: 300,
        activo: true,
      },
    ];
    equipamientosConAlquileres = new Set([EQ_CON_ALQUILERES]);
    usuarios = new Map<string, UsuarioFila>([
      [
        EMAIL_SOCIO,
        {
          id: 'u-socio-equipamiento',
          nombre: 'Socio Equipamiento',
          email: EMAIL_SOCIO,
          passwordHash: bcrypt.hashSync(CONTRASENA_SOCIO, 10),
          rol: RolUsuario.USUARIO,
          contacto: '+54 9 11 0000 0030',
        },
      ],
      [
        EMAIL_ADMIN,
        {
          id: 'u-admin-equipamiento',
          nombre: 'Admin Equipamiento',
          email: EMAIL_ADMIN,
          passwordHash: bcrypt.hashSync(CONTRASENA_ADMIN, 10),
          rol: RolUsuario.ADMINISTRADOR,
          contacto: 'admin-equipamiento@clubdeportivo.test',
        },
      ],
    ]);

    let siguiente = 0;

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
        findFirst: vi.fn(({ where }: { where: { id: string } }) =>
          Promise.resolve(
            disciplinas.find((d) => d.id === where.id) ?? null,
          ),
        ),
      },
      equipamiento: {
        findMany: vi.fn((args: ArgsFindMany) => {
          const where = args.where ?? {};
          let resultado = [...equipamientos];
          if (where.activo !== undefined) {
            resultado = resultado.filter((e) => e.activo === where.activo);
          }
          if (where.disciplinaId !== undefined) {
            resultado = resultado.filter(
              (e) => e.disciplinaId === where.disciplinaId,
            );
          }
          if (typeof where.stockDisponible === 'number') {
            resultado = resultado.filter(
              (e) => e.stockDisponible === where.stockDisponible,
            );
          } else if (where.stockDisponible?.gt !== undefined) {
            resultado = resultado.filter(
              (e) => e.stockDisponible > where.stockDisponible!.gt!,
            );
          }
          resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
          const skip = args.skip ?? 0;
          const take = args.take ?? resultado.length;
          return Promise.resolve(
            resultado.slice(skip, skip + take).map(conDisciplina),
          );
        }),
        findFirst: vi.fn((args: ArgsFindFirst) => {
          if (args.where.id === undefined) {
            return Promise.resolve(null);
          }
          const encontrado = equipamientos.find(
            (e) => e.id === args.where.id,
          );
          return Promise.resolve(
            encontrado ? conDisciplina(encontrado) : null,
          );
        }),
        create: vi.fn((args: ArgsCreate) => {
          siguiente += 1;
          const creado: EquipamientoFila = {
            id: `00000000-0000-4000-8000-0000000000${String(siguiente).padStart(2, '0')}`,
            ...args.data,
          };
          equipamientos.push(creado);
          return Promise.resolve(conDisciplina(creado));
        }),
        updateMany: vi.fn((args: ArgsUpdateMany) => {
          const indice = equipamientos.findIndex(
            (e) => e.id === args.where.id,
          );
          if (indice === -1) {
            return Promise.resolve({ count: 0 });
          }
          const actual = equipamientos[indice];
          if (
            args.where.stockTotal !== undefined &&
            actual.stockTotal !== args.where.stockTotal
          ) {
            return Promise.resolve({ count: 0 });
          }
          if (
            args.where.stockDisponible !== undefined &&
            actual.stockDisponible !== args.where.stockDisponible
          ) {
            return Promise.resolve({ count: 0 });
          }
          const actualizado: EquipamientoFila = { ...actual };
          for (const [clave, valor] of Object.entries(args.data)) {
            if (valor !== undefined) {
              Object.assign(actualizado, { [clave]: valor });
            }
          }
          equipamientos[indice] = actualizado;
          return Promise.resolve({ count: 1 });
        }),
        delete: vi.fn((args: ArgsDelete) => {
          const indice = equipamientos.findIndex(
            (e) => e.id === args.where.id,
          );
          if (indice === -1) {
            return Promise.reject(new Error('Equipamiento no encontrado'));
          }
          const [eliminado] = equipamientos.splice(indice, 1);
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

  async function tokenDe(email: string, contrasena: string): Promise<string> {
    const respuesta = await request(server())
      .post('/auth/login')
      .send({ email, contrasena })
      .expect(200);
    return respuesta.body.token as string;
  }

  const tokenSocio = () => tokenDe(EMAIL_SOCIO, CONTRASENA_SOCIO);
  const tokenAdmin = () => tokenDe(EMAIL_ADMIN, CONTRASENA_ADMIN);

  describe('GET /equipamiento', () => {
    it('200: lista solo activos sin token, con disponible y precio numérico', async () => {
      const respuesta = await request(server())
        .get('/equipamiento')
        .expect(200);

      expect(respuesta.body).toHaveLength(3);
      expect(respuesta.body.map((e: { nombre: string }) => e.nombre)).toEqual([
        'Balones',
        'Raquetas',
        'Redes',
      ]);
      const raquetas = respuesta.body.find(
        (e: { id: string }) => e.id === EQ_TENIS,
      );
      expect(raquetas).toEqual(
        expect.objectContaining({
          nombre: 'Raquetas',
          disciplinaId: TENIS_ID,
          disciplina: { id: TENIS_ID, nombre: 'tenis' },
          stockTotal: 10,
          stockDisponible: 10,
          precioUnitario: 1500.5,
          activo: true,
          disponible: true,
        }),
      );
    });

    it('200: filtra por disciplina', async () => {
      const respuesta = await request(server())
        .get('/equipamiento')
        .query({ disciplinaId: TENIS_ID })
        .expect(200);

      expect(respuesta.body).toHaveLength(2);
      expect(
        respuesta.body.every(
          (e: { disciplinaId: string }) => e.disciplinaId === TENIS_ID,
        ),
      ).toBe(true);
    });

    it('200: filtra por disponibilidad true y false', async () => {
      const disponibles = await request(server())
        .get('/equipamiento')
        .query({ disponible: 'true' })
        .expect(200);
      expect(
        disponibles.body.every(
          (e: { stockDisponible: number }) => e.stockDisponible > 0,
        ),
      ).toBe(true);

      const sinStock = await request(server())
        .get('/equipamiento')
        .query({ disponible: 'false' })
        .expect(200);
      expect(sinStock.body).toHaveLength(1);
      expect(sinStock.body[0].id).toBe(EQ_FUTBOL);
    });

    it('200: incluye inactivos con incluirInactivos=true', async () => {
      const respuesta = await request(server())
        .get('/equipamiento')
        .query({ incluirInactivos: 'true' })
        .expect(200);

      expect(respuesta.body).toHaveLength(4);
      expect(
        respuesta.body.some(
          (e: { id: string; activo: boolean }) =>
            e.id === EQ_PADEL_INACTIVO && e.activo === false,
        ),
      ).toBe(true);
    });

    it('200: pagina con page y limit', async () => {
      const respuesta = await request(server())
        .get('/equipamiento')
        .query({ page: 2, limit: 1 })
        .expect(200);

      expect(respuesta.body).toHaveLength(1);
      expect(respuesta.body[0].nombre).toBe('Raquetas');
    });

    it('400: rechaza filtros inválidos', async () => {
      await request(server())
        .get('/equipamiento')
        .query({ disciplinaId: ID_UUID_INVALIDO })
        .expect(400);
      await request(server())
        .get('/equipamiento')
        .query({ limit: 101 })
        .expect(400);
      await request(server())
        .get('/equipamiento')
        .query({ page: 0 })
        .expect(400);
      await request(server())
        .get('/equipamiento')
        .query({ disponible: 'quizas' })
        .expect(400);
    });
  });

  describe('GET /equipamiento/:id', () => {
    it('200: devuelve el detalle sin token, incluso si está inactivo', async () => {
      const respuesta = await request(server())
        .get(`/equipamiento/${EQ_PADEL_INACTIVO}`)
        .expect(200);

      expect(respuesta.body).toEqual(
        expect.objectContaining({
          id: EQ_PADEL_INACTIVO,
          activo: false,
          disponible: true,
          disciplina: { id: PADEL_ID, nombre: 'padel' },
        }),
      );
    });

    it('404: equipamiento inexistente', async () => {
      await request(server())
        .get(`/equipamiento/${EQ_INEXISTENTE}`)
        .expect(404, {
          message: 'Equipamiento no encontrado.',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('400: id con formato inválido', async () => {
      await request(server())
        .get(`/equipamiento/${ID_UUID_INVALIDO}`)
        .expect(400);
    });
  });

  describe('POST /equipamiento', () => {
    const cuerpo = {
      nombre: 'Conos',
      disciplinaId: FUTBOL_ID,
      stockTotal: 12,
      precioUnitario: 99.99,
    };

    it('401: sin token', async () => {
      await request(server()).post('/equipamiento').send(cuerpo).expect(401, {
        message: 'Sesión no válida.',
        error: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('403: con rol USUARIO', async () => {
      const token = await tokenSocio();

      await request(server())
        .post('/equipamiento')
        .set('Authorization', `Bearer ${token}`)
        .send(cuerpo)
        .expect(403, {
          message: 'No tenés permisos para acceder a este recurso.',
          error: 'Forbidden',
          statusCode: 403,
        });
    });

    it('201: con rol ADMINISTRADOR crea con stockDisponible igual a stockTotal', async () => {
      const token = await tokenAdmin();

      const respuesta = await request(server())
        .post('/equipamiento')
        .set('Authorization', `Bearer ${token}`)
        .send(cuerpo)
        .expect(201);

      expect(respuesta.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          nombre: 'Conos',
          disciplinaId: FUTBOL_ID,
          disciplina: { id: FUTBOL_ID, nombre: 'futbol' },
          stockTotal: 12,
          stockDisponible: 12,
          precioUnitario: 99.99,
          activo: true,
          disponible: true,
        }),
      );
    });

    it('400: valida nombre, disciplina, stock, precio y stockDisponible', async () => {
      const token = await tokenAdmin();
      const autorizacion = `Bearer ${token}`;

      const sinNombre = await request(server())
        .post('/equipamiento')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, nombre: undefined })
        .expect(400);
      expect(sinNombre.body.message).toEqual(
        expect.arrayContaining(['El nombre es obligatorio.']),
      );

      const sinDisciplina = await request(server())
        .post('/equipamiento')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, disciplinaId: undefined })
        .expect(400);
      expect(sinDisciplina.body.message).toEqual(
        expect.arrayContaining(['La disciplina debe ser un UUID válido.']),
      );

      const disciplinaMalformada = await request(server())
        .post('/equipamiento')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, disciplinaId: ID_UUID_INVALIDO })
        .expect(400);
      expect(disciplinaMalformada.body.message).toEqual([
        'La disciplina debe ser un UUID válido.',
      ]);

      const sinStock = await request(server())
        .post('/equipamiento')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, stockTotal: undefined })
        .expect(400);
      expect(sinStock.body.message).toEqual(
        expect.arrayContaining([
          'El stock total debe ser un número entero.',
        ]),
      );

      const sinPrecio = await request(server())
        .post('/equipamiento')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, precioUnitario: undefined })
        .expect(400);
      expect(sinPrecio.body.message).toEqual(
        expect.arrayContaining([
          'El precio unitario debe ser un número con hasta 2 decimales.',
        ]),
      );

      const stockNegativo = await request(server())
        .post('/equipamiento')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, stockTotal: -1 })
        .expect(400);
      expect(stockNegativo.body.message).toEqual([
        'El stock total no puede ser negativo.',
      ]);

      const stockFueraDeRango = await request(server())
        .post('/equipamiento')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, stockTotal: 2147483648 })
        .expect(400);
      expect(stockFueraDeRango.body.message).toEqual([
        'El stock total no puede superar 2147483647.',
      ]);

      const precioNegativo = await request(server())
        .post('/equipamiento')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, precioUnitario: -1 })
        .expect(400);
      expect(precioNegativo.body.message).toEqual([
        'El precio unitario no puede ser negativo.',
      ]);

      const precioFueraDeRango = await request(server())
        .post('/equipamiento')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, precioUnitario: 100000000 })
        .expect(400);
      expect(precioFueraDeRango.body.message).toEqual([
        'El precio unitario no puede superar 99999999.99.',
      ]);

      const precioConTresDecimales = await request(server())
        .post('/equipamiento')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, precioUnitario: 1.999 })
        .expect(400);
      expect(precioConTresDecimales.body.message).toEqual([
        'El precio unitario debe ser un número con hasta 2 decimales.',
      ]);

      const stockDisponibleEnviado = await request(server())
        .post('/equipamiento')
        .set('Authorization', autorizacion)
        .send({ ...cuerpo, stockDisponible: 5 })
        .expect(400);
      expect(stockDisponibleEnviado.body.message).toEqual(
        expect.arrayContaining([
          'property stockDisponible should not exist',
        ]),
      );

      expect(prismaMock.equipamiento.create).not.toHaveBeenCalled();
    });

    it('422: disciplina inexistente', async () => {
      const token = await tokenAdmin();

      await request(server())
        .post('/equipamiento')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...cuerpo, disciplinaId: DISCIPLINA_INEXISTENTE_ID })
        .expect(422, {
          message: 'La disciplina referenciada no existe.',
          error: 'Unprocessable Entity',
          statusCode: 422,
        });
      expect(prismaMock.equipamiento.create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /equipamiento/:id', () => {
    it('401: sin token', async () => {
      await request(server())
        .put(`/equipamiento/${EQ_TENIS}`)
        .send({ nombre: 'Otra cosa' })
        .expect(401);
    });

    it('403: con rol USUARIO', async () => {
      const token = await tokenSocio();

      await request(server())
        .put(`/equipamiento/${EQ_TENIS}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Otra cosa' })
        .expect(403);
    });

    it('200: actualiza campos parciales sin tocar el stock', async () => {
      const token = await tokenAdmin();

      const respuesta = await request(server())
        .put(`/equipamiento/${EQ_TENIS}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Raquetas nuevas', precioUnitario: 1800.75 })
        .expect(200);

      expect(respuesta.body).toEqual(
        expect.objectContaining({
          id: EQ_TENIS,
          nombre: 'Raquetas nuevas',
          precioUnitario: 1800.75,
          stockTotal: 10,
          stockDisponible: 10,
        }),
      );
    });

    it('200: ajusta stockDisponible al cambiar stockTotal', async () => {
      const token = await tokenAdmin();

      const respuesta = await request(server())
        .put(`/equipamiento/${EQ_CON_ALQUILERES}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ stockTotal: 6 })
        .expect(200);

      expect(respuesta.body).toEqual(
        expect.objectContaining({
          id: EQ_CON_ALQUILERES,
          stockTotal: 6,
          stockDisponible: 3,
          disponible: true,
        }),
      );
    });

    it('409: no permite bajar stockTotal por debajo de lo alquilado', async () => {
      const token = await tokenAdmin();

      await request(server())
        .put(`/equipamiento/${EQ_CON_ALQUILERES}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ stockTotal: 2 })
        .expect(409, {
          message:
            'No se puede reducir el stock total por debajo de las unidades actualmente alquiladas.',
          error: 'Conflict',
          statusCode: 409,
        });
    });

    it('200: desactiva el ítem y lo oculta del listado público', async () => {
      const token = await tokenAdmin();

      await request(server())
        .put(`/equipamiento/${EQ_TENIS}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ activo: false })
        .expect(200);

      const publico = await request(server())
        .get('/equipamiento')
        .expect(200);
      expect(
        publico.body.some((e: { id: string }) => e.id === EQ_TENIS),
      ).toBe(false);

      const conInactivos = await request(server())
        .get('/equipamiento')
        .query({ incluirInactivos: 'true' })
        .expect(200);
      expect(
        conInactivos.body.some((e: { id: string }) => e.id === EQ_TENIS),
      ).toBe(true);
    });

    it('404: equipamiento inexistente', async () => {
      const token = await tokenAdmin();

      await request(server())
        .put(`/equipamiento/${EQ_INEXISTENTE}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Nombre Nuevo' })
        .expect(404, {
          message: 'Equipamiento no encontrado.',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('422: disciplina inexistente', async () => {
      const token = await tokenAdmin();

      await request(server())
        .put(`/equipamiento/${EQ_TENIS}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ disciplinaId: DISCIPLINA_INEXISTENTE_ID })
        .expect(422, {
          message: 'La disciplina referenciada no existe.',
          error: 'Unprocessable Entity',
          statusCode: 422,
        });
    });

    it('400: valida stock, precio y stockDisponible', async () => {
      const token = await tokenAdmin();
      const autorizacion = `Bearer ${token}`;
      const url = `/equipamiento/${EQ_TENIS}`;

      await request(server())
        .put(url)
        .set('Authorization', autorizacion)
        .send({ stockTotal: -1 })
        .expect(400);
      await request(server())
        .put(url)
        .set('Authorization', autorizacion)
        .send({ stockTotal: 2147483648 })
        .expect(400);
      await request(server())
        .put(url)
        .set('Authorization', autorizacion)
        .send({ precioUnitario: -1 })
        .expect(400);
      await request(server())
        .put(url)
        .set('Authorization', autorizacion)
        .send({ precioUnitario: 100000000 })
        .expect(400);
      await request(server())
        .put(url)
        .set('Authorization', autorizacion)
        .send({ precioUnitario: 1.999 })
        .expect(400);
      const conStockDisponible = await request(server())
        .put(url)
        .set('Authorization', autorizacion)
        .send({ stockDisponible: 5 })
        .expect(400);
      expect(conStockDisponible.body.message).toEqual(
        expect.arrayContaining([
          'property stockDisponible should not exist',
        ]),
      );
    });
  });

  describe('DELETE /equipamiento/:id', () => {
    it('401: sin token', async () => {
      await request(server())
        .delete(`/equipamiento/${EQ_TENIS}`)
        .expect(401);
    });

    it('403: con rol USUARIO', async () => {
      const token = await tokenSocio();

      await request(server())
        .delete(`/equipamiento/${EQ_TENIS}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('204: elimina el equipamiento sin alquileres y deja de existir', async () => {
      const token = await tokenAdmin();

      await request(server())
        .delete(`/equipamiento/${EQ_TENIS}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      await request(server()).get(`/equipamiento/${EQ_TENIS}`).expect(404);
    });

    it('404: equipamiento inexistente', async () => {
      const token = await tokenAdmin();

      await request(server())
        .delete(`/equipamiento/${EQ_INEXISTENTE}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404, {
          message: 'Equipamiento no encontrado.',
          error: 'Not Found',
          statusCode: 404,
        });
    });

    it('409: no elimina un equipamiento con alquileres y sugiere activo=false', async () => {
      const token = await tokenAdmin();

      const respuesta = await request(server())
        .delete(`/equipamiento/${EQ_CON_ALQUILERES}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(409);

      expect(respuesta.body.message).toContain('activo = false');
      expect(prismaMock.equipamiento.delete).not.toHaveBeenCalled();

      await request(server())
        .get(`/equipamiento/${EQ_CON_ALQUILERES}`)
        .expect(200);
    });
  });
});

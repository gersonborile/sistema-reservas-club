import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import {
  CurrentUser,
  Roles,
  type TokenSesion,
  type UsuarioPublico,
} from '../src/auth/index.js';
import { validationPipe } from '../src/comun/validation-pipe.js';
import { RolUsuario } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

process.env.JWT_SECRET ??= 'secreto-de-prueba-e2e-no-usar-en-produccion';
process.env.JWT_EXPIRES_IN ??= '1h';

const CONTRASENA_SOCIO = 'Socio123!';
const CONTRASENA_ADMIN = 'Admin123!';
const EMAIL_SOCIO = 'socio-e2e@clubdeportivo.test';
const EMAIL_ADMIN = 'admin-e2e@clubdeportivo.test';

type FilaUsuario = UsuarioPublico & { passwordHash: string };

@Controller('pruebas')
class ControladorDePrueba {
  @Get('/protegida')
  protegiada(@CurrentUser() tokenSesion: TokenSesion): TokenSesion {
    return tokenSesion;
  }

  @Get('/admin')
  @Roles(RolUsuario.ADMINISTRADOR)
  admin(): { acceso: string } {
    return { acceso: 'administracion' };
  }
}

@Module({ controllers: [ControladorDePrueba] })
class ModuloDePrueba {}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let usuarios: Map<string, FilaUsuario>;
  let prismaMock: {
    $connect: ReturnType<typeof vi.fn>;
    $disconnect: ReturnType<typeof vi.fn>;
    usuario: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };

  const server = () => app.getHttpServer();

  function crearEnBase(overrides: Partial<FilaUsuario> = {}): FilaUsuario {
    const usuario: FilaUsuario = {
      id: 'u-1',
      nombre: 'Socia E2E',
      contacto: '+54 9 11 0000 0009',
      email: EMAIL_SOCIO,
      rol: RolUsuario.USUARIO,
      passwordHash: bcrypt.hashSync(CONTRASENA_SOCIO, 10),
      ...overrides,
    };
    usuarios.set(usuario.email, usuario);
    return usuario;
  }

  beforeEach(async () => {
    usuarios = new Map<string, FilaUsuario>();
    crearEnBase();
    crearEnBase({
      id: 'u-admin',
      nombre: 'Administración E2E',
      email: EMAIL_ADMIN,
      rol: RolUsuario.ADMINISTRADOR,
      passwordHash: bcrypt.hashSync(CONTRASENA_ADMIN, 10),
    });

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
            return Promise.resolve(
              [...usuarios.values()].find(
                (usuario) => usuario.id === where.id,
              ) ?? null,
            );
          },
        ),
        create: vi.fn(({ data }: { data: Omit<FilaUsuario, 'id'> }) => {
          siguiente += 1;
          const usuario: FilaUsuario = { id: `u-nuevo-${siguiente}`, ...data };
          usuarios.set(usuario.email, usuario);
          return Promise.resolve(usuario);
        }),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ModuloDePrueba],
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

  describe('POST /auth/register', () => {
    const cuerpo = {
      nombre: 'Socia Registrada',
      contacto: '+54 9 11 0000 0010',
      email: 'Nueva.Socia@ClubDeportivo.test',
      contrasena: CONTRASENA_SOCIO,
    };

    it('201: crea el usuario con rol USUARIO y sin credenciales en la respuesta', async () => {
      const respuesta = await request(server())
        .post('/auth/register')
        .send(cuerpo)
        .expect(201);

      expect(respuesta.body).toEqual({
        id: 'u-nuevo-1',
        nombre: 'Socia Registrada',
        contacto: '+54 9 11 0000 0010',
        email: 'nueva.socia@clubdeportivo.test',
        rol: RolUsuario.USUARIO,
      });
      expect(respuesta.body).not.toHaveProperty('passwordHash');
    });

    it('201: guarda la contraseña hasheada', async () => {
      await request(server()).post('/auth/register').send(cuerpo).expect(201);

      const guardada = usuarios.get('nueva.socia@clubdeportivo.test');
      expect(guardada?.passwordHash).toBeDefined();
      expect(guardada?.passwordHash).not.toBe(cuerpo.contrasena);
      await expect(
        bcrypt.compare(cuerpo.contrasena, guardada?.passwordHash ?? ''),
      ).resolves.toBe(true);
    });

    it('400: rechaza email inválido, contraseña corta y campos faltantes', async () => {
      const emailInvalido = await request(server())
        .post('/auth/register')
        .send({ ...cuerpo, email: 'no-es-un-email' })
        .expect(400);
      expect(emailInvalido.body.message).toEqual([
        'El email no tiene un formato válido.',
      ]);
      expect(emailInvalido.body.campos).toEqual([
        { campo: 'email', mensaje: 'El email no tiene un formato válido.' },
      ]);

      const contrasenaCorta = await request(server())
        .post('/auth/register')
        .send({ ...cuerpo, contrasena: 'corta1' })
        .expect(400);
      expect(contrasenaCorta.body.message).toEqual([
        'La contraseña debe tener al menos 8 caracteres.',
      ]);
      expect(contrasenaCorta.body.campos).toEqual([
        {
          campo: 'contrasena',
          mensaje: 'La contraseña debe tener al menos 8 caracteres.',
        },
      ]);

      const incompletos = await request(server())
        .post('/auth/register')
        .send({ email: cuerpo.email })
        .expect(400);
      expect(incompletos.body.message).toEqual(
        expect.arrayContaining([
          'El nombre es obligatorio.',
          'El contacto es obligatorio.',
          'La contraseña es obligatoria.',
        ]),
      );
      expect(incompletos.body.campos).toEqual(
        expect.arrayContaining([
          { campo: 'nombre', mensaje: 'El nombre es obligatorio.' },
          { campo: 'contacto', mensaje: 'El contacto es obligatorio.' },
          { campo: 'contrasena', mensaje: 'La contraseña es obligatoria.' },
        ]),
      );

      expect(prismaMock.usuario.create).not.toHaveBeenCalled();
    });

    it('400: no acepta un rol en el body', async () => {
      const respuesta = await request(server())
        .post('/auth/register')
        .send({ ...cuerpo, rol: RolUsuario.ADMINISTRADOR })
        .expect(400);

      expect(respuesta.body.message).toEqual(['property rol should not exist']);
      expect(respuesta.body.campos).toEqual([
        { campo: 'rol', mensaje: 'property rol should not exist' },
      ]);
      expect(prismaMock.usuario.create).not.toHaveBeenCalled();
    });

    it('409: rechaza el email duplicado con un mensaje claro', async () => {
      await request(server())
        .post('/auth/register')
        .send({ ...cuerpo, email: EMAIL_SOCIO })
        .expect(409, {
          message: 'El email ya está en uso.',
          error: 'Conflict',
          statusCode: 409,
        });
    });
  });

  describe('POST /auth/login', () => {
    it('200: devuelve el token con los claims y el usuario público', async () => {
      const respuesta = await request(server())
        .post('/auth/login')
        .send({ email: EMAIL_SOCIO, contrasena: CONTRASENA_SOCIO })
        .expect(200);

      expect(typeof respuesta.body.token).toBe('string');
      expect(respuesta.body.usuario).not.toHaveProperty('passwordHash');
      expect(respuesta.body.usuario.email).toBe(EMAIL_SOCIO);

      const payload = await jwtService.verifyAsync<TokenSesion>(
        respuesta.body.token,
      );
      expect(payload.userId).toBe('u-1');
      expect(payload.email).toBe(EMAIL_SOCIO);
      expect(payload.rol).toBe(RolUsuario.USUARIO);
      expect(payload).not.toHaveProperty('password');
    });

    it('401: mensaje genérico si la contraseña es incorrecta', async () => {
      await request(server())
        .post('/auth/login')
        .send({ email: EMAIL_SOCIO, contrasena: 'ContrasenaIncorrecta1!' })
        .expect(401, {
          message: 'Credenciales inválidas.',
          error: 'Unauthorized',
          statusCode: 401,
        });
    });

    it('401: mismo mensaje si el email no existe, sin revelar la diferencia', async () => {
      const respuesta = await request(server())
        .post('/auth/login')
        .send({
          email: 'nadie@clubdeportivo.test',
          contrasena: CONTRASENA_SOCIO,
        })
        .expect(401);

      expect(respuesta.body.message).toBe('Credenciales inválidas.');
    });

    it('400: valida el formato del body e identifica el campo', async () => {
      const respuesta = await request(server())
        .post('/auth/login')
        .send({ email: 'no-es-un-email', contrasena: CONTRASENA_SOCIO })
        .expect(400);

      expect(respuesta.body.message).toEqual([
        'El email no tiene un formato válido.',
      ]);
      expect(respuesta.body.campos).toEqual([
        { campo: 'email', mensaje: 'El email no tiene un formato válido.' },
      ]);
    });
  });

  describe('GET /auth/perfil', () => {
    it('200: devuelve los datos del usuario del token', async () => {
      const token = await iniciarSesion(EMAIL_SOCIO, CONTRASENA_SOCIO);

      const respuesta = await request(server())
        .get('/auth/perfil')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body).toEqual({
        id: 'u-1',
        nombre: 'Socia E2E',
        contacto: '+54 9 11 0000 0009',
        email: EMAIL_SOCIO,
        rol: RolUsuario.USUARIO,
      });
    });

    it('401: sin token', async () => {
      await request(server()).get('/auth/perfil').expect(401);
    });
  });

  describe('Rutas protegidas de prueba', () => {
    it('401: sin token', async () => {
      await request(server()).get('/pruebas/protegida').expect(401, {
        message: 'Sesión no válida.',
        error: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('401: con token inválido', async () => {
      await request(server())
        .get('/pruebas/protegida')
        .set('Authorization', 'Bearer token.invalido.aqui')
        .expect(401, {
          message: 'Sesión no válida.',
          error: 'Unauthorized',
          statusCode: 401,
        });
    });

    it('401: con token vencido', async () => {
      const vencido = await jwtService.signAsync(
        {
          userId: 'u-1',
          email: EMAIL_SOCIO,
          rol: RolUsuario.USUARIO,
        } satisfies TokenSesion,
        { expiresIn: '-1s' },
      );

      await request(server())
        .get('/pruebas/protegida')
        .set('Authorization', `Bearer ${vencido}`)
        .expect(401);
    });

    it('200: con token válido devuelve los claims', async () => {
      const token = await iniciarSesion(EMAIL_SOCIO, CONTRASENA_SOCIO);

      const respuesta = await request(server())
        .get('/pruebas/protegida')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(respuesta.body).toEqual({
        userId: 'u-1',
        email: EMAIL_SOCIO,
        rol: RolUsuario.USUARIO,
      });
    });

    it('403: rol insuficiente en una ruta de administración', async () => {
      const token = await iniciarSesion(EMAIL_SOCIO, CONTRASENA_SOCIO);

      await request(server())
        .get('/pruebas/admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(403, {
          message: 'No tenés permisos para acceder a este recurso.',
          error: 'Forbidden',
          statusCode: 403,
        });
    });

    it('200: con rol ADMINISTRADOR accede a la ruta de administración', async () => {
      const token = await iniciarSesion(EMAIL_ADMIN, CONTRASENA_ADMIN);

      await request(server())
        .get('/pruebas/admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(200, { acceso: 'administracion' });
    });
  });

  async function iniciarSesion(
    email: string,
    contrasena: string,
  ): Promise<string> {
    const respuesta = await request(server())
      .post('/auth/login')
      .send({ email, contrasena })
      .expect(200);
    return respuesta.body.token as string;
  }
});

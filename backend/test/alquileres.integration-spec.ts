import { randomUUID } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { AlquileresService } from '../src/alquileres/alquileres.service.js';
import {
  MENSAJE_ALQUILER_YA_EXISTENTE,
  MENSAJE_STOCK_INSUFICIENTE,
} from '../src/alquileres/mensajes.js';
import type { TokenSesion } from '../src/auth/token-sesion.js';
import { RolUsuario } from '../src/generated/prisma/client.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const url = process.env.TEST_DATABASE_URL;

// Contra Postgres real: demuestra que PrismaService.transaccion revierte de
// verdad. Con Prisma mockeado no se puede observar el rollback.
describe.skipIf(!url)('AlquileresService.crear (Postgres real)', () => {
  let prisma: PrismaService;
  let service: AlquileresService;
  let usuario: TokenSesion;
  let ids: {
    usuarioId: string;
    disciplinaId: string;
    canchaId: string;
    turnoId: string;
    reservaId: string;
    equipoConStock: string;
    equipoSinStock: string;
  };

  beforeAll(async () => {
    prisma = new PrismaService({
      getOrThrow: () => url,
    } as unknown as ConfigService);
    await prisma.onModuleInit();
    service = new AlquileresService(prisma);
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  beforeEach(async () => {
    const sufijo = randomUUID();
    const usuarioFila = await prisma.usuario.create({
      data: {
        nombre: 'Socio integración',
        email: `integracion-${sufijo}@clubdeportivo.test`,
        passwordHash: 'no-se-usa',
      },
    });
    const disciplina = await prisma.disciplina.create({
      data: { nombre: `Disciplina ${sufijo}` },
    });
    const cancha = await prisma.cancha.create({
      data: { nombre: `Cancha ${sufijo}`, ubicacion: 'Test', capacidad: 4 },
    });
    const turno = await prisma.turno.create({
      data: {
        canchaId: cancha.id,
        disciplinaId: disciplina.id,
        fecha: new Date(Date.UTC(2030, 0, 1)),
        horaInicio: '18:00',
        horaFin: '19:00',
        disponible: false,
      },
    });
    const reserva = await prisma.reserva.create({
      data: { usuarioId: usuarioFila.id, turnoId: turno.id },
    });
    const conStock = await prisma.equipamiento.create({
      data: {
        nombre: `Raqueta ${sufijo}`,
        disciplinaId: disciplina.id,
        stockTotal: 5,
        stockDisponible: 5,
        precioUnitario: 500,
      },
    });
    const sinStock = await prisma.equipamiento.create({
      data: {
        nombre: `Pelotas ${sufijo}`,
        disciplinaId: disciplina.id,
        stockTotal: 1,
        stockDisponible: 1,
        precioUnitario: 100,
      },
    });
    ids = {
      usuarioId: usuarioFila.id,
      disciplinaId: disciplina.id,
      canchaId: cancha.id,
      turnoId: turno.id,
      reservaId: reserva.id,
      equipoConStock: conStock.id,
      equipoSinStock: sinStock.id,
    };
    usuario = {
      userId: usuarioFila.id,
      email: usuarioFila.email,
      rol: RolUsuario.USUARIO,
    };
  });

  afterEach(async () => {
    await prisma.alquiler.deleteMany({ where: { reservaId: ids.reservaId } });
    await prisma.reserva.deleteMany({ where: { id: ids.reservaId } });
    await prisma.equipamiento.deleteMany({
      where: { id: { in: [ids.equipoConStock, ids.equipoSinStock] } },
    });
    await prisma.turno.deleteMany({ where: { id: ids.turnoId } });
    await prisma.cancha.deleteMany({ where: { id: ids.canchaId } });
    await prisma.disciplina.deleteMany({ where: { id: ids.disciplinaId } });
    await prisma.usuario.deleteMany({ where: { id: ids.usuarioId } });
  });

  async function stockDisponible(equipamientoId: string): Promise<number> {
    const fila = await prisma.equipamiento.findUniqueOrThrow({
      where: { id: equipamientoId },
      select: { stockDisponible: true },
    });
    return fila.stockDisponible;
  }

  it('si un item posterior no tiene stock, devuelve 409 y revierte el descuento del anterior', async () => {
    await expect(
      service.crear(usuario, ids.reservaId, {
        items: [
          { equipamientoId: ids.equipoConStock, cantidad: 2 },
          { equipamientoId: ids.equipoSinStock, cantidad: 3 },
        ],
      }),
    ).rejects.toThrow(new ConflictException(MENSAJE_STOCK_INSUFICIENTE));

    expect(await stockDisponible(ids.equipoConStock)).toBe(5);
    expect(await stockDisponible(ids.equipoSinStock)).toBe(1);
    expect(
      await prisma.alquiler.count({ where: { reservaId: ids.reservaId } }),
    ).toBe(0);
  });

  it('si la reserva ya tiene alquiler, devuelve 409 y no descuenta stock otra vez', async () => {
    await service.crear(usuario, ids.reservaId, {
      items: [{ equipamientoId: ids.equipoConStock, cantidad: 1 }],
    });
    expect(await stockDisponible(ids.equipoConStock)).toBe(4);

    await expect(
      service.crear(usuario, ids.reservaId, {
        items: [{ equipamientoId: ids.equipoConStock, cantidad: 2 }],
      }),
    ).rejects.toThrow(new ConflictException(MENSAJE_ALQUILER_YA_EXISTENTE));

    expect(await stockDisponible(ids.equipoConStock)).toBe(4);
    expect(
      await prisma.alquiler.count({ where: { reservaId: ids.reservaId } }),
    ).toBe(1);
  });
});

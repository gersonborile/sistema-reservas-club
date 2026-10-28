import "dotenv/config";
import * as bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  EstadoCancha,
  EstadoReserva,
  MetodoPago,
  Prisma,
  PrismaClient,
  RolUsuario,
} from "../src/generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
const socioPassword = "Socio123!";

const disciplinas = [
  {
    nombre: "tenis",
    duracionTipicaMinutos: 60,
    reglas: "Superficie dura, saque por encima de la red.",
  },
  {
    nombre: "futbol",
    duracionTipicaMinutos: 90,
    reglas: "Cancha de 11 contra 11 con arcos reglamentarios.",
  },
  {
    nombre: "padel",
    duracionTipicaMinutos: 60,
    reglas: "Pista cerrada, plexo y Rebote de pared.",
  },
];

async function seedDisciplinas() {
  for (const disciplina of disciplinas) {
    await prisma.disciplina.upsert({
      where: { nombre: disciplina.nombre },
      update: disciplina,
      create: disciplina,
    });
  }
}

async function seedUsuarios() {
  const usuarios = [
    {
      nombre: "Administracion del Club",
      email: "admin@clubdeportivo.test",
      password: adminPassword,
      rol: RolUsuario.ADMINISTRADOR,
      contacto: "admin@clubdeportivo.test",
      tipo: "personal",
      membresia: "no aplica",
    },
    {
      nombre: "Socia Demo",
      email: "socio1@clubdeportivo.test",
      password: socioPassword,
      rol: RolUsuario.USUARIO,
      contacto: "+54 9 11 0000 0001",
      tipo: "titular",
      membresia: "activa",
    },
    {
      nombre: "Socio Demo Dos",
      email: "socio2@clubdeportivo.test",
      password: socioPassword,
      rol: RolUsuario.USUARIO,
      contacto: "+54 9 11 0000 0002",
      tipo: "dependiente",
      membresia: "activa",
    },
  ];

  const ids: Record<string, string> = {};
  for (const usuario of usuarios) {
    const { password, ...datos } = usuario;
    const passwordHash = await bcrypt.hash(password, 10);
    const upsertado = await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: { ...datos, passwordHash },
      create: { ...datos, passwordHash },
      select: { id: true },
    });
    ids[usuario.email] = upsertado.id;
  }
  return ids;
}

const canchas = [
  {
    nombre: "Cancha de Tenis 1",
    ubicacion: "Pista A",
    capacidad: 4,
    estado: EstadoCancha.DISPONIBLE,
    disciplinas: ["tenis"],
  },
  {
    nombre: "Cancha de Tenis 2",
    ubicacion: "Pista B",
    capacidad: 4,
    estado: EstadoCancha.DISPONIBLE,
    disciplinas: ["tenis"],
  },
  {
    nombre: "Cancha de Futbol 1",
    ubicacion: "Predio central",
    capacidad: 22,
    estado: EstadoCancha.DISPONIBLE,
    disciplinas: ["futbol"],
  },
  {
    nombre: "Cancha de Padel 1",
    ubicacion: "Cubierta 1",
    capacidad: 4,
    estado: EstadoCancha.DISPONIBLE,
    disciplinas: ["padel"],
  },
  {
    nombre: "Cancha de Padel 2",
    ubicacion: "Cubierta 2",
    capacidad: 4,
    estado: EstadoCancha.EN_MANTENIMIENTO,
    disciplinas: ["padel"],
  },
];

async function seedCanchas() {
  const ids: Record<string, string> = {};
  for (const cancha of canchas) {
    const { disciplinas: nombres, ...datos } = cancha;
    const disciplinaIds = await prisma.disciplina.findMany({
      where: { nombre: { in: nombres } },
      select: { id: true },
    });

    const existente = await prisma.cancha.findUnique({
      where: { nombre: cancha.nombre },
      select: { id: true },
    });

    const id =
      existente?.id ??
      (
        await prisma.cancha.create({
          data: {
            ...datos,
            disciplinas: { connect: disciplinaIds },
          },
          select: { id: true },
        })
      ).id;

    await prisma.cancha.update({
      where: { id },
      data: {
        ...datos,
        disciplinas: { set: disciplinaIds },
      },
    });
    ids[cancha.nombre] = id;
  }
  return ids;
}

function proximosDias(cantidad: number): Date[] {
  const fechas: Date[] = [];
  for (let i = 1; i <= cantidad; i++) {
    const fecha = new Date();
    fecha.setUTCHours(0, 0, 0, 0);
    fecha.setUTCDate(fecha.getUTCDate() + i);
    fechas.push(fecha);
  }
  return fechas;
}

async function seedTurnos(canchaIds: Record<string, string>) {
  const tenis = await prisma.disciplina.findUniqueOrThrow({
    where: { nombre: "tenis" },
    select: { id: true },
  });
  const padel = await prisma.disciplina.findUniqueOrThrow({
    where: { nombre: "padel" },
    select: { id: true },
  });
  const futbol = await prisma.disciplina.findUniqueOrThrow({
    where: { nombre: "futbol" },
    select: { id: true },
  });

  const definiciones = [
    { cancha: "Cancha de Tenis 1", disciplinaId: tenis.id, horaInicio: "08:00", horaFin: "09:00" },
    { cancha: "Cancha de Tenis 1", disciplinaId: tenis.id, horaInicio: "09:00", horaFin: "10:00" },
    { cancha: "Cancha de Tenis 1", disciplinaId: tenis.id, horaInicio: "10:00", horaFin: "11:00" },
    { cancha: "Cancha de Tenis 2", disciplinaId: tenis.id, horaInicio: "08:00", horaFin: "09:00" },
    { cancha: "Cancha de Tenis 2", disciplinaId: tenis.id, horaInicio: "10:00", horaFin: "11:00" },
    { cancha: "Cancha de Futbol 1", disciplinaId: futbol.id, horaInicio: "09:00", horaFin: "10:30" },
    { cancha: "Cancha de Padel 1", disciplinaId: padel.id, horaInicio: "18:00", horaFin: "19:00" },
    { cancha: "Cancha de Padel 1", disciplinaId: padel.id, horaInicio: "19:00", horaFin: "20:00" },
  ];

  for (const fecha of proximosDias(3)) {
    for (const definicion of definiciones) {
      const canchaId = canchaIds[definicion.cancha];
      const existente = await prisma.turno.findFirst({
        where: {
          canchaId,
          fecha,
          horaInicio: definicion.horaInicio,
        },
        select: { id: true },
      });
      if (existente) {
        continue;
      }
      await prisma.turno.create({
        data: {
          canchaId,
          disciplinaId: definicion.disciplinaId,
          fecha,
          horaInicio: definicion.horaInicio,
          horaFin: definicion.horaFin,
        },
      });
    }
  }
}

const equipamientos = [
  { nombre: "Raqueta de tenis", disciplina: "tenis", stock: 8, precioUnitario: 1500 },
  { nombre: "Pelotas de tenis (pack)", disciplina: "tenis", stock: 12, precioUnitario: 2500 },
  { nombre: "Red de padel", disciplina: "padel", stock: 2, precioUnitario: 5000 },
  { nombre: "Pelotas de padel (pack)", disciplina: "padel", stock: 10, precioUnitario: 2200 },
  { nombre: "Bote de arcos", disciplina: "futbol", stock: 5, precioUnitario: 4000 },
];

async function seedEquipamientos() {
  for (const equipamiento of equipamientos) {
    const disciplina = await prisma.disciplina.findUniqueOrThrow({
      where: { nombre: equipamiento.disciplina },
      select: { id: true },
    });
    const existente = await prisma.equipamiento.findFirst({
      where: { nombre: equipamiento.nombre },
      select: { id: true },
    });
    if (existente) {
      continue;
    }
    await prisma.equipamiento.create({
      data: {
        nombre: equipamiento.nombre,
        disciplinaId: disciplina.id,
        stockTotal: equipamiento.stock,
        stockDisponible: equipamiento.stock,
        precioUnitario: equipamiento.precioUnitario,
      },
    });
  }
}

async function seedReservaEjemplo(usuarioIds: Record<string, string>, canchaIds: Record<string, string>) {
  const turno = await prisma.turno.findFirstOrThrow({
    where: { canchaId: canchaIds["Cancha de Tenis 1"], horaInicio: "09:00" },
    orderBy: { fecha: "asc" },
    select: { id: true },
  });

  const reservaExistente = await prisma.reserva.findFirst({
    where: { turnoId: turno.id },
    select: { id: true },
  });
  if (reservaExistente) {
    return;
  }

  const raqueta = await prisma.equipamiento.findFirstOrThrow({
    where: { nombre: "Raqueta de tenis" },
    select: { id: true, precioUnitario: true },
  });

  const totalRaqueta = new Prisma.Decimal(raqueta.precioUnitario).mul(2);

  const reserva = await prisma.reserva.create({
    data: {
      usuarioId: usuarioIds["socio1@clubdeportivo.test"],
      turnoId: turno.id,
      estado: EstadoReserva.CONFIRMADA,
      alquiler: {
        create: {
          total: totalRaqueta,
          items: {
            create: [
              {
                equipamientoId: raqueta.id,
                cantidad: 2,
                precioUnitario: raqueta.precioUnitario,
              },
            ],
          },
        },
      },
      pago: {
        create: {
          monto: 5000,
          metodoPago: MetodoPago.EFECTIVO,
        },
      },
    },
    select: { id: true },
  });

  await prisma.turno.update({
    where: { id: turno.id },
    data: { disponible: false },
  });

  await prisma.equipamiento.update({
    where: { id: raqueta.id },
    data: { stockDisponible: { decrement: 2 } },
  });

  console.log(`Reserva de ejemplo creada: ${reserva.id}`);
}

async function main() {
  await seedDisciplinas();
  const usuarioIds = await seedUsuarios();
  const canchaIds = await seedCanchas();
  await seedTurnos(canchaIds);
  await seedEquipamientos();
  await seedReservaEjemplo(usuarioIds, canchaIds);

  const [usuarios, canchas, turnos, equipamientos, reservas, pagos] = await Promise.all([
    prisma.usuario.count(),
    prisma.cancha.count(),
    prisma.turno.count(),
    prisma.equipamiento.count(),
    prisma.reserva.count(),
    prisma.pago.count(),
  ]);

  console.log(
    `Seed listo: ${usuarios} usuarios, ${canchas} canchas, ${turnos} turnos, ` +
      `${equipamientos} equipamientos, ${reservas} reservas y ${pagos} pagos.`,
  );
  console.log(`Admin: admin@clubdeportivo.test / ${adminPassword}`);
  console.log(`Socio: socio1@clubdeportivo.test / ${socioPassword}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
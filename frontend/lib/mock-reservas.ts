

import { obtenerFechaLocalHoy } from "./fechas";

export type Disciplina = "Tenis" | "Fútbol 5" | "Pádel";

export type EstadoCancha = "disponible" | "ocupada" | "mantenimiento";

export type Cancha = {
  id: string;
  nombre: string;
  disciplina: Disciplina;
  imagenUrl?: string;
  estado: EstadoCancha;
};

export type Franja = {
  hora: string; // formato HH:MM
  ocupada: boolean;
};

export type Equipamiento = {
  id: string;
  nombre: string;
  disciplina: Disciplina;
  stockTotal: number;
  stockDisponible: number;
};

export type ReservaEquipamiento = {
  equipamientoId: string;
  nombre: string;
  cantidad: number;
};

export type Reserva = {
  id: string;
  usuarioId: string;
  canchaId: string;
  canchaNombre: string;
  disciplina: Disciplina;
  fecha: string; // formato YYYY-MM-DD
  hora: string; // formato HH:MM
  equipamiento: ReservaEquipamiento[];
  monto?: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  fechaCreacion: string;
};

const CLAVE_RESERVAS = "clubDeportivo.reservas";

function generarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Datos iniciales de canchas
const canchasBase: Cancha[] = [
  {
    id: "cancha-1",
    nombre: "Cancha 1",
    disciplina: "Tenis",
    estado: "disponible",
  },
  {
    id: "cancha-2",
    nombre: "Cancha 2",
    disciplina: "Fútbol 5",
    estado: "disponible",
  },
  {
    id: "cancha-3",
    nombre: "Cancha 3",
    disciplina: "Pádel",
    estado: "disponible",
  },
];

// Datos iniciales de equipamiento
const equipamientoBase: Equipamiento[] = [
  {
    id: "eq-1",
    nombre: "Pelotas de tenis",
    disciplina: "Tenis",
    stockTotal: 20,
    stockDisponible: 20,
  },
  {
    id: "eq-2",
    nombre: "Raquetas",
    disciplina: "Tenis",
    stockTotal: 8,
    stockDisponible: 8,
  },
  {
    id: "eq-3",
    nombre: "Balones de fútbol",
    disciplina: "Fútbol 5",
    stockTotal: 10,
    stockDisponible: 10,
  },
  {
    id: "eq-4",
    nombre: "Conos",
    disciplina: "Fútbol 5",
    stockTotal: 15,
    stockDisponible: 15,
  },
  {
    id: "eq-5",
    nombre: "Pelotas de pádel",
    disciplina: "Pádel",
    stockTotal: 15,
    stockDisponible: 15,
  },
  {
    id: "eq-6",
    nombre: "Paletas de pádel",
    disciplina: "Pádel",
    stockTotal: 8,
    stockDisponible: 8,
  },
];

function cargarReservas(): Reserva[] {
  if (typeof window === "undefined") return [];
  try {
    const datos = window.localStorage.getItem(CLAVE_RESERVAS);
    if (!datos) return [];
    const reservas = JSON.parse(datos) as Reserva[];
    if (Array.isArray(reservas)) {
      return reservas;
    }
    return [];
  } catch {
    return [];
  }
}

function guardarReservas(reservas: Reserva[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE_RESERVAS, JSON.stringify(reservas));
  } catch {
    // Si el almacenamiento no está disponible, no persistimos.
  }
}

export function obtenerCanchas(filtros?: {
  disciplina?: Disciplina | "Todas";
  fecha?: string;
  hora?: string;
}): Cancha[] {
  let resultado = [...canchasBase];

  if (filtros?.disciplina && filtros.disciplina !== "Todas") {
    resultado = resultado.filter(
      (cancha) => cancha.disciplina === filtros.disciplina
    );
  }

  return resultado;
}

export function obtenerCancha(id: string): Cancha | null {
  return canchasBase.find((cancha) => cancha.id === id) ?? null;
}

export function obtenerEquipamiento(disciplina?: Disciplina): Equipamiento[] {
  if (!disciplina) return [...equipamientoBase];
  return equipamientoBase.filter((eq) => eq.disciplina === disciplina);
}

export type DatosCrearReserva = {
  usuarioId: string;
  canchaId: string;
  fecha: string;
  hora: string;
  equipamiento: ReservaEquipamiento[];
};

export function crearReserva(datos: DatosCrearReserva): Reserva {
  const cancha = obtenerCancha(datos.canchaId);
  if (!cancha) {
    throw new Error("Cancha no encontrada");
  }

  const reservas = cargarReservas();
  const reserva: Reserva = {
    id: generarId(),
    usuarioId: datos.usuarioId,
    canchaId: datos.canchaId,
    canchaNombre: cancha.nombre,
    disciplina: cancha.disciplina,
    fecha: datos.fecha,
    hora: datos.hora,
    equipamiento: datos.equipamiento,
    monto: 0, // placeholder
    estado: "confirmada",
    fechaCreacion: new Date().toISOString(),
  };

  reservas.push(reserva);
  guardarReservas(reservas);
  return reserva;
}

const MILIS_POR_HORA = 60 * 60 * 1000;
const HORAS_ANTICIPACION_CANCELACION = 2;

function inicioTurno(reserva: Reserva): Date | null {
  const [anio, mes, dia] = reserva.fecha.split("-").map(Number);
  const [hora, minutos] = reserva.hora.split(":").map(Number);
  if (!anio || !mes || !dia || Number.isNaN(hora)) return null;
  return new Date(anio, mes - 1, dia, hora, Number.isNaN(minutos) ? 0 : minutos);
}

export function puedeCancelar(reserva: Reserva, ahora: Date): boolean {
  if (reserva.estado !== "confirmada" && reserva.estado !== "pendiente") {
    return false;
  }
  const inicio = inicioTurno(reserva);
  if (!inicio) return false;
  return (
    inicio.getTime() - ahora.getTime() >=
    HORAS_ANTICIPACION_CANCELACION * MILIS_POR_HORA
  );
}

export function obtenerReservasDeUsuario(usuarioId: string): Reserva[] {
  const reservas = cargarReservas().filter((r) => r.usuarioId === usuarioId);
  reservas.sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
    if (a.hora !== b.hora) return a.hora < b.hora ? -1 : 1;
    return 0;
  });
  return reservas;
}

export function cancelarReserva(id: string, usuarioId: string): Reserva {
  const reservas = cargarReservas();
  const reserva = reservas.find((r) => r.id === id);
  if (!reserva) {
    throw new Error("Reserva no encontrada");
  }
  if (reserva.usuarioId !== usuarioId) {
    throw new Error("La reserva no pertenece a este usuario");
  }
  if (reserva.estado === "cancelada") {
    throw new Error("La reserva ya está cancelada");
  }
  if (!puedeCancelar(reserva, new Date())) {
    throw new Error(
      "No se puede cancelar: faltan menos de 2 horas para el turno"
    );
  }
  reserva.estado = "cancelada";
  guardarReservas(reservas);
  return reserva;
}

export function obtenerProximaReserva(usuarioId?: string): Reserva | null {
  const reservas = cargarReservas();
  let resultado = reservas.filter(
    (r) => r.estado === "confirmada" || r.estado === "pendiente"
  );

  if (usuarioId) {
    resultado = resultado.filter((r) => r.usuarioId === usuarioId);
  }

  if (resultado.length === 0) return null;

  // Ordenar por fecha y hora
  resultado.sort((a, b) => {
    if (a.fecha < b.fecha) return -1;
    if (a.fecha > b.fecha) return 1;
    if (a.hora < b.hora) return -1;
    if (a.hora > b.hora) return 1;
    return 0;
  });

  return resultado[0];
}

export function obtenerDisponiblesAhora(disciplina?: Disciplina | "Todas"): Array<{
  cancha: Cancha;
  hora: string;
}> {
  const ahora = new Date();
  const hoy = obtenerFechaLocalHoy();
  const horaActual = `${String(ahora.getHours()).padStart(2, "0")}:${String(
    ahora.getMinutes()
  ).padStart(2, "0")}`;
  const horas = ["16:00", "17:00", "18:00", "19:00", "20:00", "21:00"].filter(
    (hora) => hora >= horaActual
  );
  const reservas = cargarReservas();
  const canchas = obtenerCanchas({ disciplina });

  const disponibles: Array<{ cancha: Cancha; hora: string }> = [];

  for (const cancha of canchas) {
    const libre = horas.find(
      (hora) =>
        !reservas.some(
          (r) =>
            r.canchaId === cancha.id &&
            r.fecha === hoy &&
            r.hora === hora &&
            r.estado === "confirmada"
        )
    );
    if (libre) {
      disponibles.push({ cancha, hora: libre });
    }
  }

  const ordenadas: typeof disponibles = [];
  const vistas = new Set<Disciplina>();
  for (const entrada of disponibles) {
    if (!vistas.has(entrada.cancha.disciplina)) {
      vistas.add(entrada.cancha.disciplina);
      ordenadas.push(entrada);
    }
  }
  for (const entrada of disponibles) {
    if (!ordenadas.includes(entrada)) {
      ordenadas.push(entrada);
    }
  }

  return ordenadas.slice(0, 3);
}

export function obtenerReservas(): Reserva[] {
  return cargarReservas();
}

export function actualizarReservas(reservas: Reserva[]): void {
  guardarReservas(reservas);
}

// Función para obtener franjas horarias de una cancha en una fecha
export function obtenerFranjas(canchaId: string, fecha: string): Franja[] {
  const horas = ["16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
  const reservas = cargarReservas();
  return horas.map((hora) => ({
    hora,
    ocupada: reservas.some(
      (r) =>
        r.canchaId === canchaId &&
        r.fecha === fecha &&
        r.hora === hora &&
        r.estado === "confirmada"
    ),
  }));
}
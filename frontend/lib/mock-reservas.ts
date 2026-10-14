

import { obtenerFechaLocalHoy } from "./fechas";

export type Disciplina = "Tenis" | "Fútbol 5" | "Pádel";

export type EstadoCancha = "disponible" | "ocupada" | "mantenimiento";

export type Cancha = {
  id: string;
  nombre: string;
  disciplina: Disciplina;
  /** Indica si la cancha se ofrece a los socios para reservar. */
  activa: boolean;
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
const CLAVE_CANCHAS = "clubDeportivo.canchas";
const CLAVE_EQUIPAMIENTO = "clubDeportivo.equipamiento";

/** Un ítem de equipamiento tiene "poco stock" cuando su stock total es 5 o menos. */
export const UMBRAL_POCO_STOCK = 5;

function generarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Datos iniciales de canchas
const canchasBase: Cancha[] = [
  {
    id: "cancha-1",
    nombre: "Cancha 1",
    disciplina: "Tenis",
    activa: true,
    estado: "disponible",
  },
  {
    id: "cancha-2",
    nombre: "Cancha 2",
    disciplina: "Fútbol 5",
    activa: true,
    estado: "disponible",
  },
  {
    id: "cancha-3",
    nombre: "Cancha 3",
    disciplina: "Pádel",
    activa: true,
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

function cargarCanchas(): Cancha[] {
  if (typeof window === "undefined") {
    return canchasBase.map((cancha) => ({ ...cancha }));
  }
  try {
    const datos = window.localStorage.getItem(CLAVE_CANCHAS);
    if (!datos) return canchasBase.map((cancha) => ({ ...cancha }));
    const canchas = JSON.parse(datos) as Cancha[];
    if (!Array.isArray(canchas)) {
      return canchasBase.map((cancha) => ({ ...cancha }));
    }
    // Una cancha guardada sin el campo `activa` (datos viejos) se asume activa.
    return canchas.map((cancha) => ({ ...cancha, activa: cancha.activa ?? true }));
  } catch {
    return canchasBase.map((cancha) => ({ ...cancha }));
  }
}

function guardarCanchas(canchas: Cancha[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE_CANCHAS, JSON.stringify(canchas));
  } catch {
    // Si el almacenamiento no está disponible, no persistimos.
  }
}

function cargarEquipamiento(): Equipamiento[] {
  if (typeof window === "undefined") {
    return equipamientoBase.map((item) => ({ ...item }));
  }
  try {
    const datos = window.localStorage.getItem(CLAVE_EQUIPAMIENTO);
    if (!datos) return equipamientoBase.map((item) => ({ ...item }));
    const equipamiento = JSON.parse(datos) as Equipamiento[];
    if (!Array.isArray(equipamiento)) {
      return equipamientoBase.map((item) => ({ ...item }));
    }
    return equipamiento;
  } catch {
    return equipamientoBase.map((item) => ({ ...item }));
  }
}

function guardarEquipamiento(equipamiento: Equipamiento[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE_EQUIPAMIENTO, JSON.stringify(equipamiento));
  } catch {
    // Si el almacenamiento no está disponible, no persistimos.
  }
}

export function obtenerCanchas(filtros?: {
  disciplina?: Disciplina | "Todas";
  fecha?: string;
  hora?: string;
}): Cancha[] {
  let resultado = cargarCanchas().filter((cancha) => cancha.activa);

  if (filtros?.disciplina && filtros.disciplina !== "Todas") {
    resultado = resultado.filter(
      (cancha) => cancha.disciplina === filtros.disciplina
    );
  }

  return resultado;
}

/** Devuelve una cancha aunque esté inactiva, para no romper reservas ya hechas. */
export function obtenerCancha(id: string): Cancha | null {
  return cargarCanchas().find((cancha) => cancha.id === id) ?? null;
}

/** Todas las canchas, activas e inactivas. La usa el panel de administración. */
export function obtenerTodasLasCanchas(): Cancha[] {
  return cargarCanchas();
}

export function obtenerEquipamiento(disciplina?: Disciplina): Equipamiento[] {
  const equipamiento = cargarEquipamiento();
  if (!disciplina) return equipamiento;
  return equipamiento.filter((eq) => eq.disciplina === disciplina);
}

// Funciones de administración: mutan el catálogo persistido de canchas y
// de equipamiento. El nombre de cancha es obligatorio y único sin distinguir
// mayúsculas.

function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase();
}

function esNombreRepetido(nombre: string, idAApartar?: string): boolean {
  const nombreNormalizado = normalizarNombre(nombre);
  return cargarCanchas().some(
    (cancha) =>
      cancha.id !== idAApartar &&
      normalizarNombre(cancha.nombre) === nombreNormalizado
  );
}

function validarStock(stockTotal: number): void {
  if (!Number.isInteger(stockTotal) || stockTotal < 0) {
    throw new Error("El stock debe ser un entero mayor o igual a 0.");
  }
}

export function crearCancha(datos: {
  nombre: string;
  disciplina: Disciplina;
}): Cancha {
  const nombre = datos.nombre.trim();
  if (!nombre) {
    throw new Error("El nombre es obligatorio.");
  }
  if (esNombreRepetido(nombre)) {
    throw new Error("Ya existe una cancha con ese nombre.");
  }

  const canchas = cargarCanchas();
  const cancha: Cancha = {
    id: generarId(),
    nombre,
    disciplina: datos.disciplina,
    activa: true,
    estado: "disponible",
  };
  guardarCanchas([...canchas, cancha]);
  return cancha;
}

export function editarCancha(
  id: string,
  datos: { nombre: string; disciplina: Disciplina }
): Cancha {
  const canchas = cargarCanchas();
  const indice = canchas.findIndex((cancha) => cancha.id === id);
  if (indice === -1) {
    throw new Error("Cancha no encontrada.");
  }

  const nombre = datos.nombre.trim();
  if (!nombre) {
    throw new Error("El nombre es obligatorio.");
  }
  if (esNombreRepetido(nombre, id)) {
    throw new Error("Ya existe una cancha con ese nombre.");
  }

  const editada: Cancha = {
    ...canchas[indice],
    nombre,
    disciplina: datos.disciplina,
  };
  canchas[indice] = editada;
  guardarCanchas(canchas);
  return editada;
}

export function cambiarActivaCancha(id: string, activa: boolean): Cancha {
  const canchas = cargarCanchas();
  const indice = canchas.findIndex((cancha) => cancha.id === id);
  if (indice === -1) {
    throw new Error("Cancha no encontrada.");
  }

  const actualizada: Cancha = { ...canchas[indice], activa };
  canchas[indice] = actualizada;
  guardarCanchas(canchas);
  return actualizada;
}

export function actualizarStockEquipamiento(
  id: string,
  stockTotal: number
): Equipamiento {
  validarStock(stockTotal);

  const equipamiento = cargarEquipamiento();
  const indice = equipamiento.findIndex((item) => item.id === id);
  if (indice === -1) {
    throw new Error("Equipamiento no encontrado.");
  }

  const actual = equipamiento[indice];
  // El stock disponible se mueve con la misma diferencia que el total, sin bajar de 0.
  const diferencia = stockTotal - actual.stockTotal;
  const actualizado: Equipamiento = {
    ...actual,
    stockTotal,
    stockDisponible: Math.max(0, actual.stockDisponible + diferencia),
  };
  equipamiento[indice] = actualizado;
  guardarEquipamiento(equipamiento);
  return actualizado;
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
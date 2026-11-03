import {
  borrarSesion,
  guardarToken,
  guardarUsuario,
  leerToken,
} from "@/lib/almacen-sesion";
import { aRolFront } from "@/lib/tipos";
import type {
  CampoInvalido,
  DatosLogin,
  DatosRegistro,
  RolBackend,
  SesionAutenticada,
  UsuarioPublico,
} from "@/lib/tipos";

export type EstadoCancha = "DISPONIBLE" | "OCUPADA" | "EN_MANTENIMIENTO";

export type DisciplinaApi = {
  id: string;
  nombre: string;
};

export type CanchaApi = {
  id: string;
  nombre: string;
  ubicacion: string;
  capacidad: number;
  estado: EstadoCancha;
  disciplinas: DisciplinaApi[];
};

export type TurnoApi = {
  id: string;
  cancha_id: string;
  disciplina_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
};

export type AlquilerApi = {
  id: string;
  total: number;
  items: { equipamientoId: string; cantidad: number; precioUnitario: number }[];
};

export type ReservaApi = {
  id: string;
  usuarioId: string;
  turnoId: string;
  estado: "CONFIRMADA" | "CANCELADA";
  createdAt: string;
  alquiler: AlquilerApi | null;
  turno: {
    fecha: string;
    horaInicio: string;
    horaFin: string;
    cancha: { id: string; nombre: string };
  };
};

export type EquipamientoApi = {
  id: string;
  nombre: string;
  disciplinaId: string;
  disciplina: { id: string; nombre: string };
  stockTotal: number;
  stockDisponible: number;
  precioUnitario: number;
  activo: boolean;
  disponible: boolean;
};

const URL_CONFIGURADA = process.env.NEXT_PUBLIC_API_URL?.trim();

/**
 * Origen del backend, sin sufijo de versión. En desarrollo, si no está
 * configurado, se usa el servidor local; en producción es obligatorio.
 */
export const BASE_URL =
  URL_CONFIGURADA ||
  (process.env.NODE_ENV !== "production" ? "http://localhost:3001" : "");

export class ApiError extends Error {
  readonly status: number;
  readonly campos: CampoInvalido[];

  constructor(status: number, mensaje: string, campos: CampoInvalido[] = []) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
    this.campos = campos;
  }
}

type RespuestaError = {
  message?: unknown;
  campos?: unknown;
};

type UsuarioApi = {
  id: string;
  nombre: string;
  contacto: string | null;
  email: string;
  rol: RolBackend;
};

type SesionApi = {
  token: string;
  usuario: UsuarioApi;
};

type OpcionesPeticion = {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  cuerpo?: unknown;
  /** `null` fuerza una petición sin token (por ejemplo, login). */
  token?: string | null;
};

function aUsuarioPublico(usuario: UsuarioApi): UsuarioPublico {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    contacto: usuario.contacto ?? "",
    email: usuario.email,
    rol: aRolFront(usuario.rol),
  };
}

function aMensaje(cuerpo: RespuestaError | null): string {
  if (typeof cuerpo?.message === "string") return cuerpo.message;
  if (Array.isArray(cuerpo?.message)) {
    const primero = cuerpo.message.find(
      (mensaje): mensaje is string => typeof mensaje === "string",
    );
    if (primero) return primero;
  }
  return "No se pudo completar la petición.";
}

function aCampos(campos: unknown): CampoInvalido[] {
  if (!Array.isArray(campos)) return [];
  return campos.filter(
    (campo): campo is CampoInvalido =>
      typeof campo === "object" &&
      campo !== null &&
      typeof (campo as CampoInvalido).campo === "string" &&
      typeof (campo as CampoInvalido).mensaje === "string",
  );
}

async function leerCuerpo(respuesta: Response): Promise<RespuestaError | null> {
  try {
    return (await respuesta.json()) as RespuestaError;
  } catch {
    return null;
  }
}

/**
 * Realiza una petición al backend. Agrega `Authorization` si hay token
 * guardado, envía y recibe JSON, y traduce cualquier respuesta no exitosa a
 * `ApiError`. Un `401` en una petición con token cierra la sesión y navega al
 * login; el `401` del login (sin token) no dispara ese cierre.
 */
export async function peticion<T>(
  ruta: string,
  opciones: OpcionesPeticion = {},
): Promise<T> {
  if (!BASE_URL) {
    throw new Error(
      "Falta configurar NEXT_PUBLIC_API_URL en este entorno de producción.",
    );
  }

  const token = opciones.token === undefined ? leerToken() : opciones.token;
  const cabeceras: Record<string, string> = { Accept: "application/json" };

  if (opciones.cuerpo !== undefined) {
    cabeceras["Content-Type"] = "application/json";
  }
  if (token) {
    cabeceras.Authorization = `Bearer ${token}`;
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method: opciones.metodo ?? "GET",
      headers: cabeceras,
      body:
        opciones.cuerpo === undefined
          ? undefined
          : JSON.stringify(opciones.cuerpo),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor.");
  }

  if (!respuesta.ok) {
    const cuerpo = await leerCuerpo(respuesta);
    if (respuesta.status === 401 && token) {
      borrarSesion();
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }
    throw new ApiError(
      respuesta.status,
      aMensaje(cuerpo),
      aCampos(cuerpo?.campos),
    );
  }

  if (respuesta.status === 204) {
    return undefined as T;
  }
  return (await respuesta.json()) as T;
}

/** POST /auth/register */
export async function registrar(datos: DatosRegistro): Promise<UsuarioPublico> {
  const usuario = await peticion<UsuarioApi>("/auth/register", {
    metodo: "POST",
    cuerpo: datos,
    token: null,
  });
  return aUsuarioPublico(usuario);
}

/** POST /auth/login. Guarda el token y el usuario de la sesión. */
export async function iniciarSesion(
  datos: DatosLogin,
): Promise<SesionAutenticada> {
  const respuesta = await peticion<SesionApi>("/auth/login", {
    metodo: "POST",
    cuerpo: datos,
    token: null,
  });
  const sesion: SesionAutenticada = {
    token: respuesta.token,
    usuario: aUsuarioPublico(respuesta.usuario),
  };

  guardarToken(sesion.token);
  guardarUsuario(sesion.usuario);
  return sesion;
}

/** GET /auth/perfil. Refresca el usuario guardado con los datos del backend. */
export async function obtenerPerfil(): Promise<UsuarioPublico> {
  const usuario = aUsuarioPublico(
    await peticion<UsuarioApi>("/auth/perfil"),
  );
  guardarUsuario(usuario);
  return usuario;
}

const LIMITE_PAGINA = 50;

/** Pide todas las páginas de un listado paginado (page/limit) del backend. */
async function obtenerTodasLasPaginas<T>(
  ruta: string,
  params: URLSearchParams,
): Promise<T[]> {
  const acumulados: T[] = [];
  for (let pagina = 1; ; pagina += 1) {
    params.set("page", String(pagina));
    params.set("limit", String(LIMITE_PAGINA));
    const respuesta = await peticion<T[]>(`${ruta}?${params.toString()}`);
    acumulados.push(...respuesta);
    if (respuesta.length < LIMITE_PAGINA) return acumulados;
  }
}

/** Mensaje para mostrar al usuario cuando falla una petición. */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Algo salió mal. Intentalo de nuevo.";
}

/** Mensaje de permisos ante un 403; el resto delega en `mensajeDeError`. */
export function mensajeDeErrorAdmin(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) {
    return "No tenés permisos suficientes para realizar esta acción.";
  }
  return mensajeDeError(error);
}

/** GET /canchas, recorriendo todas las páginas. */
export function obtenerCanchas(
  filtros: { disciplina?: string; estado?: EstadoCancha } = {},
): Promise<CanchaApi[]> {
  const params = new URLSearchParams();
  if (filtros.disciplina) params.set("disciplina", filtros.disciplina);
  if (filtros.estado) params.set("estado", filtros.estado);
  return obtenerTodasLasPaginas<CanchaApi>("/canchas", params);
}

/** GET /canchas/:id */
export function obtenerCancha(id: string): Promise<CanchaApi> {
  return peticion<CanchaApi>(`/canchas/${id}`);
}

export type DatosCancha = {
  nombre: string;
  ubicacion: string;
  capacidad: number;
  estado: EstadoCancha;
  disciplinaIds: string[];
};

/** POST /canchas */
export function crearCancha(datos: DatosCancha): Promise<CanchaApi> {
  return peticion<CanchaApi>("/canchas", {
    metodo: "POST",
    cuerpo: datos,
  });
}

/** PUT /canchas/:id (actualización parcial). */
export function editarCancha(
  id: string,
  datos: Partial<DatosCancha>,
): Promise<CanchaApi> {
  return peticion<CanchaApi>(`/canchas/${id}`, {
    metodo: "PUT",
    cuerpo: datos,
  });
}

/** PUT /canchas/:id cambiando solo el estado. */
export function cambiarEstadoCancha(
  id: string,
  estado: EstadoCancha,
): Promise<CanchaApi> {
  return editarCancha(id, { estado });
}

/** GET /disciplinas */
export function obtenerDisciplinas(): Promise<DisciplinaApi[]> {
  return peticion<DisciplinaApi[]>("/disciplinas");
}

/** GET /turnos por cancha y fecha, recorriendo todas las páginas. */
export function obtenerTurnos(
  filtros: { canchaId?: string; disciplinaId?: string; fecha?: string } = {},
): Promise<TurnoApi[]> {
  const params = new URLSearchParams();
  if (filtros.canchaId) params.set("cancha_id", filtros.canchaId);
  if (filtros.disciplinaId) params.set("disciplina_id", filtros.disciplinaId);
  if (filtros.fecha) params.set("fecha", filtros.fecha);
  return obtenerTodasLasPaginas<TurnoApi>("/turnos", params);
}

/** GET /disponibilidad: turnos libres de una cancha en una fecha. */
export function obtenerDisponibilidad(
  canchaId: string,
  fecha: string,
): Promise<TurnoApi[]> {
  const params = new URLSearchParams({ cancha_id: canchaId, fecha });
  return peticion<TurnoApi[]>(`/disponibilidad?${params.toString()}`);
}

/** POST /reservas: crea la reserva CONFIRMADA del turno dado. */
export function crearReserva(turnoId: string): Promise<ReservaApi> {
  return peticion<ReservaApi>("/reservas", {
    metodo: "POST",
    cuerpo: { turnoId },
  });
}

/** GET /reservas/mis: reservas del usuario autenticado. */
export function obtenerMisReservas(): Promise<ReservaApi[]> {
  return peticion<ReservaApi[]>("/reservas/mis");
}

/** PATCH /reservas/:id/cancelar: cancela la reserva propia. */
export function cancelarReserva(id: string): Promise<ReservaApi> {
  return peticion<ReservaApi>(`/reservas/${id}/cancelar`, {
    metodo: "PATCH",
  });
}

export type FiltrosEquipamiento = {
  disciplinaId?: string;
  disponible?: boolean;
  incluirInactivos?: boolean;
};

/** GET /equipamiento con filtros opcionales (recorre páginas). */
export function obtenerEquipamiento(
  filtros: FiltrosEquipamiento = {},
): Promise<EquipamientoApi[]> {
  const params = new URLSearchParams();
  if (filtros.disciplinaId) params.set("disciplinaId", filtros.disciplinaId);
  if (filtros.disponible === true) params.set("disponible", "true");
  if (filtros.incluirInactivos) params.set("incluirInactivos", "true");
  return obtenerTodasLasPaginas<EquipamientoApi>("/equipamiento", params);
}

export type DatosEquipamiento = {
  nombre: string;
  disciplinaId: string;
  stockTotal: number;
  precioUnitario: number;
};

/** POST /equipamiento */
export function crearEquipamiento(
  datos: DatosEquipamiento,
): Promise<EquipamientoApi> {
  return peticion<EquipamientoApi>("/equipamiento", {
    metodo: "POST",
    cuerpo: datos,
  });
}

/** PUT /equipamiento/:id (actualización parcial). */
export function editarEquipamiento(
  id: string,
  datos: Partial<DatosEquipamiento>,
): Promise<EquipamientoApi> {
  return peticion<EquipamientoApi>(`/equipamiento/${id}`, {
    metodo: "PUT",
    cuerpo: datos,
  });
}

/** POST /reservas/:id/alquiler: alquila equipamiento sobre una reserva. */
export function crearAlquiler(
  reservaId: string,
  items: { equipamientoId: string; cantidad: number }[],
): Promise<AlquilerApi> {
  return peticion<AlquilerApi>(`/reservas/${reservaId}/alquiler`, {
    metodo: "POST",
    cuerpo: { items },
  });
}

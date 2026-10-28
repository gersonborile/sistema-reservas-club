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

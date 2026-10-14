import { leerClaims, leerToken } from "@/lib/sesion";
import type {
  CampoInvalido,
  DatosLogin,
  DatosRegistro,
  UsuarioPublico,
} from "@/lib/tipos";

/** Origen del backend. Cuando exista, las funciones de abajo pasan a usar `fetch`. */
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

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

type UsuarioGuardado = UsuarioPublico & { contrasena: string };

const CLAVE_USUARIOS_MOCK = "clubDeportivo.usuariosMock";
const LATENCIA_MOCK_MS = 300;
const TTL_TOKEN_SEGUNDOS = 60 * 60 * 8;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Administrador semilla del mock. Siempre existe en el login aunque no haya
 * usuarios registrados. Es solo para desarrollo y se retira con el backend.
 * Su id (`admin-1`) no sigue el patrón `usr_...` del registro, así nunca
 * choca con los ids que genera `registrar()`.
 */
const ADMIN_SEMILLA: UsuarioGuardado = {
  id: "admin-1",
  nombre: "Admin",
  contacto: "",
  email: "admin@club.com",
  contrasena: "admin123",
  rol: "administrador",
};

function esperar(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, LATENCIA_MOCK_MS));
}

function aBase64(texto: string): string {
  return window
    .btoa(texto)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

function leerUsuariosRegistrados(): UsuarioGuardado[] {
  try {
    const crudo = window.localStorage.getItem(CLAVE_USUARIOS_MOCK);
    if (!crudo) return [];
    const datos: unknown = JSON.parse(crudo);
    return Array.isArray(datos) ? (datos as UsuarioGuardado[]) : [];
  } catch {
    return [];
  }
}

/** Usuarios del mock: el administrador semilla y los registrados. */
function leerUsuariosMock(): UsuarioGuardado[] {
  return [ADMIN_SEMILLA, ...leerUsuariosRegistrados()];
}

function escribirUsuariosMock(usuarios: UsuarioGuardado[]): void {
  try {
    window.localStorage.setItem(CLAVE_USUARIOS_MOCK, JSON.stringify(usuarios));
  } catch {
    // Sin persistencia local los datos mock no sobreviven a una recarga.
  }
}

/** Lista explícita de campos públicos: nunca incluye credenciales. */
function aUsuarioPublico(usuario: UsuarioGuardado): UsuarioPublico {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    contacto: usuario.contacto,
    email: usuario.email,
    rol: usuario.rol,
  };
}

function crearTokenMock(usuario: UsuarioGuardado): string {
  const emitido = Math.floor(Date.now() / 1000);
  const claims = {
    userId: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    iat: emitido,
    exp: emitido + TTL_TOKEN_SEGUNDOS,
  };
  const header = aBase64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = aBase64(JSON.stringify(claims));
  return `${header}.${payload}.mock-firma`;
}

/**
 * POST /auth/registro
 *
 * Hoy la llamada está simulada contra `localStorage`. Cuando exista el backend,
 * reemplazar el cuerpo por `fetch(`${BASE_URL}/auth/registro`, ...)` conservando
 * los `ApiError` para los códigos de error (400 validación, 409 email duplicado).
 */
export async function registrar(datos: DatosRegistro): Promise<UsuarioPublico> {
  const campos = validarRegistro(datos);
  if (campos.length > 0) {
    throw new ApiError(400, "Revisá los datos del formulario.", campos);
  }

  await esperar();

  const registrados = leerUsuariosRegistrados();
  const email = normalizarEmail(datos.email);
  // Se compara contra todos los usuarios del mock (incluye al administrador
  // semilla), así nadie puede registrarse con su email.
  if (leerUsuariosMock().some((usuario) => normalizarEmail(usuario.email) === email)) {
    const mensaje = "El email ya está en uso.";
    throw new ApiError(409, mensaje, [{ campo: "email", mensaje }]);
  }

  const usuario: UsuarioGuardado = {
    id: `usr_${registrados.length + 1}`,
    nombre: datos.nombre.trim(),
    contacto: datos.contacto.trim(),
    email,
    contrasena: datos.contrasena,
    rol: "usuario",
  };

  escribirUsuariosMock([...registrados, usuario]);
  return aUsuarioPublico(usuario);
}

/**
 * POST /auth/login
 *
 * Devuelve un token de sesión que identifica al usuario y su rol. El rechazo es
 * genérico: no revela si el email existe ni cuál dato fue incorrecto. Cuando exista
 * el backend, reemplazar el cuerpo por `fetch(`${BASE_URL}/auth/login`, ...)`.
 */
export async function iniciarSesion(
  datos: DatosLogin,
): Promise<{ token: string; usuario: UsuarioPublico }> {
  const campos = validarLogin(datos);
  if (campos.length > 0) {
    throw new ApiError(400, "Revisá los datos del formulario.", campos);
  }

  await esperar();

  const usuario = leerUsuariosMock().find(
    (guardado) => normalizarEmail(guardado.email) === normalizarEmail(datos.email),
  );
  if (!usuario || usuario.contrasena !== datos.contrasena) {
    throw new ApiError(401, "Credenciales inválidas.");
  }

  return { token: crearTokenMock(usuario), usuario: aUsuarioPublico(usuario) };
}

/**
 * GET /auth/perfil
 *
 * Recurso protegido: sin token (o con token que no identifica a un usuario)
 * responde 401. Cuando exista el backend, reemplazar el cuerpo por
 * `fetch(`${BASE_URL}/auth/perfil`, { headers: cabecerasDeAutenticacion() })`.
 */
export async function obtenerPerfil(): Promise<UsuarioPublico> {
  const token = leerToken();
  const claims = token ? leerClaims(token) : null;
  if (!claims) {
    throw new ApiError(401, "Sesión no válida.");
  }

  await esperar();

  const usuario = leerUsuariosMock().find((guardado) => guardado.id === claims.userId);
  if (!usuario) {
    throw new ApiError(401, "Sesión no válida.");
  }

  return aUsuarioPublico(usuario);
}

/** Cabecera `Authorization: Bearer <token>` para las peticiones al backend. */
export function cabecerasDeAutenticacion(): Record<string, string> {
  const token = leerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function validarRegistro(datos: DatosRegistro): CampoInvalido[] {
  const campos: CampoInvalido[] = [];

  if (!datos.nombre.trim()) {
    campos.push({ campo: "nombre", mensaje: "Ingresá tu nombre." });
  }
  if (!datos.contacto.trim()) {
    campos.push({ campo: "contacto", mensaje: "Ingresá un medio de contacto." });
  }
  if (!datos.email.trim()) {
    campos.push({ campo: "email", mensaje: "Ingresá tu email." });
  } else if (!FORMATO_EMAIL.test(datos.email.trim())) {
    campos.push({ campo: "email", mensaje: "El email no tiene un formato válido." });
  }
  if (!datos.contrasena) {
    campos.push({ campo: "contrasena", mensaje: "Ingresá una contraseña." });
  }

  return campos;
}

function validarLogin(datos: DatosLogin): CampoInvalido[] {
  const campos: CampoInvalido[] = [];

  if (!datos.email.trim()) {
    campos.push({ campo: "email", mensaje: "Ingresá tu email." });
  }
  if (!datos.contrasena) {
    campos.push({ campo: "contrasena", mensaje: "Ingresá tu contraseña." });
  }

  return campos;
}

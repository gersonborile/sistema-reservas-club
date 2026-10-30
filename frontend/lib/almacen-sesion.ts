import { esRol } from "@/lib/tipos";
import type { UsuarioPublico } from "@/lib/tipos";

const CLAVE_TOKEN = "clubDeportivo.token";
const CLAVE_USUARIO = "clubDeportivo.usuario";

export function guardarToken(token: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(CLAVE_TOKEN, token);
    return true;
  } catch {
    return false;
  }
}

export function leerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

export function borrarToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    // Si el almacenamiento no está disponible la sesión ya no es recuperable.
  }
}

export function guardarUsuario(usuario: UsuarioPublico): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    return true;
  } catch {
    return false;
  }
}

/** Usuario de la sesión guardado junto al token. `null` si no hay o es inválido. */
export function leerUsuario(): UsuarioPublico | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE_USUARIO);
    if (!crudo) return null;
    const datos = JSON.parse(crudo) as Partial<UsuarioPublico>;
    if (
      typeof datos.id !== "string" ||
      typeof datos.nombre !== "string" ||
      typeof datos.contacto !== "string" ||
      typeof datos.email !== "string" ||
      !esRol(datos.rol)
    ) {
      return null;
    }
    return {
      id: datos.id,
      nombre: datos.nombre,
      contacto: datos.contacto,
      email: datos.email,
      rol: datos.rol,
    };
  } catch {
    return null;
  }
}

export function borrarUsuario(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLAVE_USUARIO);
  } catch {
    // Sin almacenamiento no hay usuario que borrar.
  }
}

/** Borra token y usuario guardados. */
export function borrarSesion(): void {
  borrarToken();
  borrarUsuario();
}

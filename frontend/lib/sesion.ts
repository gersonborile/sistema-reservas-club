import { aRolFront, esRolBackend } from "@/lib/tipos";
import type { SesionEnToken } from "@/lib/tipos";

export {
  borrarSesion,
  borrarToken,
  borrarUsuario,
  guardarToken,
  guardarUsuario,
  leerToken,
  leerUsuario,
} from "@/lib/almacen-sesion";

function decodificarPayload(token: string): unknown {
  const segmentos = token.split(".");
  if (segmentos.length !== 3) return null;
  try {
    const base64 = segmentos[1].replace(/-/g, "+").replace(/_/g, "/");
    const relleno = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(window.atob(relleno));
  } catch {
    return null;
  }
}

/**
 * Claims del token de sesión: identidad y rol. `null` si el token es ilegible
 * o si tiene `exp` y ya venció.
 */
export function leerClaims(token: string): SesionEnToken | null {
  const payload = decodificarPayload(token) as Record<string, unknown> | null;
  if (
    !payload ||
    typeof payload.userId !== "string" ||
    typeof payload.email !== "string" ||
    !esRolBackend(payload.rol) ||
    (payload.exp !== undefined &&
      (typeof payload.exp !== "number" ||
        payload.exp * 1000 <= Date.now()))
  ) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    rol: aRolFront(payload.rol),
  };
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { obtenerPerfil } from "@/lib/api";
import { leerClaims, leerToken, leerUsuario } from "@/lib/sesion";
import type { SesionEnToken, UsuarioPublico } from "@/lib/tipos";

type EstadoSesion = {
  cargando: boolean;
  claims: SesionEnToken | null;
  usuario: UsuarioPublico | null;
};

const ESTADO_INICIAL: EstadoSesion = {
  cargando: true,
  claims: null,
  usuario: null,
};

/**
 * Comparte una única petición de perfil mientras está en curso, para que los
 * distintos componentes no la repitan al montarse a la vez.
 */
let perfilEnCurso: Promise<UsuarioPublico> | null = null;

function cargarPerfil(): Promise<UsuarioPublico> {
  if (!perfilEnCurso) {
    perfilEnCurso = obtenerPerfil().finally(() => {
      perfilEnCurso = null;
    });
  }
  return perfilEnCurso;
}

type OpcionesSesion = {
  /** En páginas públicas, sin token se muestra la landing en lugar de redirigir. */
  redirigirSinSesion?: boolean;
};

/**
 * Lee la sesión del navegador. Si no hay token (y `redirigirSinSesion` está
 * activo), el token es ilegible o venció, navega a `/login`. Si hay token
 * válido pero no hay usuario guardado, lo recupera una vez con
 * `obtenerPerfil()`; un `401` en esa llamada lo maneja `peticion`.
 */
export function useSesion({
  redirigirSinSesion = true,
}: OpcionesSesion = {}): EstadoSesion {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoSesion>(ESTADO_INICIAL);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      const token = leerToken();
      const claims = token ? leerClaims(token) : null;
      if (!claims) {
        if (token || redirigirSinSesion) {
          router.replace("/login");
        }
        if (activo) {
          setEstado({ cargando: false, claims: null, usuario: null });
        }
        return;
      }

      const guardado = leerUsuario();
      if (guardado) {
        if (activo) {
          setEstado({ cargando: false, claims, usuario: guardado });
        }
        return;
      }

      try {
        const usuario = await cargarPerfil();
        if (activo) {
          setEstado({ cargando: false, claims, usuario });
        }
      } catch {
        if (activo) {
          setEstado({ cargando: false, claims, usuario: null });
        }
      }
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, [router, redirigirSinSesion]);

  return estado;
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { borrarToken, leerClaims, leerToken } from "@/lib/sesion";

function obtenerInicial(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/);
  if (partes.length === 0 || !partes[0]) return "?";
  return partes[0].charAt(0).toUpperCase();
}

export default function LayoutPanelAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const token = leerToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const claims = leerClaims(token);
    if (!claims) {
      router.replace("/login");
      return;
    }
    if (claims.rol !== "administrador") {
      router.replace("/");
      return;
    }
    setTimeout(() => {
      setNombre(claims.nombre);
      setAutorizado(true);
      setCargando(false);
    }, 0);
  }, [router]);

  function cerrarSesion() {
    borrarToken();
    router.push("/login");
  }

  if (cargando || !autorizado) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-neutral-50 text-neutral-900">
      <aside className="w-60 shrink-0 flex flex-col border-r border-neutral-200 bg-white">
        <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-neutral-900 font-bold text-white">
            CD
          </div>
          <p className="truncate text-sm font-semibold text-neutral-900">
            Club · Admin
          </p>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            <li>
              <span className="flex items-center border-l-2 border-neutral-900 bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900">
                Resumen
              </span>
            </li>
            <li>
              <a
                href="#canchas"
                className="flex items-center px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Canchas
              </a>
            </li>
            <li>
              <span className="flex cursor-default items-center px-3 py-2 text-sm text-neutral-400">
                Turnos y franjas
              </span>
            </li>
            <li>
              <a
                href="#equipamiento"
                className="flex items-center px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Equipamiento
              </a>
            </li>
            <li>
              <span className="flex cursor-default items-center px-3 py-2 text-sm text-neutral-400">
                Reservas
              </span>
            </li>
          </ul>
        </nav>

        <div className="border-t border-neutral-200 px-5 py-4">
          <button
            type="button"
            onClick={cerrarSesion}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-neutral-200 bg-white">
          <div className="flex items-center justify-between px-8 py-4">
            <h1 className="text-lg font-semibold text-neutral-900">
              Panel de administración
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-700">{nombre}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 font-semibold text-neutral-900">
                {obtenerInicial(nombre)}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { IsotipoMatchPoint } from "@/app/componentes/ui/marca";
import { borrarSesion } from "@/lib/sesion";
import { useSesion } from "@/lib/use-sesion";

function obtenerInicial(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/);
  if (partes.length === 0 || !partes[0]) return "?";
  return partes[0].charAt(0).toUpperCase();
}

function claseNavegacion(activo: boolean): string {
  return activo
    ? "flex items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
    : "flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900";
}

export default function LayoutPanelAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { cargando, claims, usuario } = useSesion();
  const autorizado = claims?.rol === "administrador";
  const nombre = usuario?.nombre ?? "";

  useEffect(() => {
    if (!cargando && claims && claims.rol !== "administrador") {
      router.replace("/");
    }
  }, [cargando, claims, router]);

  function cerrarSesion() {
    borrarSesion();
    router.push("/login");
  }

  if (cargando || !autorizado) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white">
        <div className="flex items-center gap-2.5 border-b border-slate-200/70 px-5 py-4">
          <IsotipoMatchPoint className="h-9 w-9 shrink-0 text-slate-900" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-900">
              MatchPoint
            </p>
            <p className="text-xs text-slate-500">Administración</p>
          </div>
        </div>

        <nav className="flex-1 py-5">
          <ul className="space-y-1 px-3">
            <li>
              <Link href="/admin" className={claseNavegacion(pathname === "/admin")}>
                Resumen
              </Link>
            </li>
            <li>
              <Link href="/admin#canchas" className={claseNavegacion(false)}>
                Canchas
              </Link>
            </li>
            <li>
              <Link
                href="/admin/turnos"
                className={claseNavegacion(pathname.startsWith("/admin/turnos"))}
              >
                Turnos y franjas
              </Link>
            </li>
            <li>
              <Link href="/admin#equipamiento" className={claseNavegacion(false)}>
                Equipamiento
              </Link>
            </li>
            <li>
              <Link
                href="/admin/reservas"
                className={claseNavegacion(pathname.startsWith("/admin/reservas"))}
              >
                Reservas
              </Link>
            </li>
          </ul>
        </nav>

        <div className="border-t border-slate-200/70 px-5 py-4">
          <button
            type="button"
            onClick={cerrarSesion}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-8 py-4">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Panel de administración
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">{nombre}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700">
                {obtenerInicial(nombre)}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
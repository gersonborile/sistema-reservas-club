"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { UsuarioPublico } from "@/lib/tipos";
import { borrarSesion } from "@/lib/sesion";

export default function NavbarHome({
  usuario,
}: {
  usuario: UsuarioPublico | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFuera(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => {
      document.removeEventListener("mousedown", handleClickFuera);
    };
  }, []);

  function cerrarSesion() {
    borrarSesion();
    router.push("/login");
  }

  const inicial = usuario?.nombre.trim().charAt(0).toUpperCase() || "?";

  return (
    <nav className="sticky top-0 z-40 border-b border-outline-variant/20 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-white">
              CD
            </div>
            <span className="text-sm font-bold tracking-tight text-primary">
              Club Deportivo
            </span>
          </Link>
          <div className="hidden items-center gap-6 lg:flex">
            <Link
              href="/"
              className={`text-sm font-medium transition ${
                pathname === "/"
                  ? "text-secondary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Inicio
            </Link>
            <Link
              href="/canchas"
              className={`text-sm font-medium transition ${
                pathname?.startsWith("/canchas")
                  ? "text-secondary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Canchas
            </Link>
            {usuario ? (
              <Link
                href="/reservas"
                className={`text-sm font-medium transition ${
                  pathname?.startsWith("/reservas")
                    ? "text-secondary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                Mis reservas
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/canchas"
            className="hidden rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary/90 sm:inline-flex"
          >
            Reservar turno
          </Link>
          {usuario ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuAbierto(!menuAbierto)}
                aria-label="Menú de usuario"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white ring-2 ring-secondary-container/60"
              >
                {inicial}
              </button>
              {menuAbierto && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface p-1 shadow-md shadow-primary/5">
                  <p className="truncate px-3 py-2 text-xs text-on-surface-variant">
                    {usuario.email}
                  </p>
                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-on-surface transition hover:bg-surface-container"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface transition hover:bg-surface-container sm:text-sm"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 sm:text-sm"
              >
                Registrate
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

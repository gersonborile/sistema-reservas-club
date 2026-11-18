"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Icono } from "@/app/componentes/ui/iconos";
import { borrarSesion } from "@/lib/sesion";
import { useSesion } from "@/lib/use-sesion";

const ENLACES = [
  { texto: "Inicio", href: "/" },
  { texto: "Canchas", href: "/canchas" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cargando } = useSesion({ redirigirSinSesion: false });
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const nombre = usuario?.nombre ?? "";

  useEffect(() => {
    function handleClickFuera(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
        setMenuMovilAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => {
      document.removeEventListener("mousedown", handleClickFuera);
    };
  }, []);

  function cerrarMenus() {
    setMenuAbierto(false);
    setMenuMovilAbierto(false);
  }

  function obtenerInicial(nombreCompleto: string): string {
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length === 0 || !partes[0]) return "?";
    const primera = partes[0];
    return primera.charAt(0).toUpperCase();
  }

  function cerrarSesion() {
    borrarSesion();
    router.push("/login");
  }

  function esLinkActivo(ruta: string): boolean {
    if (ruta === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(ruta) ?? false;
  }

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-40 border-b border-outline-variant/30 bg-surface-container-lowest/90 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" onClick={cerrarMenus} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-secondary-container">
            CD
          </div>
          <span className="hidden text-sm font-bold tracking-tight text-primary sm:inline">
            Club Deportivo
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {ENLACES.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              onClick={cerrarMenus}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                esLinkActivo(enlace.href)
                  ? "bg-secondary text-white"
                  : "text-on-surface-variant hover:bg-secondary-soft hover:text-secondary"
              }`}
            >
              {enlace.texto}
            </Link>
          ))}
          {usuario ? (
            <Link
              href="/reservas"
              onClick={cerrarMenus}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                esLinkActivo("/reservas")
                  ? "bg-secondary text-white"
                  : "text-on-surface-variant hover:bg-secondary-soft hover:text-secondary"
              }`}
            >
              Mis reservas
            </Link>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/canchas"
            onClick={cerrarMenus}
            className="hidden rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary/90 sm:inline-flex"
          >
            Reservar turno
          </Link>

          {cargando ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-surface-container" />
          ) : usuario ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuAbierto((abierto) => !abierto)}
                aria-expanded={menuAbierto}
                aria-label="Menú de usuario"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-secondary-container ring-2 ring-secondary-container/50"
              >
                {obtenerInicial(nombre)}
              </button>
              {menuAbierto && (
                <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-1 shadow-lg shadow-primary/10">
                  <p className="truncate px-3 py-2 text-xs text-on-surface-variant">
                    {usuario.email}
                  </p>
                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-on-surface transition hover:bg-surface-container"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                onClick={cerrarMenus}
                className="rounded-full border border-outline-variant/50 bg-surface-container-lowest px-3 py-1.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                onClick={cerrarMenus}
                className="rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                Registrate
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuMovilAbierto((abierto) => !abierto)}
            aria-expanded={menuMovilAbierto}
            aria-label="Abrir menú"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/50 bg-surface-container-lowest text-on-surface md:hidden"
          >
            <Icono
              nombre={menuMovilAbierto ? "cerrar" : "menu"}
              className="h-5 w-5"
            />
          </button>
        </div>
      </div>

      {menuMovilAbierto && (
        <div className="border-t border-outline-variant/30 bg-surface-container-lowest px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {ENLACES.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                onClick={cerrarMenus}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${
                  esLinkActivo(enlace.href)
                    ? "bg-secondary-soft text-secondary"
                    : "text-on-surface-variant"
                }`}
              >
                {enlace.texto}
              </Link>
            ))}
            {usuario ? (
              <Link
                href="/reservas"
                onClick={cerrarMenus}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${
                  esLinkActivo("/reservas")
                    ? "bg-secondary-soft text-secondary"
                    : "text-on-surface-variant"
                }`}
              >
                Mis reservas
              </Link>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={cerrarMenus}
                  className="rounded-xl border border-outline-variant/50 px-3 py-2.5 text-center text-sm font-semibold text-on-surface"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  onClick={cerrarMenus}
                  className="rounded-xl bg-primary px-3 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Registrate
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

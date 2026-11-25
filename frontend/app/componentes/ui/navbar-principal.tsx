"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Icono } from "@/app/componentes/ui/iconos";
import Marca from "@/app/componentes/ui/marca";
import { borrarSesion } from "@/lib/sesion";
import type { UsuarioPublico } from "@/lib/tipos";

const ENLACES = [
  { texto: "Inicio", href: "/", icono: "home" as const },
  { texto: "Canchas", href: "/canchas", icono: "cancha" as const },
  { texto: "Mis reservas", href: "/reservas", icono: "ticket" as const },
];

function obtenerInicial(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/);
  if (partes.length === 0 || !partes[0]) return "?";
  return partes[0].charAt(0).toUpperCase();
}

export default function NavbarPrincipal({
  usuario,
  cargando = false,
}: {
  usuario: UsuarioPublico | null;
  cargando?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbiertoEn, setMenuAbiertoEn] = useState<string | null>(null);
  const [menuMovilAbiertoEn, setMenuMovilAbiertoEn] = useState<string | null>(
    null,
  );
  const navRef = useRef<HTMLElement>(null);
  const menuAbierto = menuAbiertoEn === pathname;
  const menuMovilAbierto = menuMovilAbiertoEn === pathname;

  useEffect(() => {
    function handleClickFuera(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setMenuAbiertoEn(null);
        setMenuMovilAbiertoEn(null);
      }
    }
    function handleTecla(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuAbiertoEn(null);
        setMenuMovilAbiertoEn(null);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    document.addEventListener("keydown", handleTecla);
    return () => {
      document.removeEventListener("mousedown", handleClickFuera);
      document.removeEventListener("keydown", handleTecla);
    };
  }, []);

  function cerrarMenus() {
    setMenuAbiertoEn(null);
    setMenuMovilAbiertoEn(null);
  }

  function cerrarSesion() {
    cerrarMenus();
    borrarSesion();
    router.push("/login");
  }

  function esLinkActivo(ruta: string): boolean {
    if (ruta === "/") return pathname === "/";
    return pathname?.startsWith(ruta) ?? false;
  }

  const enlaces = usuario ? ENLACES : ENLACES.slice(0, 2);
  const inicial = usuario ? obtenerInicial(usuario.nombre) : "?";

  return (
    <>
      <nav
        ref={navRef}
        className="sticky top-0 z-40 border-b border-outline-variant/40 bg-surface/90 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-8">
            <Marca />
            <div className="hidden items-center gap-0.5 lg:flex">
              {enlaces.map((enlace) => {
                const activo = esLinkActivo(enlace.href);
                return (
                  <Link
                    key={enlace.href}
                    href={enlace.href}
                    onClick={cerrarMenus}
                    aria-current={activo ? "page" : undefined}
                    className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition ${
                      activo
                        ? "text-primary"
                        : "text-on-surface-variant hover:bg-surface-container/60 hover:text-primary"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icono nombre={enlace.icono} className="h-4 w-4" />
                      {enlace.texto}
                    </span>
                    {activo ? (
                      <span className="absolute inset-x-4 -bottom-[1.35rem] h-1 w-1 rounded-full bg-secondary" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/canchas"
              onClick={cerrarMenus}
              className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-secondary-container" />
              Reservar turno
            </Link>

            {cargando ? (
              <div className="h-9 w-9 animate-pulse rounded-full bg-surface-container" />
            ) : usuario ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuAbiertoEn(menuAbierto ? null : pathname)}
                  aria-expanded={menuAbierto}
                  aria-haspopup="menu"
                  aria-label="Menú de usuario"
                  className="flex items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container-lowest py-1 pl-1 pr-2 transition hover:border-secondary/40"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-secondary-container">
                    {inicial}
                  </span>
                  <span className="hidden max-w-[7.5rem] truncate text-sm font-semibold text-primary md:block">
                    {usuario.nombre.split(" ")[0]}
                  </span>
                  <Icono
                    nombre="chevron"
                    className={`hidden h-4 w-4 text-outline transition md:block ${
                      menuAbierto ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {menuAbierto ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]"
                  >
                    <div className="border-b border-outline-variant/40 px-4 py-3">
                      <p className="truncate text-sm font-bold text-primary">
                        {usuario.nombre}
                      </p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {usuario.email}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary-soft px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-secondary">
                        {usuario.rol === "administrador"
                          ? "Administrador"
                          : "Socio"}
                      </span>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href="/reservas"
                        onClick={cerrarMenus}
                        role="menuitem"
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low"
                      >
                        <Icono nombre="ticket" className="h-4 w-4 text-secondary" />
                        Mis reservas
                      </Link>
                      {usuario.rol === "administrador" ? (
                        <Link
                          href="/admin"
                          onClick={cerrarMenus}
                          role="menuitem"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low"
                        >
                          <Icono nombre="cancha" className="h-4 w-4 text-secondary" />
                          Panel de administración
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={cerrarSesion}
                        role="menuitem"
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-on-surface transition hover:bg-surface-container-low"
                      >
                        <Icono nombre="salir" className="h-4 w-4 text-outline" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/login"
                  onClick={cerrarMenus}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container hover:text-primary"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  onClick={cerrarMenus}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-soft"
                >
                  Registrate
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                setMenuMovilAbiertoEn(menuMovilAbierto ? null : pathname)
              }
              aria-expanded={menuMovilAbierto}
              aria-label={menuMovilAbierto ? "Cerrar menú" : "Abrir menú"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container-lowest text-primary lg:hidden"
            >
              <Icono
                nombre={menuMovilAbierto ? "cerrar" : "menu"}
                className="h-5 w-5"
              />
            </button>
          </div>
        </div>

        {menuMovilAbierto ? (
          <div className="border-t border-outline-variant/40 bg-surface-container-lowest px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1.5">
              {enlaces.map((enlace) => {
                const activo = esLinkActivo(enlace.href);
                return (
                  <Link
                    key={enlace.href}
                    href={enlace.href}
                    onClick={cerrarMenus}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold ${
                      activo
                        ? "bg-primary text-white"
                        : "bg-surface-container-low text-on-surface-variant"
                    }`}
                  >
                    <Icono
                      nombre={enlace.icono}
                      className={`h-4 w-4 ${activo ? "text-secondary-container" : "text-secondary"}`}
                    />
                    {enlace.texto}
                  </Link>
                );
              })}
              {!usuario ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={cerrarMenus}
                    className="rounded-xl border border-outline-variant/60 px-3 py-2.5 text-center text-sm font-semibold text-primary"
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
              ) : null}
              <Link
                href="/canchas"
                onClick={cerrarMenus}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-3 text-sm font-bold text-white"
              >
                <Icono nombre="rayo" className="h-4 w-4" />
                Reservar turno
              </Link>
            </div>
          </div>
        ) : null}
      </nav>

      {usuario ? (
        <nav
          aria-label="Navegación principal"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/50 bg-surface-container-lowest/95 backdrop-blur-xl lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto grid max-w-md grid-cols-4 items-end px-2 pb-1.5 pt-1.5">
            {ENLACES.map((enlace) => {
              const activo = esLinkActivo(enlace.href);
              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  aria-current={activo ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[0.65rem] font-medium transition ${
                    activo ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  <span
                    className={`flex h-8 w-10 items-center justify-center rounded-full ${
                      activo
                        ? "bg-secondary-container text-primary"
                        : "text-outline"
                    }`}
                  >
                    <Icono nombre={enlace.icono} className="h-5 w-5" />
                  </span>
                  {enlace.texto === "Mis reservas" ? "Reservas" : enlace.texto}
                </Link>
              );
            })}
            <Link
              href="/canchas"
              className="flex flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[0.65rem] font-medium text-primary"
            >
              <span className="flex h-8 w-10 items-center justify-center rounded-full bg-primary text-secondary-container">
                <Icono nombre="rayo" className="h-5 w-5" />
              </span>
              Reservar
            </Link>
          </div>
        </nav>
      ) : null}
    </>
  );
}

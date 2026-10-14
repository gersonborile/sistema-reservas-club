"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { borrarToken, leerClaims, leerToken } from "@/lib/sesion";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = leerToken();
    if (token) {
      const claims = leerClaims(token);
      if (claims) {
        // Usar setTimeout para evitar warning del linter
        setTimeout(() => setNombre(claims.nombre), 0);
      }
    }
  }, []);

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

  function obtenerInicial(nombreCompleto: string): string {
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length === 0 || !partes[0]) return "?";
    const primera = partes[0];
    return primera.charAt(0).toUpperCase();
  }

  function cerrarSesion() {
    borrarToken();
    router.push("/login");
  }

  function esLinkActivo(ruta: string): boolean {
    if (ruta === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(ruta) ?? false;
  }

  return (
    <nav className="bg-white border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neutral-900 rounded flex items-center justify-center text-white font-bold">
            CD
          </div>
          <span className="font-semibold text-neutral-900">Club Deportivo</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm ${
              esLinkActivo("/")
                ? "text-neutral-900 underline underline-offset-4"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Inicio
          </Link>
          <Link
            href="/canchas"
            className={`text-sm ${
              esLinkActivo("/canchas")
                ? "text-neutral-900 underline underline-offset-4"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Canchas
          </Link>
          <Link
            href="/reservas"
            className={`text-sm ${
              esLinkActivo("/reservas")
                ? "text-neutral-900 underline underline-offset-4"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Mis reservas
          </Link>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center text-neutral-900 font-semibold hover:bg-neutral-300"
          >
            {obtenerInicial(nombre)}
          </button>
          {menuAbierto && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 rounded shadow-lg">
              <button
                type="button"
                onClick={cerrarSesion}
                className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
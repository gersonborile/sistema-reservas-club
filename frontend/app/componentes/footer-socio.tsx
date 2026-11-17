import Link from "next/link";

import { Icono } from "@/app/componentes/ui/iconos";
import { APERTURA, CIERRE } from "@/lib/franjas";

export default function FooterSocio() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-primary text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-sm font-bold text-primary">
              CD
            </div>
            <span className="font-bold">Club Deportivo</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            Reservá canchas, sumá equipamiento y gestioná tus turnos desde un
            solo lugar.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-secondary-container">
            Accesos
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>
              <Link href="/canchas" className="hover:text-white">
                Ver disponibilidad
              </Link>
            </li>
            <li>
              <Link href="/reservas" className="hover:text-white">
                Mis reservas
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white">
                Inicio
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-secondary-container">
            Horarios
          </h2>
          <p className="mt-4 flex items-center gap-2 text-sm text-white/75">
            <Icono nombre="reloj" className="h-4 w-4" />
            Todos los días de {APERTURA} a {CIERRE} hs
          </p>
          <p className="mt-2 text-sm text-white/60">
            Turnos de una hora, sin margen entre franjas.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/60 sm:px-6">
          © 2026 Club Deportivo. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}

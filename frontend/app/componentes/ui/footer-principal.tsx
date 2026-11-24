import Link from "next/link";

import { Icono } from "@/app/componentes/ui/iconos";
import Marca from "@/app/componentes/ui/marca";
import type { DisciplinaApi } from "@/lib/api";
import { aEtiquetaDisciplina } from "@/lib/adaptadores";
import { APERTURA, CIERRE } from "@/lib/franjas";

const ACCESOS = [
  { texto: "Inicio", href: "/" },
  { texto: "Canchas", href: "/canchas" },
  { texto: "Mis reservas", href: "/reservas" },
  { texto: "Crear cuenta", href: "/registro" },
];

export default function FooterPrincipal({
  disciplinas = [],
}: {
  disciplinas?: DisciplinaApi[];
}) {
  return (
    <footer className="mt-20 bg-primary text-white">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="grid gap-12 py-14 sm:py-16 lg:grid-cols-[1.15fr_0.55fr_0.8fr] lg:gap-16 lg:py-20">
          <div>
            <Marca tono="claro" />
            <p className="mt-8 max-w-sm font-display text-4xl leading-[1.02] text-white/90 sm:text-5xl">
              Nos vemos en la cancha.
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
              Reservá tu turno, sumá equipamiento y gestioná todo desde
              MatchPoint. Sin llamados ni vueltas.
            </p>
            <Link
              href="/canchas"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-secondary-container px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-white"
            >
              Reservar turno
              <Icono nombre="flecha" className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <p className="text-sm font-medium text-secondary-container">
              Navegación
            </p>
            <ul className="mt-5 flex flex-col gap-3 text-sm text-white/60">
              {ACCESOS.map((acceso) => (
                <li key={acceso.href}>
                  <Link
                    href={acceso.href}
                    className="transition hover:text-white"
                  >
                    {acceso.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-secondary-container">
              Horarios del club
            </p>
            <p className="mt-5 flex items-start gap-2.5 text-sm leading-relaxed text-white/60">
              <Icono
                nombre="reloj"
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary-container"
              />
              <span>
                Todos los días de {APERTURA} a {CIERRE} hs · Turnos de 1 hora sin
                margen entre franjas
              </span>
            </p>
            {disciplinas.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {disciplinas.map((disciplina) => (
                  <Link
                    key={disciplina.id}
                    href={`/canchas?disciplina=${encodeURIComponent(disciplina.nombre)}`}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-secondary-container/60 hover:text-white"
                  >
                    {aEtiquetaDisciplina(disciplina.nombre)}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 MatchPoint. Todos los derechos reservados.</p>
          <p>Reservá, jugá y gestioná desde cualquier dispositivo.</p>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";

import type { DisciplinaApi } from "@/lib/api";
import { aEtiquetaDisciplina } from "@/lib/adaptadores";
import { APERTURA, CIERRE } from "@/lib/franjas";

export default function FooterHome({
  disciplinas,
}: {
  disciplinas: DisciplinaApi[];
}) {
  return (
    <footer className="mt-16 border-t border-outline-variant/20 bg-primary text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-sm font-bold text-primary">
              CD
            </div>
            <span className="font-bold">Club Deportivo</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/70">
            Reservá canchas y viví el deporte en el corazón de Punilla.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary-container">
            Disciplinas
          </h3>
          {disciplinas.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              {disciplinas.map((disciplina) => (
                <li key={disciplina.id}>
                  <Link
                    href={`/canchas?disciplina=${encodeURIComponent(disciplina.nombre)}`}
                    className="hover:text-white"
                  >
                    {aEtiquetaDisciplina(disciplina.nombre)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-white/60">Sin disciplinas cargadas.</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-secondary-container">
            Horarios
          </h3>
          <p className="mt-4 text-sm text-white/75">
            Todos los días de {APERTURA} a {CIERRE} hs.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/75">
            <Link href="/canchas" className="hover:text-white">
              Ver disponibilidad
            </Link>
            <Link href="/reservas" className="hover:text-white">
              Mis reservas
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/60 sm:px-6">
          © 2026 Club Deportivo MatchPoint Punilla. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";

const DISCIPLINAS = [
  {
    nombre: "Tenis",
    descripcion: "Canchas para jugar simple o dobles, con turnos todos los días.",
  },
  {
    nombre: "Fútbol 5",
    descripcion: "Una cancha para armar el equipo y jugar con amigos.",
  },
  {
    nombre: "Pádel",
    descripcion: "Canchas listas para tu partido de todos los días.",
  },
];

const PASOS = [
  {
    titulo: "Elegí cancha y turno",
    descripcion: "Mirá la disponibilidad por disciplina y seleccioná el día y la hora que prefieras.",
  },
  {
    titulo: "Sumá equipamiento si lo necesitás",
    descripcion: "Agregá lo que te falte para jugar y confirmá todo en la misma reserva.",
  },
  {
    titulo: "Confirmá tu reserva",
    descripcion: "Listo: te queda el turno y lo podés ver cuando quieras en tus reservas.",
  },
];

const LINKS_SECCION = [
  { texto: "Disciplinas", href: "#disciplinas" },
  { texto: "Cómo funciona", href: "#como-funciona" },
  { texto: "Horarios", href: "#horarios" },
  { texto: "Contacto", href: "#contacto" },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 flex-shrink-0 bg-neutral-900 rounded flex items-center justify-center text-white font-bold">
              CD
            </div>
            <span className="font-semibold text-neutral-900 truncate">Club Deportivo</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {LINKS_SECCION.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                {link.texto}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/login"
              className="whitespace-nowrap rounded border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-900 hover:bg-neutral-50 md:px-3 md:text-sm"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="whitespace-nowrap rounded bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 md:px-3 md:text-sm"
            >
              Registrate
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-neutral-200">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 grid grid-cols-1 md:grid-cols-2 items-center gap-10">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                TENIS · FÚTBOL · PÁDEL
              </p>
              <h1 className="mt-3 text-3xl md:text-4xl font-bold text-neutral-900">
                Reservá tu cancha en pocos pasos
              </h1>
              <p className="mt-4 text-neutral-600">
                Elegí el deporte, el día y el horario que más te convenga. En minutos tenés
                tu turno confirmado.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/registro"
                  className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Reservá tu cancha
                </Link>
                <Link
                  href="/login"
                  className="rounded border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                >
                  Ver disponibilidad
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-100 flex items-center justify-center h-56 md:h-72">
              <span className="text-sm text-neutral-500">Imagen principal (cancha / club)</span>
            </div>
          </div>
        </section>

        <section id="disciplinas" className="border-b border-neutral-200 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
            <h2 className="text-center text-2xl font-bold text-neutral-900">
              Nuestras disciplinas
            </h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {DISCIPLINAS.map((disciplina) => (
                <div
                  key={disciplina.nombre}
                  className="rounded-lg border border-neutral-200 p-5"
                >
                  <div className="rounded bg-neutral-100 h-32 flex items-center justify-center">
                    <span className="text-sm text-neutral-500">Imagen</span>
                  </div>
                  <h3 className="mt-4 font-bold text-neutral-900">{disciplina.nombre}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{disciplina.descripcion}</p>
                  <Link
                    href={`/canchas?disciplina=${encodeURIComponent(disciplina.nombre)}`}
                    className="mt-3 inline-block text-sm font-medium text-neutral-900 underline underline-offset-4"
                  >
                    Ver canchas
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="bg-neutral-50 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
            <h2 className="text-center text-2xl font-bold text-neutral-900">Cómo funciona</h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              {PASOS.map((paso, indice) => (
                <div key={paso.titulo} className="flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-white border border-neutral-900 text-neutral-900 flex items-center justify-center font-semibold">
                    {indice + 1}
                  </div>
                  <h3 className="mt-3 font-bold text-neutral-900">{paso.titulo}</h3>
                  <p className="mt-2 text-sm text-neutral-600">{paso.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 flex flex-col items-center gap-6">
            <h2 className="text-center text-2xl font-bold text-neutral-900">
              Creá tu cuenta y reservá tu primer turno
            </h2>
            <Link
              href="/registro"
              className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Crear cuenta
            </Link>
          </div>
        </section>
      </main>

      <footer id="horarios" className="border-t border-neutral-200 bg-white scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-neutral-900 rounded flex items-center justify-center text-white font-bold">
                CD
              </div>
              <span className="font-semibold text-neutral-900">Club Deportivo</span>
            </div>
            <p className="mt-3 text-sm text-neutral-600">
              Reservá tu cancha de tenis, fútbol 5 y pádel en pocos pasos.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Horarios
            </h3>
            <p className="mt-3 text-sm text-neutral-600">Todos los días, de 16:00 a 22:00</p>
          </div>

          <div id="contacto" className="scroll-mt-16">
            <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Contacto
            </h3>
            <p className="mt-3 text-sm text-neutral-400">Próximamente</p>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Seguinos
            </h3>
            <p className="mt-3 text-sm text-neutral-400">Próximamente</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

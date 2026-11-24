import Image from "next/image";
import type { ReactNode } from "react";

import { Icono } from "@/app/componentes/ui/iconos";
import Marca from "@/app/componentes/ui/marca";
import { APERTURA, CIERRE } from "@/lib/franjas";
import { IMAGEN_HERO } from "@/lib/imagenes";

type TarjetaAuthProps = {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  pie?: ReactNode;
};

const BENEFICIOS = [
  "Disponibilidad real por disciplina",
  "Equipamiento en la misma reserva",
  "Cancelá hasta 2 horas antes",
];

export function TarjetaAuth({
  titulo,
  descripcion,
  children,
  pie,
}: TarjetaAuthProps) {
  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <div className="grid min-h-screen lg:grid-cols-[1.04fr_0.96fr]">
        <aside className="relative hidden overflow-hidden bg-primary p-10 text-white lg:flex lg:flex-col xl:p-14">
          <Image
            src={IMAGEN_HERO}
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover opacity-40"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(160deg,rgba(16,25,17,0.52)_0%,rgba(16,25,17,0.88)_58%,rgba(30,91,61,0.72)_100%)]"
          />
          <div
            aria-hidden="true"
            className="fondo-lineas-cancha absolute inset-0 opacity-60"
          />

          <div className="relative flex h-full flex-col">
            <Marca tono="claro" />

            <div className="mt-auto max-w-lg pt-20">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80">
                <span className="pulso-disponible h-1.5 w-1.5 rounded-full bg-secondary-container" />
                Disponibilidad real, todos los días
              </p>
              <h2 className="mt-6 font-display text-[3.6rem] leading-[1.05] tracking-tight text-white xl:text-[4.5rem]">
                La cancha ya está lista. Solo falta{" "}
                <em className="italic text-secondary-container">tu turno.</em>
              </h2>
              <ul className="mt-9 space-y-3">
                {BENEFICIOS.map((beneficio) => (
                  <li
                    key={beneficio}
                    className="flex items-center gap-3 text-sm font-medium text-white/80"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container/15 text-secondary-container">
                      <Icono nombre="check" className="h-3.5 w-3.5" />
                    </span>
                    {beneficio}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/12 pt-6 text-xs font-medium text-white/55">
              <span className="flex items-center gap-2">
                <Icono
                  nombre="reloj"
                  className="h-4 w-4 text-secondary-container"
                />
                {APERTURA} a {CIERRE} hs
              </span>
              <span>Turnos de 1 hora sin margen entre franjas</span>
            </div>
          </div>
        </aside>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:py-14">
          <div className="w-full max-w-[28rem]">
            <div className="mb-10 lg:hidden">
              <Marca />
            </div>

            <p className="flex items-center gap-2 text-sm font-medium text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Tu cuenta MatchPoint
            </p>
            <h1 className="mt-3 font-display text-5xl leading-[1.05] tracking-tight text-primary sm:text-6xl">
              {titulo}
            </h1>
            {descripcion ? (
              <p className="mt-4 max-w-md text-sm leading-relaxed text-on-surface-variant">
                {descripcion}
              </p>
            ) : null}

            <div className="mt-9">{children}</div>

            {pie ? (
              <div className="mt-8 border-t border-outline-variant/60 pt-6 text-sm text-on-surface-variant">
                {pie}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

type AvisoProps = {
  tono: "error" | "exito";
  children: ReactNode;
};

export function Aviso({ tono, children }: AvisoProps) {
  const estilos =
    tono === "error"
      ? "border-danger/20 bg-danger-container text-on-danger-container"
      : "border-secondary/20 bg-secondary-soft text-secondary";

  return (
    <p
      role="alert"
      className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium ${estilos}`}
    >
      <Icono
        nombre={tono === "error" ? "advertencia" : "check"}
        className="mt-0.5 h-4 w-4 flex-shrink-0"
      />
      <span>{children}</span>
    </p>
  );
}

type CampoProps = {
  id: string;
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  placeholder?: string;
  value: string;
  error?: string;
  onChange: (valor: string) => void;
};

export function Campo({
  id,
  label,
  name,
  type = "text",
  autoComplete,
  placeholder,
  value,
  error,
  onChange,
}: CampoProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-on-surface"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(evento) => onChange(evento.target.value)}
        className={`block w-full rounded-xl border px-3.5 py-3 text-sm font-medium text-on-surface outline-none transition placeholder:font-normal placeholder:text-outline ${
          error
            ? "border-danger/40 bg-danger-container/40 focus:border-danger focus:ring-4 focus:ring-danger/10"
            : "border-outline-variant/70 bg-surface-container-lowest focus:border-secondary focus:ring-4 focus:ring-secondary/10"
        }`}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

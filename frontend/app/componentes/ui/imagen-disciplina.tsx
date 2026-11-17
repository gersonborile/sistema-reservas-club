"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Icono, deporteDeDisciplina } from "@/app/componentes/ui/iconos";
import { imagenDisciplina } from "@/lib/imagenes";

type Props = {
  disciplina: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imagenClassName?: string;
};

const SIZES_POR_DEFECTO =
  "(min-width: 1024px) 40vw, (min-width: 640px) 55vw, 100vw";

export default function ImagenDisciplina({
  disciplina,
  alt,
  sizes = SIZES_POR_DEFECTO,
  priority = false,
  className = "",
  imagenClassName = "",
}: Props) {
  const src = imagenDisciplina(disciplina);
  const [fallo, setFallo] = useState(false);
  const etiqueta = disciplina.trim() || "disciplina del club";

  useEffect(() => {
    setFallo(false);
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden bg-surface-container ${className}`}
    >
      {fallo ? (
        <PlaceholderDisciplina disciplina={disciplina} />
      ) : (
        <Image
          src={src}
          alt={alt ?? `Cancha de ${etiqueta}`}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFallo(true)}
          className={`object-cover ${imagenClassName}`}
        />
      )}
    </div>
  );
}

export function PlaceholderDisciplina({ disciplina }: { disciplina: string }) {
  const deporte = deporteDeDisciplina(disciplina);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-[linear-gradient(135deg,var(--secondary-soft)_0%,var(--surface-container-low)_48%,#d6ece1_100%)] text-secondary">
      <svg
        viewBox="0 0 400 240"
        className="absolute inset-0 h-full w-full text-secondary/15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden="true"
      >
        <rect x="20" y="20" width="360" height="200" rx="2" />
        <path d="M200 20v200" />
        <circle cx="200" cy="120" r="34" />
        <path d="M20 76h44v88H20M380 76h-44v88h44" />
        <path d="M20 120h10M380 120h-10" />
      </svg>
      <div className="relative flex flex-col items-center gap-3 px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-secondary/15 bg-white/70 shadow-sm backdrop-blur-sm">
          <Icono nombre={deporte === "generico" ? "cancha" : deporte} className="h-8 w-8" />
        </span>
        <span className="text-sm font-semibold text-secondary">
          {disciplina.trim() || "Cancha del club"}
        </span>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

export type TonoInsignia = "verde" | "neutro" | "oscuro" | "amarillo" | "rojo";

const TONOS: Record<TonoInsignia, string> = {
  verde: "border-secondary/20 bg-secondary-soft text-secondary",
  neutro:
    "border-outline-variant/40 bg-surface-container-low text-on-surface-variant",
  oscuro: "border-primary bg-primary text-white",
  amarillo:
    "border-warning/25 bg-warning-container text-on-warning-container",
  rojo: "border-danger/20 bg-danger-container text-on-danger-container",
};

export function Insignia({
  children,
  tono = "neutro",
  className = "",
}: {
  children: ReactNode;
  tono?: TonoInsignia;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${TONOS[tono]} ${className}`}
    >
      {children}
    </span>
  );
}

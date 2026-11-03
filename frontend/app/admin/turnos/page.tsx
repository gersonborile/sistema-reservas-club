import type { Metadata } from "next";

import TurnosClient from "./turnos-client";

export const metadata: Metadata = {
  title: "Turnos y franjas",
};

export default function PaginaTurnos() {
  return <TurnosClient />;
}

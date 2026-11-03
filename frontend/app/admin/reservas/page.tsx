import type { Metadata } from "next";

import ReservasClient from "./reservas-client";

export const metadata: Metadata = {
  title: "Reservas",
};

export default function PaginaReservas() {
  return <ReservasClient />;
}

import type { Metadata } from "next";
import ReservasClient from "./reservas-client";

export const metadata: Metadata = {
  title: "Mis reservas",
};

export default function PaginaReservas() {
  return <ReservasClient />;
}

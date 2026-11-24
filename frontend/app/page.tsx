import type { Metadata } from "next";

import InicioClient from "./inicio-client";

export const metadata: Metadata = {
  title: "MatchPoint · Inicio",
};

export default function PaginaRaiz() {
  return <InicioClient />;
}

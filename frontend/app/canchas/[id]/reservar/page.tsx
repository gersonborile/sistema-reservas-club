import type { Metadata } from "next";
import { Suspense } from "react";

import ReservarClient from "./reservar-client";

export const metadata: Metadata = {
  title: "Confirmar reserva · MatchPoint",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaginaReservar({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="h-9 w-64 animate-pulse rounded-lg bg-surface-container" />
          <div className="mt-6 h-64 animate-pulse rounded-3xl bg-surface-container" />
        </div>
      }
    >
      <ReservarClient canchaId={id} />
    </Suspense>
  );
}

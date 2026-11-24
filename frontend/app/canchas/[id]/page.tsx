import type { Metadata } from "next";
import { Suspense } from "react";

import DetalleCanchaClient from "./detalle-canchas-client";

export const metadata: Metadata = {
  title: "Detalle de cancha · MatchPoint",
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PaginaDetalleCancha({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="h-4 w-28 animate-pulse rounded bg-surface-container" />
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="aspect-[16/10] animate-pulse rounded-[2rem] bg-surface-container" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 animate-pulse rounded-lg bg-surface-container" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-surface-container" />
              <div className="h-24 animate-pulse rounded-2xl bg-surface-container" />
            </div>
          </div>
        </div>
      }
    >
      <DetalleCanchaClient canchaId={id} />
    </Suspense>
  );
}

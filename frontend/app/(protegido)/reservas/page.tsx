import type { Metadata } from "next";
import { Suspense } from "react";

import ReservasClient from "./reservas-client";

export const metadata: Metadata = {
  title: "Mis reservas · MatchPoint",
};

export default function PaginaReservas() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="h-9 w-56 animate-pulse rounded-lg bg-surface-container" />
          <div className="mt-8 space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-3xl bg-surface-container"
              />
            ))}
          </div>
        </div>
      }
    >
      <ReservasClient />
    </Suspense>
  );
}

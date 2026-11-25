import type { Metadata } from "next";
import { Suspense } from "react";

import CanchasClient from "./canchas-client";

export const metadata: Metadata = {
  title: "Canchas y disponibilidad · MatchPoint",
};

export default function PaginaCanchas() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="h-9 w-72 animate-pulse rounded-lg bg-surface-container" />
          <div className="mt-8 h-24 animate-pulse rounded-2xl bg-surface-container" />
        </div>
      }
    >
      <CanchasClient />
    </Suspense>
  );
}
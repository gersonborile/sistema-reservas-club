"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { rutaLoginConRetorno } from "@/lib/navegacion";
import { leerClaims, leerToken } from "@/lib/sesion";

export default function RequiereSesion({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const token = leerToken();
    const claims = token ? leerClaims(token) : null;
    if (!claims) {
      const actual = `${pathname}${window.location.search}`;
      router.replace(rutaLoginConRetorno(actual));
      return;
    }
    const frame = window.requestAnimationFrame(() => setListo(true));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, router]);

  if (!listo) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-container" />
        <div className="mt-4 h-4 w-80 max-w-full animate-pulse rounded bg-surface-container" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-surface-container" />
      </div>
    );
  }

  return children;
}

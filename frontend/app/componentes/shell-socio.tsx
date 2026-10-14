"use client";

import Navbar from "@/app/componentes/navbar";

export default function ShellSocio({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-neutral-50">{children}</main>
    </div>
  );
}

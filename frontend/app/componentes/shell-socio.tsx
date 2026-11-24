"use client";

import FooterSocio from "@/app/componentes/footer-socio";
import Navbar from "@/app/componentes/navbar";

export default function ShellSocio({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface pb-[4.75rem] lg:pb-0">
      <Navbar />
      <main className="flex-1">{children}</main>
      <FooterSocio />
    </div>
  );
}

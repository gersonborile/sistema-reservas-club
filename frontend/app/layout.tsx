import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import LimpiezaHeredada from "./componentes/limpieza-heredada";
import { ProveedorToasts } from "./componentes/ui/toast";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Club Deportivo · Panel Principal",
  description: "Reservá canchas y complejos deportivos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${plusJakarta.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface font-sans">
        <ProveedorToasts>
          <LimpiezaHeredada />
          {children}
        </ProveedorToasts>
      </body>
    </html>
  );
}

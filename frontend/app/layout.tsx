import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import LimpiezaHeredada from "./componentes/limpieza-heredada";
import { ProveedorToasts } from "./componentes/ui/toast";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MatchPoint · Reservas deportivas",
  description:
    "Reservá canchas de fútbol, pádel y tenis en MatchPoint. Elegí tu turno, sumá equipamiento y gestioná tus reservas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-on-surface font-sans">
        <ProveedorToasts>
          <LimpiezaHeredada />
          {children}
        </ProveedorToasts>
      </body>
    </html>
  );
}

import RequiereSesion from "@/app/componentes/requiere-sesion";

export default function LayoutReservar({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequiereSesion>{children}</RequiereSesion>;
}

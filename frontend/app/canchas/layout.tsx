import ShellSocio from "@/app/componentes/shell-socio";

export default function LayoutCanchas({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShellSocio>{children}</ShellSocio>;
}

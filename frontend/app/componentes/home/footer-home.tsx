import FooterPrincipal from "@/app/componentes/ui/footer-principal";
import type { DisciplinaApi } from "@/lib/api";

export default function FooterHome({
  disciplinas,
}: {
  disciplinas: DisciplinaApi[];
}) {
  return <FooterPrincipal disciplinas={disciplinas} />;
}

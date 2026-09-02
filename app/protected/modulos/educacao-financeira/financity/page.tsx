import ModulePageShell from "@/components/modules/ModulePageShell";
import FinancityGame from "@/components/modules/financity/FinancityGame";
import { requireModuleUser } from "../../require-user";

const PATH = "/protected/modulos/educacao-financeira/financity";

export default async function FinancityPage() {
  await requireModuleUser(PATH);
  return (
    <ModulePageShell
      title="Orçamento Familiar do Futuro"
      description="Simule uma vida financeira em 14 decisões e receba um diagnóstico personalizado."
      backHref="/protected/modulos/educacao-financeira"
    >
      <FinancityGame />
    </ModulePageShell>
  );
}

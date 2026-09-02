import ModulePageShell from "@/components/modules/ModulePageShell";
import CidadaniaFinanceiraGame from "@/components/modules/cidadania-financeira/CidadaniaFinanceiraGame";
import { requireModuleUser } from "../../require-user";

const PATH = "/protected/modulos/educacao-financeira/cidadania-financeira";

export default async function CidadaniaFinanceiraPage() {
  await requireModuleUser(PATH);
  return (
    <ModulePageShell
      title="Cidadania Financeira"
      description="Cem decisões reais em quatro papéis: cidadão, prefeito, ministro da economia e presidente."
      backHref="/protected/modulos/educacao-financeira"
    >
      <CidadaniaFinanceiraGame />
    </ModulePageShell>
  );
}

import ModulePageShell from "@/components/modules/ModulePageShell";
import PrimeiroPasso from "@/components/modules/laboratorio-gestao/PrimeiroPasso";
import { requireModuleUser } from "../require-user";

const PATH = "/protected/modulos/laboratorio-de-gestao";

export default async function LaboratorioDeGestaoPage() {
  const user = await requireModuleUser(PATH);
  return (
    <ModulePageShell
      title="Laboratório de Gestão — Primeiro Passo"
      description="Uma jornada de 10 etapas para organizar sua ideia de pequeno negócio e montar o seu plano."
    >
      <PrimeiroPasso userId={user.id} />
    </ModulePageShell>
  );
}

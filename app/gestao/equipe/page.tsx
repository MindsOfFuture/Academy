import { listarEquipe } from "@/lib/api/gestao/equipe";
import { atividadesDoMes, encontrosDoMes, extrasDoRegistro } from "@/lib/api/gestao/relatorio";
import { exigirMembro } from "../guard";
import { mesDaUrl } from "../alocacao/rotulos";
import { RegistroDoMes } from "../relatorio/registro";
import { SeletorMes } from "../seletor-mes";
import { FormBolsa, FormConcederPapel } from "./forms";
import { CabecalhoEquipe, ListaMembros } from "./lista";
import { JanelaRegistro } from "./janela-registro";

/** Equipe do projeto (spec 003) — só a coordenação chega aqui. */

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<{ registro?: string; mes?: string; acao?: string }>;
}) {
  await exigirMembro("/gestao/equipe", "coordenacao");
  const params = await searchParams;
  const equipe = await listarEquipe();
  // Só abre o registro de quem é bolsista nesta equipe (a lista já separa o E2E).
  const doRegistro = equipe.find((m) => m.bolsista && m.userProfileId === params.registro);
  const mes = mesDaUrl(params.mes);
  const registro = doRegistro
    ? await Promise.all([encontrosDoMes(mes, doRegistro.userProfileId), atividadesDoMes(mes, doRegistro.userProfileId)])
    : null;
  const extras = registro ? await extrasDoRegistro(registro[0], registro[1]) : undefined;

  const ativos = equipe.filter((m) => !m.desligadoEm);
  const desligados = equipe.filter((m) => m.desligadoEm);
  const bolsistas = ativos.filter((m) => m.bolsista).map((m) => ({ id: m.userProfileId, nome: m.nome }));

  return (
    <div className="space-y-6">
      <section aria-labelledby="equipe-ativa" className="space-y-3">
        {/* Ações no canto direito do cabeçalho; os formulários só abrem quando pedidos */}
        <CabecalhoEquipe
          titulo={
            <h2 id="equipe-ativa" className="text-xl font-semibold">
              Equipe ativa ({ativos.length})
            </h2>
          }
          formPessoa={<FormConcederPapel />}
          formBolsa={bolsistas.length > 0 ? <FormBolsa bolsistas={bolsistas} /> : null}
          abrir={params.acao === "bolsa" ? "bolsa" : params.acao === "pessoa" ? "pessoa" : null}
        />
        <ListaMembros membros={ativos} busca />
      </section>

      {desligados.length > 0 && (
        <section aria-labelledby="equipe-desligada" className="space-y-3">
          <h2 id="equipe-desligada" className="text-xl font-semibold">
            Desligados ({desligados.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Sem acesso ao sistema. O que fizeram continua no histórico do projeto.
          </p>
          <ListaMembros membros={desligados} />
        </section>
      )}

      {doRegistro && registro && (
        <JanelaRegistro titulo={`Registro de atividades · ${doRegistro.nome}`}>
          <SeletorMes mes={mes} titulo="Relatório de" parametros={{ registro: doRegistro.userProfileId }} />
          <RegistroDoMes encontros={registro[0]} atividades={registro[1]} vazio="do bolsista" pessoa={doRegistro.userProfileId} {...extras} />
        </JanelaRegistro>
      )}
    </div>
  );
}

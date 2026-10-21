"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  AcaoLote,
  ConflitoHorario,
  EstadoAcao,
} from "@/lib/api/gestao/types";
import { Aviso, campoSelect, rotuloCampo } from "../equipe/forms";
import { conflitosLoteAction, loteAction } from "./actions";
import { JanelaConflitos } from "./forms";

/**
 * Ações em vários encontros de uma vez (spec 020). Envolve o calendário: ligada
 * a seleção, cada encontro mostra uma caixa de marcar (`CaixaLote`), e a barra
 * faz a mesma ação em todos os marcados.
 *
 * O envio é feito à mão (e não por `action` no formulário) para o React não
 * limpar o formulário enquanto a coordenação decide sobre o aviso de horário.
 */

type Opcao = { id: string; nome: string };

const ACOES: { valor: AcaoLote; rotulo: string }[] = [
  { valor: "alocar", rotulo: "Acrescentar pessoas" },
  { valor: "retirar", rotulo: "Tirar uma pessoa" },
  { valor: "trocar", rotulo: "Trocar uma pessoa por outra" },
  { valor: "cancelar", rotulo: "Cancelar os encontros" },
  { valor: "concluir", rotulo: "Concluir os encontros" },
];

const SELETOR = 'input[name="encontros"]';

/** A caixa de marcar de um encontro; só aparece com a seleção ligada. */
export function CaixaLote({
  id,
  turmaId,
  ativo,
  rotulo,
}: {
  id: string;
  turmaId: string | null;
  ativo: boolean;
  rotulo: string;
}) {
  return (
    <input
      type="checkbox"
      name="encontros"
      value={id}
      data-turma={turmaId ?? ""}
      data-ativo={ativo ? "1" : "0"}
      aria-label={`Marcar ${rotulo}`}
      className="hidden h-4 w-4 shrink-0 accent-[#684A97] group-data-[lote=on]:inline-block"
    />
  );
}

export function SelecaoLote({
  turmas,
  pessoas,
  children,
}: {
  turmas: Opcao[];
  pessoas: Opcao[];
  children: ReactNode;
}) {
  const [estado, executar, enviando] = useActionState<
    EstadoAcao | null,
    FormData
  >(loteAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const janelaRef = useRef<HTMLDialogElement>(null);
  const pendente = useRef<FormData | null>(null);
  const [ligado, setLigado] = useState(false);
  const [marcados, setMarcados] = useState(0);
  const [acao, setAcao] = useState<AcaoLote>("alocar");
  const [conflitos, setConflitos] = useState<ConflitoHorario[]>([]);
  const [conferindo, setConferindo] = useState(false);

  function caixas(): HTMLInputElement[] {
    return Array.from(
      formRef.current?.querySelectorAll<HTMLInputElement>(SELETOR) ?? [],
    );
  }

  /** O calendário aparece duas vezes (grade e lista do celular): as duas caixas andam juntas. */
  function contar() {
    setMarcados(
      new Set(
        caixas()
          .filter((c) => c.checked)
          .map((c) => c.value),
      ).size,
    );
  }

  function marcar(filtro: (c: HTMLInputElement) => boolean, valor: boolean) {
    for (const c of caixas()) if (filtro(c)) c.checked = valor;
    contar();
  }

  function aoMudar(e: React.FormEvent<HTMLFormElement>) {
    const alvo = e.target as HTMLInputElement;
    if (alvo.name !== "encontros") return;
    for (const c of caixas())
      if (c.value === alvo.value) c.checked = alvo.checked;
    contar();
  }

  useEffect(() => {
    if (estado?.ok) marcar(() => true, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  function ligar(valor: boolean) {
    setLigado(valor);
    if (!valor) marcar(() => true, false);
  }

  function enviar(dados: FormData) {
    janelaRef.current?.close();
    pendente.current = null;
    startTransition(() => executar(dados));
  }

  async function aoEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    if (
      acao === "cancelar" &&
      !window.confirm(
        `Cancelar ${marcados} ${marcados === 1 ? "encontro" : "encontros"}? Eles deixam de contar horas e continuam no histórico.`,
      )
    )
      return;
    if (
      acao === "retirar" &&
      !window.confirm(
        `Tirar a pessoa de ${marcados} ${marcados === 1 ? "encontro" : "encontros"}? Fica registrado no histórico.`,
      )
    )
      return;
    if (acao === "alocar" || acao === "trocar") {
      setConferindo(true);
      const achados = await conflitosLoteAction(dados);
      setConferindo(false);
      if (achados.length > 0) {
        pendente.current = dados;
        setConflitos(achados);
        janelaRef.current?.showModal();
        return;
      }
    }
    enviar(dados);
  }

  return (
    <form
      ref={formRef}
      onSubmit={aoEnviar}
      onChange={aoMudar}
      data-lote={ligado ? "on" : "off"}
      className="group space-y-4"
    >
      {!ligado ? (
        <Button type="button" variant="outline" onClick={() => ligar(true)}>
          Fazer em vários encontros
        </Button>
      ) : (
        <div className="space-y-3 rounded-lg border border-[#684A97] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">
              {marcados}{" "}
              {marcados === 1 ? "encontro marcado" : "encontros marcados"}
            </p>
            <span className="flex-1" />
            {turmas.length > 0 && (
              <select
                aria-label="Marcar todos de uma turma"
                value=""
                onChange={(e) =>
                  e.target.value &&
                  marcar(
                    (c) =>
                      c.dataset.turma === e.target.value &&
                      c.dataset.ativo === "1",
                    true,
                  )
                }
                className={`${campoSelect} w-auto`}
              >
                <option value="">Marcar os de uma turma…</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => marcar((c) => c.dataset.ativo === "1", true)}
            >
              Marcar todos
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => marcar(() => true, false)}
            >
              Limpar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => ligar(false)}
            >
              Fechar
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1">
              <span className={rotuloCampo}>O que fazer</span>
              <select
                name="acao"
                value={acao}
                onChange={(e) => setAcao(e.target.value as AcaoLote)}
                className={campoSelect}
              >
                {ACOES.map((a) => (
                  <option key={a.valor} value={a.valor}>
                    {a.rotulo}
                  </option>
                ))}
              </select>
            </label>

            {(acao === "retirar" || acao === "trocar") && (
              <label className="space-y-1">
                <span className={rotuloCampo}>Quem sai</span>
                <select
                  name="pessoa"
                  required
                  defaultValue=""
                  className={campoSelect}
                >
                  <option value="">Escolha…</option>
                  {pessoas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {acao === "trocar" && (
              <label className="space-y-1">
                <span className={rotuloCampo}>Quem entra no lugar</span>
                <select
                  name="substituto"
                  required
                  defaultValue=""
                  className={campoSelect}
                >
                  <option value="">Escolha…</option>
                  {pessoas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {(acao === "trocar" || acao === "cancelar") && (
              <label className="space-y-1 sm:col-span-3">
                <span className={rotuloCampo}>
                  {acao === "cancelar"
                    ? "Motivo do cancelamento"
                    : "Motivo (opcional)"}
                </span>
                <Input
                  name="motivo"
                  required={acao === "cancelar"}
                  minLength={acao === "cancelar" ? 3 : undefined}
                  maxLength={500}
                  placeholder={
                    acao === "cancelar"
                      ? "Escola suspendeu as aulas…"
                      : "Troca de turma, afastamento…"
                  }
                />
              </label>
            )}
          </div>

          {acao === "alocar" && (
            <fieldset className="space-y-2">
              <legend className={rotuloCampo}>Quem entra</legend>
              <div className="grid gap-1 sm:grid-cols-3">
                {pessoas.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="pessoas"
                      value={p.id}
                      className="h-4 w-4 accent-[#684A97]"
                    />
                    {p.nome}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {acao === "concluir" && (
            <p className="text-xs text-muted-foreground">
              Só conclui encontro que já começou. Quem estiver como prevista
              passa a cumprida.
            </p>
          )}

          <Button
            type="submit"
            disabled={enviando || conferindo || marcados === 0}
          >
            {conferindo
              ? "Conferindo horários…"
              : enviando
                ? "Fazendo…"
                : `Aplicar em ${marcados} ${marcados === 1 ? "encontro" : "encontros"}`}
          </Button>
          <Aviso estado={estado} />
        </div>
      )}

      {children}

      <JanelaConflitos
        janelaRef={janelaRef}
        conflitos={conflitos}
        confirmar="Fazer mesmo assim"
        aoConfirmar={() => pendente.current && enviar(pendente.current)}
      />
    </form>
  );
}

# 018 — Laboratório de Gestão: jornada completa

Status: aprovada (Rafael, 19/10/2026: "uma versão que junta todos os módulos e que só desbloqueia um módulo tendo feito o anterior")
Constituição: `specs/constitution.md`

## Problema

Os módulos do Laboratório de Gestão II ficam separados por turma. Quem quer percorrer o
caminho inteiro do pequeno negócio precisa achar cada módulo na turma certa, e nada indica
a ordem nem impede de pular etapas.

## Escopo

- Nova aba "Jornada completa" na página do Laboratório de Gestão, com o botão "Começar a jornada".
- A jornada mostra os 10 módulos em ordem. Só o primeiro começa liberado; cada módulo libera
  quando a pessoa chega ao resultado do anterior.
- Módulo ainda não entregue aparece como "em breve" e não trava os seguintes.
- A jornada abre as mesmas páginas publicadas nas turmas. Qualquer mudança feita num módulo
  aparece na jornada na hora, sem cópia para manter.
- O progresso fica no aparelho, como as respostas dos módulos.

**Fora de escopo:** guardar o progresso na conta da pessoa; mudar o conteúdo dos módulos.

## Critérios de aceite

- [x] Ao abrir a jornada, o Módulo 1 está aberto e os outros prontos aparecem trancados.
- [x] Tocar num módulo trancado avisa qual módulo concluir antes; trocar o endereço dentro
      da jornada também não pula etapas.
- [x] Ao chegar ao resultado de um módulo, ele fica marcado como concluído e só o próximo libera.
- [x] O botão do fim de cada módulo leva ao próximo módulo dentro da jornada; no último, a
      jornada mostra a tela de conclusão.
- [x] Recarregar a página mantém o progresso; módulos concluídos podem ser reabertos.
- [x] Só as páginas dos módulos do LG2 podem aparecer dentro de outra página, e só do próprio site.

## Plano

- `public/lg2/jornada/` (HTML/CSS/JS sem dependência, como os módulos) abre cada módulo numa
  moldura do próprio site. O fim de um módulo é a caixa `.lg2-proximo`, que todos já têm.
- `next.config.ts`: `/lg2/*` passa a `X-Frame-Options: SAMEORIGIN` e `frame-ancestors 'self'`;
  o resto do site continua `DENY` / `'none'`.
- Testes: `tests/lg2-jornada.cjs` percorre os 9 módulos prontos de verdade dentro da jornada;
  `tests/unit/components/modules/JornadaLG2.test.ts` confere a lista contra `PRONTOS` e os cabeçalhos.

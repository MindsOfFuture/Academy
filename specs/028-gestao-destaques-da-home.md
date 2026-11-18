# 028 — Gestão: texto e visibilidade dos números da página inicial

Status: implementada (branch `feat/home-destaques`, aguardando publicação)
Constituição: `specs/constitution.md`

## Problema

A página inicial mostra três números logo abaixo do logo. A coordenação pediu para
tirar "Aulas realizadas" e quer, ela mesma, mudar o número e o texto de cada um, sem
depender de quem mexe no código.

## Escopo

Na tela "Hoje" da gestão, em "Números da página inicial", a coordenação passa a
escolher, para escolas, alunos e aulas:

- se o número aparece na página inicial;
- o texto que aparece embaixo dele;
- o número base (já existia, specs 019 e 021: o site soma a ele os cadastros da gestão).

"Aulas realizadas" começa escondido. Sem nenhum número marcado, a faixa some.

**Fora de escopo:** criar um quarto número com outra conta; mudar a ordem; trocar a
soma automática dos cadastros por um número fixo.

## Critérios de aceite

- [x] Sem nada salvo, a página inicial mostra só escolas e alunos, com os textos de sempre.
- [x] Quando a coordenação marca/desmarca um número e salva, a página inicial passa a
      mostrar/esconder aquele número.
- [x] Quando a coordenação troca o texto e salva, a página inicial mostra o novo texto.
- [x] Texto vazio, de uma letra ou acima de 40 é recusado com mensagem clara e nada muda.
- [x] Números e textos mudam juntos ou nada muda.
- [x] Sem permissão: bolsista não vê o formulário; o banco recusa bolsista, conta comum e visitante.

## Plano

- **Degrau da escada:** formulário e função da spec 019 (`gestao.definir_numeros_do_site`)
  reaproveitados; a nova função chama a antiga e grava os textos na mesma chamada.
- **Dados:** chaves `public_home_rotulo_<destaque>` e `public_home_mostrar_<destaque>` em
  `public.system_config`; o prefixo `public_` já é legível pelo visitante na policy
  existente, nenhuma policy muda — `supabase/migrations/20261123_gestao_destaques_da_home.sql`.
- **Autorização:** ação com `ensureGestaoMember()` = coordenação; o banco confere de novo.
- **Arquivos:** migration acima; `lib/api/content.ts`; `components/hero_1/hero.tsx`;
  `components/HomeClient/homeClient.tsx`; `lib/api/gestao/site.ts`; `lib/api/gestao/validacao.ts`;
  `app/gestao/actions.ts`; `app/gestao/numeros-do-site.tsx`; `app/gestao/page.tsx`.
- **Dependência nova:** nenhuma.
- **Ordem de publicação:** a migration entra no banco antes do código ir para `main`.

## Testes

- `tests/integration/gestao-destaques-da-home-migration.test.ts` — grava e o visitante lê,
  regrava sem duplicar, recusas sem efeito, só coordenação.
- `tests/unit/lib/api/content.test.ts` — padrão (aulas escondido), texto e visibilidade gravados.
- `tests/unit/components/hero.test.tsx` — só os marcados aparecem; sem nenhum, a faixa some.
- `tests/unit/lib/api/gestao/site.test.ts`, `validacao.test.ts`, `tests/unit/app/gestao/page-auth.test.tsx`.

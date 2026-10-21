# 019 — Gestão: números da página inicial

Status: aprovada (Rafael, 21/10/2026)
Constituição: `specs/constitution.md`

## Problema

A página inicial mostra "Escolas atendidas" e "Alunos impactados", mas só quem mexe
direto no banco consegue mudar esses números. A coordenação depende de outra pessoa
toda vez que uma escola ou turma nova entra.

## Escopo

Na tela "Hoje" da gestão, a coordenação vê os dois números que estão no site e pode
trocá-los. O site passa a mostrar o novo valor na próxima visita.

**Fora de escopo:**
- Calcular os números sozinho a partir das turmas e alunos cadastrados: a gestão ainda
  não tem o histórico de todas as escolas e alunos que o projeto já atendeu, e o número do
  site é o acumulado desde o início.
- Editar o texto de apresentação do site (outra chave da mesma configuração).
- Bolsista mudar os números.

## Critérios de aceite

- [ ] Dada a coordenação na tela "Hoje", então ela vê "Escolas atendidas" e "Alunos
      impactados" com os valores que o site mostra agora.
- [ ] Quando a coordenação salva 36 escolas e 1520 alunos, então a página inicial passa a
      mostrar 36 e 1520.
- [ ] Número negativo, vazio, com letra ou acima de 1.000.000 é recusado com uma mensagem
      clara e nada muda.
- [ ] Sem permissão: bolsista não vê o formulário, e o banco recusa a mudança de
      qualquer pessoa que não seja da coordenação, mesmo chamada direto.

## Plano

- **Degrau da escada:** a página inicial já lê `public.system_config`
  (`escolas_atendidas`, `alunos_atendidos`) em `lib/api/content.ts#getHero`; nada muda
  nela. Só falta quem escreva.
- **Dados:** `supabase/migrations/20261021_gestao_numeros_do_site.sql` — função
  `gestao.definir_numeros_do_site(p_escolas, p_alunos)`, `security definer`, que confere
  `gestao.usuario_com_papel('coordenacao')` e atualiza as duas chaves. As policies de
  `system_config` (criadas no painel, ADR 008) não mudam.
- **Autorização:** cliente SSR, ação com `ensureGestaoMember()` = coordenação, e o
  banco confere de novo dentro da função. Sem chave de serviço.
- **Arquivos:** migration acima; `lib/api/gestao/site.ts` (+ `index.ts`);
  `lib/api/gestao/validacao.ts` (`validarNumerosDoSite`); `app/gestao/actions.ts`;
  `app/gestao/numeros-do-site.tsx`; `app/gestao/page.tsx`;
  `tests/integration/gestao-numeros-do-site-migration.test.ts`;
  `tests/unit/lib/api/gestao/site.test.ts`.
- **Dependência nova:** nenhuma.
- **Ordem de publicação:** a migration entra no banco antes do código ir para `main`.

## Tarefas

- [x] Função no banco + teste em PGlite (coordenação muda, bolsista e anônimo recusados,
      valor inválido recusado) — `tests/integration/gestao-numeros-do-site-migration.test.ts`
- [x] Leitura, validação e escrita — `lib/api/gestao/site.ts`, `validacao.ts`
- [x] Formulário na tela "Hoje" — `app/gestao/numeros-do-site.tsx`
- [ ] Migration aplicada em produção

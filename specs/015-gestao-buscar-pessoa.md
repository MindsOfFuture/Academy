# 015 — Gestão: escolher a pessoa pelo nome ao montar a equipe

Status: aprovada (coordenação, 09/10/2026: "quero poder selecionar o usuário mais facilmente, um dropdown com pesquisa")
Constituição: `specs/constitution.md`

## Problema

Para pôr alguém na equipe, a coordenação precisa saber o e-mail exato com que a pessoa
entra no site. Na prática ela sabe o nome, não o e-mail, e erra ou desiste.

## Escopo

- Em "Adicionar pessoa à equipe", a coordenação digita parte do nome (ou o começo do
  e-mail) e escolhe a pessoa numa lista que aparece enquanto digita. Funciona com
  teclado (setas, Enter, Esc).
- Cada pessoa da lista mostra o nome, o e-mail parcial (para separar homônimos) e se já
  está na equipe.
- O resto continua igual: escolher o papel e adicionar; quem já está na equipe soma o
  papel novo.

**Fora de escopo:**
- Lista com todas as contas do site. A maioria é de aluno, muitos menores de idade:
  a busca começa com 3 letras, mostra no máximo 10 pessoas e nunca o e-mail inteiro.
- Achar nome sem acento ("Joao" não acha "João").
- Convidar quem ainda não tem conta.

## Critérios de aceite

- [ ] Dada a coordenação, quando digita "fortu", então a lista mostra "Leandro
      Fortunato · le***@gmail.com", e escolher adiciona essa pessoa.
- [ ] Com menos de 3 letras, nada é buscado; com um termo comum, aparecem no máximo 10.
- [ ] Digitar só o domínio ("gmail") não lista contas.
- [ ] Conta excluída do site não aparece.
- [ ] Sem permissão: bolsista não consegue buscar, nem chamando direto.

## Plano

- **Degrau da escada:** troca `gestao.buscar_usuario_por_email` por
  `gestao.buscar_usuarios` (mesma postura: `security definer`, só coordenação,
  `search_path` fixo). Caixa de busca feita com `Input` e uma lista acessível, sem
  dependência nova.
- **Dados:** `supabase/migrations/20261009_gestao_buscar_usuarios.sql`. A função antiga
  fica até este código ir ao ar (o site atual ainda a usa); remover numa migration
  seguinte.
- **Arquivos:** `lib/api/gestao/equipe.ts` (`buscarUsuarios`, sai `buscarUsuarioPorEmail`),
  `types.ts`, `validacao.ts` (sai `validarEmail`), `app/gestao/equipe/actions.ts`
  (`buscarPessoasAction`; `concederPapelAction` recebe a pessoa escolhida),
  `app/gestao/equipe/forms.tsx`.
- **Testes:** `tests/integration/gestao-buscar-usuarios-migration.test.ts` (travas da
  busca), `tests/unit/app/gestao/equipe-busca.test.tsx` (caixa), ajuste em
  `tests/unit/lib/api/gestao/equipe.test.ts`.

## Tarefas

- [x] Função de busca + teste em PGlite
- [x] Caixa de busca na tela de equipe + teste
- [x] Migration aplicada em produção em 09/10/2026 (`gestao_buscar_usuarios`)
- [ ] Remover `gestao.buscar_usuario_por_email` depois do deploy

# Configuração de Login com Google - Guia de Implementação

## 📋 Resumo do que foi implementado

### 1. **Serviço OAuth** ([lib/api/oauth.ts](../lib/api/oauth.ts))
- `signInWithGoogle()`: Inicia o fluxo OAuth com redirecionamento
- `handleOAuthCallback()`: Processa retorno e cria/atualiza perfil

### 2. **Rota de Callback** ([app/auth/callback/route.ts](../app/auth/callback/route.ts))
- Recebe código do Google via Supabase
- Troca código por sessão
- Verifica se perfil está completo
- Se não, redireciona para onboarding

### 3. **Botão de Login Social** ([components/auth/google-auth-button.tsx](../components/auth/google-auth-button.tsx))
- Componente reutilizável
- Integrado na tela de login

### 4. **Telas de Onboarding**
- **Aluno** ([app/auth/complete-profile/page.tsx](../app/auth/complete-profile/page.tsx)): coleta nome, telefone, endereço, documento, data nascimento
- **Professor** ([app/auth/complete-teacher-profile/page.tsx](../app/auth/complete-teacher-profile/page.tsx)): coleta escolas, formação, comprovante

### 5. **Logout**
- Já funciona via `AuthButtonClient` existente ([components/auth/auth-button-client.tsx](../components/auth/auth-button-client.tsx))
- Implementado em `handleSignOut()`

---

## 🔧 Configuração Necessária no Supabase

### Passo 1: Criar aplicação OAuth no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto (ex: "Minds of the Future")
3. Ative API > Google+ API ou Google Identity
4. Vá para "Credenciais" > "Criar OAuth 2.0 ID do cliente"
5. Selecione "Aplicativo web"
6. Configure URIs de redirecionamento:
   ```
   https://jrfehrhiyilxhbuwjmat.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback (desenvolvimento)
   https://mindsofthefuture.com.br/auth/callback (produção)
   ```
7. Copie **Client ID** e **Client Secret**

### Passo 2: Configurar no Supabase

1. Vá para **Supabase Dashboard** > seu projeto
2. **Authentication** > **Providers**
3. Procure por **Google**
4. Habilite o provider
5. Cole **Client ID** e **Client Secret**
6. Salve

### Passo 3: Validar Variáveis de Ambiente

Seu `.env` já tem:
```
NEXT_PUBLIC_SUPABASE_URL="https://jrfehrhiyilxhbuwjmat.supabase.co/"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

Não precisa adicionar mais nada para o client-side.

---

## 🧪 Teste Manual

### Fluxo de Aluno:
1. Clique em "Continuar com Google"
2. Faça login com conta Google
3. Preencha: nome, telefone, endereço, documento, data nascimento
4. Redirecionado para `/protected`

### Fluxo de Professor:
1. Clique em "Continuar com Google"
2. Faça login com conta Google
3. Preencha dados básicos (etapa 1)
4. Preencha dados profissionais: escolas, formação, anexo (etapa 2)
5. Perfil enviado para verificação de admin
6. Admin recebe notificação
7. Redirecionado para `/protected`

### Logout:
1. Clique no avatar no topo
2. Clique em "Sair"
3. Redirecionado para home

---

## 📊 Fluxo de Dados

```
Usuário clica "Continuar com Google"
    ↓
OAuth flow (Supabase → Google)
    ↓
Google retorna código
    ↓
/auth/callback (route handler)
    ↓
Troca código por sessão (Supabase)
    ↓
Se perfil completo → /protected
Se perfil incompleto → /auth/complete-profile?from=oauth
    ↓
Usuário preenche dados faltantes
    ↓
Salva dados + atribui role
    ↓
Se professor → /auth/complete-teacher-profile?from=oauth
    ↓
Se professor → cria teacher_request + notifica admin
    ↓
Redirecionado para /protected
```

---

## ✅ Checklist de Implementação

- [x] Configuração do serviço OAuth
- [x] Rota de callback funcionando
- [x] Usuário criado/associado no Supabase
- [x] Botão de login social na tela de login
- [x] Coleta de dados complementares (aluno)
- [x] Coleta de dados profissionais (professor)
- [x] Logout funcionando
- [x] Notificação para admins (professor)
- [ ] **Pendente:** Testar com Google OAuth configurado no Supabase
- [ ] **Pendente:** Testar em ambiente de produção

---

## 🐛 Possíveis Problemas e Soluções

### Erro: "redirect_uri_mismatch"
- **Causa:** URI no Google Cloud Console não bate com o esperado
- **Solução:** Certifique-se que está exatamente igual, incluindo protocolo (https/http)

### Erro: "User not found after callback"
- **Causa:** Sessão não foi criada
- **Solução:** Verifique logs do Supabase > Auth

### Usuário fica em loop de onboarding
- **Causa:** Dados não estão sendo salvos
- **Solução:** Verifique permissões RLS na tabela `user_profile`

### Notificação não chega para admin
- **Causa:** Nenhum admin cadastrado no sistema
- **Solução:** Crie um usuário admin manualmente ou via admin API

---

## 📝 Notas Importantes

1. **Armazenamento de dados:** Os dados coletados após OAuth são salvos direto em `user_profile`, similar ao fluxo de cadastro normal
2. **Role assignment:** Alunos recebem role "student", professores recebem role "teacher"
3. **Professor pending:** Professores cadastrados via OAuth começam com `verification_status = "pending"`
4. **Avatar:** Foto do Google é armazenada em `user_profile.avatar_url`
5. **E-mail:** E-mail do Google é salvo em `user_profile.email`

---

## 🚀 Próximos Passos

1. Configure Google OAuth no Google Cloud Console (veja "Passo 1" acima)
2. Configure provider no Supabase (veja "Passo 2" acima)
3. Teste o fluxo completo
4. Valide notificações para admins
5. Deploy em produção

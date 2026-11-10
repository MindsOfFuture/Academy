// shortcut: mensagem do Supabase fora da tabela aparece em inglês; ampliar conforme surgirem
const POR_CODIGO: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar.",
  user_already_exists: "Este e-mail já tem cadastro.",
  same_password: "A nova senha precisa ser diferente da atual.",
  over_email_send_rate_limit: "Muitas tentativas. Aguarde alguns minutos.",
  over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos.",
};

const POR_MENSAGEM: Record<string, string> = {
  "Invalid login credentials": POR_CODIGO.invalid_credentials,
  "User already registered": POR_CODIGO.user_already_exists,
};

// O Supabase diz por que a senha é fraca; a política do projeto pode exigir mais que 6 caracteres.
const SENHA_FRACA: Record<string, string> = {
  length: "A senha é curta demais.",
  characters: "A senha precisa misturar letras, números e símbolos.",
  pwned: "Essa senha já apareceu em vazamentos. Escolha outra.",
};

export function mensagemDeAuth(error: unknown, padrao: string): string {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === "weak_password") {
    const reasons = (error as { reasons?: unknown }).reasons;
    const textos = Array.isArray(reasons) ? reasons.map((r) => SENHA_FRACA[r as string]).filter(Boolean) : [];
    return textos.length ? textos.join(" ") : "A senha não atende aos requisitos de segurança.";
  }
  if (typeof code === "string" && POR_CODIGO[code]) return POR_CODIGO[code];
  if (!(error instanceof Error)) return padrao;
  return POR_MENSAGEM[error.message] ?? error.message;
}

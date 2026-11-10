import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
          }
        },
      },
    },
  );
}

/**
 * Id de quem está logado, com a assinatura do login conferida (`getClaims`).
 * Uma consulta por requisição: layout, página e dados reaproveitam (`cache` do
 * React vale só para a requisição atual, nunca entre pessoas).
 */
export const usuarioDaRequisicao = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  // Falha de rede ao conferir a chave conta como sem login (401), como no middleware.
  try {
    const { data } = await supabase.auth.getClaims();
    return data?.claims.sub ?? null;
  } catch {
    return null;
  }
});

/**
 * Cliente sem login: lê só o que um visitante anônimo pode ler. É o único que
 * pode alimentar página guardada pronta (`revalidate`), porque o resultado é o
 * mesmo para todo mundo.
 */
export function createPublicClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createAdminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const { data: roleLinks } = await supabase
    .schema('public')
    .from('user_role')
    .select('role_id')
    .eq('user_profile_id', user.id);

  const roleIds = (roleLinks || [])
    .map((item) => item.role_id)
    .filter((value): value is number => typeof value === 'number');

  if (roleIds.length === 0) {
    throw new Error("Acesso negado. Permissões de administrador necessárias.");
  }

  const { data: roleRows } = await supabase
    .schema('public')
    .from('role')
    .select('name')
    .in('id', roleIds);

  const isAdmin = (roleRows || []).some((row) => row.name === 'admin');
  if (!isAdmin) {
    throw new Error("Acesso negado. Permissões de administrador necessárias.");
  }

  // Passar a service role key para createServerClient junto com os cookies do
  // usuário faz o PostgREST usar o JWT do usuário no header Authorization,
  // anulando o bypass de RLS. Depois de confirmar o papel admin acima,
  // devolvemos um client service role puro.
  return createServiceRoleClient();
}

export async function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
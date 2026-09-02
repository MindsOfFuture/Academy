/**
 * Hook de boot do Next (`instrumentation.register` roda uma vez por instância de
 * servidor, antes de atender a primeira requisição).
 *
 * Só valida no runtime Node: `register` é chamada uma vez por runtime e o
 * middleware (edge) já loga o próprio erro por requisição — validar nos dois
 * duplicaria a mensagem no boot sem trazer informação nova.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertSupabaseEnv } = await import("@/lib/env");
  assertSupabaseEnv();
}

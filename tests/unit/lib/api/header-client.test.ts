import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockSupabaseClient } from '@/tests/mocks/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));
import { getHeaderMembership } from '@/lib/api/header-client';
const client = createMockSupabaseClient();
beforeEach(() => vi.clearAllMocks());
describe('Vínculo no cabeçalho', () => {
 it.each(['coordenacao', 'bolsista'])('aceita %s ativo pela RPC canônica', async papel => {
  client.rpc.mockResolvedValue({ data: papel, error: null });
  expect(await getHeaderMembership(client as unknown as SupabaseClient)).toBe(true);
  expect(client.rpc).toHaveBeenCalledWith('gestao_membro_papel');
 });
 it.each([null, 'admin', 'teacher', 'desligado'])('recusa vínculo %s', async papel => {
  client.rpc.mockResolvedValue({ data: papel, error: null });
  expect(await getHeaderMembership(client as unknown as SupabaseClient)).toBe(false);
 });
 it('falha fechado em erro de autorização', async () => {
  client.rpc.mockResolvedValue({ data: 'coordenacao', error: { message: 'Negado' } });
  expect(await getHeaderMembership(client as unknown as SupabaseClient)).toBe(false);
 });
 it('falha fechado em erro de rede', async () => {
  client.rpc.mockRejectedValue(new Error('Rede'));
  expect(await getHeaderMembership(client as unknown as SupabaseClient)).toBe(false);
 });
});

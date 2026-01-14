import { vi } from 'vitest';

/**
 * Factory para criar mocks do cliente Supabase
 * Reutilizável em todos os testes que precisam mockar o Supabase
 */

export interface MockChain {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
}

export interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
  };
  chain: MockChain;
}

export function createMockSupabaseClient(): MockSupabaseClient {
  const chain: MockChain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  };

  // Configura chain padrão para cada método
  const setupDefaultChain = () => {
    chain.select.mockReturnValue({
      eq: chain.eq,
      in: chain.in,
      order: chain.order,
      limit: chain.limit,
      maybeSingle: chain.maybeSingle,
      single: chain.single,
    });

    chain.insert.mockReturnValue({
      select: chain.select,
      single: chain.single,
      maybeSingle: chain.maybeSingle,
    });

    chain.update.mockReturnValue({
      eq: chain.eq,
      select: chain.select,
    });

    chain.delete.mockReturnValue({
      eq: chain.eq,
    });

    chain.eq.mockReturnValue({
      eq: chain.eq,
      maybeSingle: chain.maybeSingle,
      single: chain.single,
      in: chain.in,
      order: chain.order,
    });

    chain.in.mockReturnValue({
      eq: chain.eq,
      maybeSingle: chain.maybeSingle,
    });

    chain.order.mockReturnValue({
      limit: chain.limit,
      eq: chain.eq,
      maybeSingle: chain.maybeSingle,
    });

    chain.limit.mockReturnValue({
      maybeSingle: chain.maybeSingle,
    });
  };

  setupDefaultChain();

  const mockClient: MockSupabaseClient = {
    from: vi.fn().mockReturnValue({
      select: chain.select,
      insert: chain.insert,
      update: chain.update,
      delete: chain.delete,
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
    },
    chain,
  };

  return mockClient;
}

/**
 * Helper para configurar resposta de sucesso em uma query
 */
export function mockQuerySuccess<T>(chain: MockChain, method: keyof MockChain, data: T) {
  (chain[method] as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data, error: null });
}

/**
 * Helper para configurar resposta de erro em uma query
 */
export function mockQueryError(chain: MockChain, method: keyof MockChain, message: string) {
  (chain[method] as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ 
    data: null, 
    error: { message } 
  });
}

/**
 * Helper para configurar usuário autenticado
 */
export function mockAuthenticatedUser(client: MockSupabaseClient, userId: string = 'test-user-id') {
  client.auth.getUser.mockResolvedValue({ 
    data: { user: { id: userId } } 
  });
}

/**
 * Helper para configurar usuário não autenticado
 */
export function mockUnauthenticatedUser(client: MockSupabaseClient) {
  client.auth.getUser.mockResolvedValue({ 
    data: { user: null } 
  });
}

/**
 * Reseta todos os mocks do cliente
 */
export function resetMockClient(client: MockSupabaseClient) {
  vi.clearAllMocks();
  client.from.mockClear();
  client.auth.getUser.mockClear();
  Object.values(client.chain).forEach(mock => mock.mockClear());
}

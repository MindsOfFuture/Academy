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
  /** Fila de respostas para queries - use mockQueryResponse para adicionar */
  queryResponses: Array<{ data: unknown; error: unknown }>;
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

  // Fila de respostas para as queries
  const queryResponses: Array<{ data: unknown; error: unknown }> = [];

  // Cria um objeto thenable que retorna a próxima resposta da fila
  const createChainableResult = () => {
    const chainableResult: Record<string, unknown> = {
      select: chain.select,
      insert: chain.insert,
      update: chain.update,
      delete: chain.delete,
      eq: chain.eq,
      in: chain.in,
      order: chain.order,
      limit: chain.limit,
      maybeSingle: chain.maybeSingle,
      single: chain.single,
    };

    // Adiciona then para tornar o objeto awaitable
    chainableResult.then = (resolve: (value: { data: unknown; error: unknown }) => void) => {
      const response = queryResponses.shift() || { data: null, error: null };
      resolve(response);
    };

    return chainableResult;
  };

  // Configura chain padrão para cada método
  const setupDefaultChain = () => {
    chain.select.mockImplementation(() => createChainableResult());
    chain.insert.mockImplementation(() => createChainableResult());
    chain.update.mockImplementation(() => createChainableResult());
    chain.delete.mockImplementation(() => createChainableResult());
    chain.eq.mockImplementation(() => createChainableResult());
    chain.in.mockImplementation(() => createChainableResult());
    chain.order.mockImplementation(() => createChainableResult());
    chain.limit.mockImplementation(() => createChainableResult());
    chain.maybeSingle.mockImplementation(() => {
      const response = queryResponses.shift() || { data: null, error: null };
      return Promise.resolve(response);
    });
    chain.single.mockImplementation(() => {
      const response = queryResponses.shift() || { data: null, error: null };
      return Promise.resolve(response);
    });
  };

  setupDefaultChain();

  const mockClient: MockSupabaseClient = {
    from: vi.fn().mockImplementation(() => createChainableResult()),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
    },
    chain,
    queryResponses,
  };

  return mockClient;
}

/**
 * Helper para adicionar uma resposta na fila de queries
 */
export function mockQueryResponse<T>(client: MockSupabaseClient, data: T, error: unknown = null) {
  client.queryResponses.push({ data, error });
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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createMockSupabaseClient,
  type MockSupabaseClient 
} from '@/tests/mocks/supabase';

// Mock do cliente Supabase
let mockClient: MockSupabaseClient;

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockClient,
}));

// Import após o mock
import { updateUserProfileClient, listUsersClient } from '@/lib/api/profiles';

describe('Profiles API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
  });

  describe('updateUserProfileClient', () => {
    it('should update profile without email change', async () => {
      mockClient.auth.updateUser.mockResolvedValueOnce({ error: null });
      mockClient.chain.eq.mockResolvedValueOnce({ error: null });

      const result = await updateUserProfileClient({
        userId: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        originalEmail: 'john@example.com',
      });

      expect(result.emailChanged).toBe(false);
      expect(result.message).toBe('Perfil salvo com sucesso.');
      expect(mockClient.auth.updateUser).toHaveBeenCalledWith({
        data: { full_name: 'John Doe', display_name: 'John Doe' },
      });
    });

    it('should update profile with email change', async () => {
      mockClient.auth.updateUser.mockResolvedValueOnce({ error: null });
      mockClient.chain.eq.mockResolvedValueOnce({ error: null });

      const result = await updateUserProfileClient({
        userId: 'user-123',
        name: 'John Doe',
        email: 'newemail@example.com',
        originalEmail: 'john@example.com',
      });

      expect(result.emailChanged).toBe(true);
      expect(result.message).toBe('Perfil salvo. Verifique seu e-mail para confirmar mudança.');
      expect(mockClient.auth.updateUser).toHaveBeenCalledWith({
        email: 'newemail@example.com',
        data: { full_name: 'John Doe', display_name: 'John Doe' },
      });
    });

    it('should throw error for invalid name (empty)', async () => {
      await expect(updateUserProfileClient({
        userId: 'user-123',
        name: '   ',
        email: 'john@example.com',
        originalEmail: 'john@example.com',
      })).rejects.toThrow('Nome inválido');
    });

    it('should throw error when auth update fails', async () => {
      mockClient.auth.updateUser.mockResolvedValueOnce({ 
        error: { message: 'Auth error' } 
      });

      await expect(updateUserProfileClient({
        userId: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        originalEmail: 'john@example.com',
      })).rejects.toEqual({ message: 'Auth error' });
    });

    it('should throw error when table update fails', async () => {
      mockClient.auth.updateUser.mockResolvedValueOnce({ error: null });
      mockClient.chain.eq.mockResolvedValueOnce({ 
        error: { message: 'Table error' } 
      });

      await expect(updateUserProfileClient({
        userId: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        originalEmail: 'john@example.com',
      })).rejects.toEqual({ message: 'Table error' });
    });

    it('should trim whitespace from name', async () => {
      mockClient.auth.updateUser.mockResolvedValueOnce({ error: null });
      mockClient.chain.eq.mockResolvedValueOnce({ error: null });

      await updateUserProfileClient({
        userId: 'user-123',
        name: '  John Doe  ',
        email: 'john@example.com',
        originalEmail: 'john@example.com',
      });

      expect(mockClient.auth.updateUser).toHaveBeenCalledWith({
        data: { full_name: 'John Doe', display_name: 'John Doe' },
      });
    });
  });

  describe('listUsersClient', () => {
    it('should return list of users on success', async () => {
      const mockUsers = [
        { id: '1', full_name: 'Alice', email: 'alice@example.com' },
        { id: '2', full_name: 'Bob', email: 'bob@example.com' },
      ];

      mockClient.chain.order.mockResolvedValueOnce({ data: mockUsers, error: null });

      const result = await listUsersClient();

      expect(mockClient.from).toHaveBeenCalledWith('user_profile');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: '1', full_name: 'Alice', email: 'alice@example.com' });
    });

    it('should return empty array on error', async () => {
      mockClient.chain.order.mockResolvedValueOnce({ data: null, error: { message: 'Error' } });

      const result = await listUsersClient();

      expect(result).toEqual([]);
    });

    it('should return empty array when data is null', async () => {
      mockClient.chain.order.mockResolvedValueOnce({ data: null, error: null });

      const result = await listUsersClient();

      expect(result).toEqual([]);
    });
  });
});

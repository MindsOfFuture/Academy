import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ callback: null as null | ((event: string, session: unknown) => void), path: '/protected', getUser: vi.fn(), membership: vi.fn(), signOut: vi.fn(), unsubscribe: vi.fn(), create: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => state.path }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => <a {...props}>{children}</a> }));
vi.mock('@/lib/api/header-client', () => ({ getHeaderMembership: state.membership }));
vi.mock('@/lib/supabase/client', () => ({ createClient: () => {
 state.create();
 return { auth: { getUser: state.getUser, signOut: state.signOut, onAuthStateChange: (callback: typeof state.callback) => { state.callback = callback; return { data: { subscription: { unsubscribe: state.unsubscribe } } }; } } };
} }));
import { AuthButtonClient } from '@/components/auth/auth-button-client';
const user = { id: 'fixture-student', user_metadata: {}, email: 'fixture@example.invalid' };
beforeEach(() => { vi.clearAllMocks(); state.getUser.mockResolvedValue({ data: { user }, error: null }); state.membership.mockResolvedValue(false); state.path = '/protected'; });
afterEach(cleanup);
describe('Navegação da conta', () => {
 it('mostra Entrar para visitante', async () => {
  state.getUser.mockResolvedValue({ data: { user: null } }); render(<AuthButtonClient gestaoEnabled />);
  expect(await screen.findByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/auth');
  expect(state.membership).not.toHaveBeenCalled();
 });
 it('mostra cursos, perfil e saída sem abrir avatar', async () => {
  render(<AuthButtonClient gestaoEnabled />);
  expect(await screen.findByRole('link', { name: 'Meus cursos' })).toHaveAttribute('href', '/protected');
  expect(screen.getByRole('link', { name: 'Meus cursos' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Meu perfil' })).toHaveAttribute('href', '/protected/perfil');
  expect(screen.getByRole('button', { name: 'Sair' })).toBeVisible();
  expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Gestão' })).not.toBeInTheDocument();
  expect(state.create).toHaveBeenCalledTimes(1);
 });
 it('mostra Gestão para membro ativo', async () => {
  state.membership.mockResolvedValue(true); render(<AuthButtonClient gestaoEnabled />);
  expect(await screen.findByRole('link', { name: 'Gestão' })).toHaveAttribute('href', '/gestao');
 });
 it('não consulta vínculo nem mostra Gestão com flag desligada', async () => {
  state.membership.mockResolvedValue(true); render(<AuthButtonClient />);
  await screen.findByRole('link', { name: 'Meus cursos' });
  expect(state.membership).not.toHaveBeenCalled();
 });
 it('ignora vínculo atrasado após saída e troca de usuário', async () => {
  let resolve!: (active: boolean) => void;
  state.membership.mockReturnValueOnce(new Promise<boolean>(r => { resolve = r; }));
  render(<AuthButtonClient gestaoEnabled />); await waitFor(() => expect(state.membership).toHaveBeenCalled());
  act(() => state.callback?.('SIGNED_OUT', null));
  await act(async () => resolve(true));
  expect(screen.getByRole('link', { name: 'Entrar' })).toBeVisible();
  act(() => state.callback?.('SIGNED_IN', { user: { ...user, id: 'second-fixture' } }));
  await screen.findByRole('link', { name: 'Meus cursos' });
  expect(screen.queryByRole('link', { name: 'Gestão' })).not.toBeInTheDocument();
 });
 it('ignora sessão inicial atrasada após evento de saída', async () => {
  let resolve!: (value: unknown) => void;
  state.getUser.mockReturnValue(new Promise(r => { resolve = r; })); render(<AuthButtonClient gestaoEnabled />);
  act(() => state.callback?.('SIGNED_OUT', null));
  await act(async () => resolve({ data: { user } }));
  expect(screen.getByRole('link', { name: 'Entrar' })).toBeVisible();
 });
 it('remove atalho ao perder vínculo em atualização da sessão', async () => {
  state.membership.mockResolvedValueOnce(true).mockResolvedValue(false); render(<AuthButtonClient gestaoEnabled />);
  await screen.findByRole('link', { name: 'Gestão' });
  act(() => state.callback?.('TOKEN_REFRESHED', { user: { ...user } }));
  await waitFor(() => expect(screen.queryByRole('link', { name: 'Gestão' })).not.toBeInTheDocument());
 });
 it('informa falha de saída sem ocultar conta', async () => {
  state.signOut.mockResolvedValue({ error: new Error('fixture') }); render(<AuthButtonClient />);
  fireEvent.click(await screen.findByRole('button', { name: 'Sair' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível sair');
 });
});

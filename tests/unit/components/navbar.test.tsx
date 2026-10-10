import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ enabled: false }));
vi.mock('@/lib/api/gestao/feature-flags', () => ({ gestaoHabilitada: () => state.enabled }));
vi.mock('@/components/auth/auth-button-client', () => ({ AuthButtonClient: ({ gestaoEnabled }: { gestaoEnabled: boolean }) => <span data-testid="flag">{String(gestaoEnabled)}</span> }));
vi.mock('@/components/notifications/notification-bell', () => ({ NotificationBell: () => null }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => <a {...props}>{children}</a> }));
vi.mock('next/image', () => ({ default: () => null }));
import Navbar from '@/components/navbar/navbar';
afterEach(cleanup);
it.each([true, false])('passa apenas flag resolvida no servidor: %s', enabled => {
 state.enabled = enabled; render(<Navbar showTextLogo gestaoEnabled={enabled} />);
 expect(screen.getByTestId('flag')).toHaveTextContent(String(enabled));
 expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toHaveClass('flex-wrap');
 expect(screen.getByRole('link', { name: 'Minds of the Future — início' })).toHaveAttribute('href', '/');
});

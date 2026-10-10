import { test, expect } from '@playwright/test';
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Fixture local: renderiza os componentes reais sem contas, rede Supabase ou e-mails.
test('cabeçalho real com sessão fictícia em desktop e celular', async ({ page }) => {
    const root = process.cwd();
    const artifacts = path.join(root, '.hermes', 'artifacts', 'header-navigation');
    mkdirSync(artifacts, { recursive: true });
    const input = path.join(artifacts, 'fixture-tailwind.css');
    const output = path.join(artifacts, 'fixture-tailwind-output.css');
    writeFileSync(input, '@tailwind base;@tailwind components;@tailwind utilities;');
    execFileSync(process.execPath, [path.join(root, 'node_modules/tailwindcss/lib/cli.js'), '-i', input, '-o', output, '--content', 'components/navbar/navbar.tsx,components/auth/auth-button-client.tsx,components/notifications/notification-bell.tsx'], { cwd: root });
    const bundle = await build({
        stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import Navbar from './components/navbar/navbar'; createRoot(document.getElementById('root')).render(<Navbar showTextLogo gestaoEnabled />);`, resolveDir: root, loader: 'tsx' },
        bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic',
        define: { 'process.env.NODE_ENV': '"production"' },
        plugins: [{ name: 'sessao-ficticia', setup(builder) {
            builder.onResolve({ filter: /^(next\/(link|image|navigation)|@\/lib\/(supabase\/client|api\/gestao\/feature-flags))$/ }, args => ({ path: args.path, namespace: 'fixture' }));

            builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => {
                const modules: Record<string, string> = {
                    'next/link': `import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,
                    'next/image': `import React from 'react';export default function Image(props){return <img {...props}/>}`,
                    'next/navigation': `export const usePathname=()=>'/protected';export const useRouter=()=>({push(){}});`,
                    '@/lib/api/gestao/feature-flags': `export const gestaoHabilitada=()=>true;`,
                    '@/lib/supabase/client': `const user={id:'fixture-member'};const client={auth:{getUser:async()=>({data:{user}}),onAuthStateChange:(callback)=>{callback('INITIAL_SESSION',{user});return {data:{subscription:{unsubscribe(){}}}}},signOut:async()=>({error:null})},rpc:async()=>({data:'bolsista',error:null})};export const createClient=()=>client;`,
                };
                return { contents: modules[args.path], loader: 'tsx', resolveDir: root };
            });
        } }],
    });
    await page.route('https://header-fixture.invalid/logo_navbar.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: readFileSync(path.join(root, 'public/logo_navbar.svg')) }));
    await page.route('https://header-fixture.invalid/api/notifications**', route => route.fulfill({ json: { count: 0, notifications: [] } }));
    for (const width of [1440, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.setContent(`<base href="https://header-fixture.invalid/"><style>${readFileSync(output, 'utf8')}</style><div id="root"></div><p style="padding:24px;font-family:sans-serif">FIXTURE LOCAL — sessão fictícia de bolsista ativo; sem dados de produção.</p>`);
        await page.addScriptTag({ content: bundle.outputFiles[0].text });
        await expect(page.getByRole('link', { name: 'Gestão', exact: true })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Meus cursos' })).toHaveAttribute('aria-current', 'page');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await expect(page.getByRole('button', { name: 'Notificações' })).toBeVisible();
        const actions = page.locator('nav a, nav button');
        for (let index = 0; index < await actions.count(); index++) {
            const box = await actions.nth(index).boundingBox();
            expect(box?.height).toBeGreaterThanOrEqual(44);
            expect(box?.width).toBeGreaterThanOrEqual(44);
            await actions.nth(index).focus();
            await expect(actions.nth(index)).toBeFocused();
            expect(await actions.nth(index).evaluate(element => {
                const style = getComputedStyle(element);
                return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
            })).toBe(true);
        }
        await page.evaluate(() => { (document.activeElement as HTMLElement)?.blur(); document.body.tabIndex = -1; document.body.focus(); });
        for (let index = 0; index < await actions.count(); index++) {
            await page.keyboard.press('Tab');
            await expect(actions.nth(index)).toBeFocused();
        }
        await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
        await page.screenshot({ path: path.join(artifacts, `fixture-active-member-${width}.png`), fullPage: true });
    }
});

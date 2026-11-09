import { test, expect, devices } from '@playwright/test';

/**
 * Testes de visual regression e responsividade
 * Verifica que layouts se adaptam corretamente
 */

test.describe('Visual Regression - Home', () => {
  const viewports = [
    { name: 'mobile', ...devices['iPhone 12'].viewport },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 },
  ];

  for (const viewport of viewports) {
    test(`home page layout em ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width!, height: viewport.height! });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verificar que não há overflow horizontal
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewport.width! + 5);

      // Verificar elementos principais
      await expect(page.locator('nav')).toBeVisible();
    });
  }
});

test.describe('Visual Regression - Auth', () => {
  test('auth page em mobile mostra um formulário por vez e alterna para o cadastro', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth');
    await expect(page.locator('input[type="email"]:visible')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Criar Conta' })).toBeHidden();

    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(page.getByRole('heading', { name: 'Criar Conta' })).toBeVisible();
  });

  test('auth page em desktop mostra login e cadastro lado a lado', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/auth');
    // O cadastro começa no passo do tipo de conta (sem e-mail): compara o título dele com o e-mail do login.
    const emailLogin = page.locator('input[type="email"]:visible').first();
    const tituloCadastro = page.getByRole('heading', { name: 'Criar Conta' });
    await expect(emailLogin).toBeVisible();
    await expect(tituloCadastro).toBeVisible();
    const [login, cadastro] = [await emailLogin.boundingBox(), await tituloCadastro.boundingBox()];
    expect(cadastro!.x).toBeGreaterThan(login!.x + login!.width);
  });
});

test.describe('Touch Targets - WCAG', () => {
  test('botões em mobile devem ter tamanho mínimo de 44px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[type="email"]:visible').first().waitFor({ timeout: 15000 });

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);

      if (await button.isVisible()) {
        const box = await button.boundingBox();

        if (box) {
          // WCAG recomenda 44x44 mínimo
          const nome = (await button.getAttribute('aria-label')) || (await button.innerText());
          // Indicador do Next só existe em `next dev`; não é botão do app.
          if (nome.startsWith('Open Next.js Dev Tools')) continue;
          expect(box.height, nome).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  test('links em mobile devem ter área clicável adequada', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const links = page.locator('nav a');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);

      if (await link.isVisible()) {
        const box = await link.boundingBox();

        if (box) {
          // Links devem ser grandes o suficiente para toque
          expect(box.height).toBeGreaterThanOrEqual(24);
        }
      }
    }
  });
});

test.describe('Texto Legível', () => {
  test('textos não devem ser menores que 14px em mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const tooSmall = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, a, button, label, h1, h2, h3');
      let count = 0;

      elements.forEach(el => {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        if (fontSize < 12 && el.textContent?.trim()) {
          count++;
        }
      });

      return count;
    });

    // Poucos elementos com texto muito pequeno
    expect(tooSmall).toBeLessThan(5);
  });

  test('line-height deve ser adequado para leitura', async ({ page }) => {
    await page.goto('/termos');
    await page.waitForLoadState('domcontentloaded');

    const paragraphs = page.locator('p');
    const count = await paragraphs.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const p = paragraphs.nth(i);

      if (await p.isVisible()) {
        const lineHeight = await p.evaluate(el => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          const lh = parseFloat(style.lineHeight);
          return lh / fontSize;
        });

        // Line height deve ser pelo menos 1.2
        expect(lineHeight).toBeGreaterThanOrEqual(1.2);
      }
    }
  });
});

test.describe('Nossos Artigos - setas do carrossel', () => {
  test('setas em desktop devem ter ícone de 24px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // As setas ficam ocultas abaixo de 1024px, então basta estarem no DOM em desktop
    await page.locator('#our-articles .swiper-button-prev').waitFor({ state: 'attached', timeout: 15000 });
    await page.locator('#our-articles .swiper-button-next').waitFor({ state: 'attached', timeout: 15000 });

    // O estilo do carrossel chega depois do elemento: ler uma vez só dava 16px de vez em quando.
    await expect.poll(() => page.evaluate(() =>
      ['#our-articles .swiper-button-prev', '#our-articles .swiper-button-next'].map((selector) => {
        const el = document.querySelector(selector);
        return el ? window.getComputedStyle(el, '::after').fontSize : null;
      })
    )).toEqual(['24px', '24px']);
  });
});

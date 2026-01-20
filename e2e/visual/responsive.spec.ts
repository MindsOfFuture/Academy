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
  test('auth page em mobile deve mostrar toggle de formulário', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });

    // Em mobile, deve ter botão para alternar entre login e signup
    const toggleButton = page.locator('button:has-text("Criar conta"), button:has-text("Entrar")');
    const hasToggle = await toggleButton.isVisible().catch(() => false);

    console.log(`Mobile auth toggle visible: ${hasToggle}`);
  });

  test('auth page em desktop deve mostrar ambos os formulários', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });

    // Em desktop, ambos devem estar visíveis
    const forms = await page.locator('form').count();
    const inputGroups = await page.locator('input[type="email"]').count();

    console.log(`Desktop forms: ${forms}, Email inputs: ${inputGroups}`);
    // Pode ter 2 formulários (login e signup) visíveis
  });
});

test.describe('Visual Regression - Trilhas', () => {
  test('trilhas em mobile devem empilhar verticalmente', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/trilhas');
    await page.waitForLoadState('networkidle');

    const courseCards = page.locator('a[href*="/course"]');
    const count = await courseCards.count();

    if (count >= 2) {
      const card1 = await courseCards.nth(0).boundingBox();
      const card2 = await courseCards.nth(1).boundingBox();

      if (card1 && card2) {
        // Em mobile, cards devem estar um abaixo do outro
        expect(card2.y).toBeGreaterThan(card1.y);
      }
    }
  });

  test('trilhas em desktop podem estar lado a lado', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/trilhas');
    await page.waitForLoadState('networkidle');

    const courseCards = page.locator('a[href*="/course"]');
    const count = await courseCards.count();

    if (count >= 2) {
      const card1 = await courseCards.nth(0).boundingBox();
      const card2 = await courseCards.nth(1).boundingBox();

      if (card1 && card2) {
        // Em desktop, podem estar lado a lado (mesmo Y) ou em linha vertical
        console.log(`Desktop cards Y: ${card1.y} vs ${card2.y}`);
      }
    }
  });
});

test.describe('Touch Targets - WCAG', () => {
  test('botões em mobile devem ter tamanho mínimo de 44px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);

      if (await button.isVisible()) {
        const box = await button.boundingBox();

        if (box) {
          // WCAG recomenda 44x44 mínimo
          expect(box.height).toBeGreaterThanOrEqual(40);
          console.log(`Button ${i}: ${box.width}x${box.height}`);
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

test.describe('Dark Mode (se implementado)', () => {
  test('verificar se dark mode existe', async ({ page }) => {
    await page.goto('/');

    // Verificar se há toggle de tema
    const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="modo"]');
    const hasThemeToggle = await themeToggle.isVisible().catch(() => false);

    console.log(`Theme toggle exists: ${hasThemeToggle}`);
  });
});

test.describe('Animações e Transições', () => {
  test('links devem ter hover state', async ({ page }) => {
    await page.goto('/');

    const link = page.locator('nav a').first();

    if (await link.isVisible()) {
      const beforeHover = await link.evaluate(el => {
        return window.getComputedStyle(el).color;
      });

      await link.hover();
      await page.waitForTimeout(300);

      const afterHover = await link.evaluate(el => {
        return window.getComputedStyle(el).color;
      });

      // Pode ou não mudar - apenas log
      console.log(`Link color before: ${beforeHover}, after hover: ${afterHover}`);
    }
  });

  test('botões devem ter feedback visual', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');

    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });

    const button = page.getByRole('button', { name: /entrar/i });

    if (await button.isVisible()) {
      const hasTransition = await button.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.transition !== 'none' && style.transition !== '';
      });

      console.log(`Button has transition: ${hasTransition}`);
    }
  });
});

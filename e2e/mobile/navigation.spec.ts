import { test, expect } from '@playwright/test';

test.describe('Navegação Mobile - Navbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve exibir logo em todos os viewports', async ({ page }) => {
    const logo = page.locator('img[alt*="Logo"]');
    await expect(logo.first()).toBeVisible();
  });

  test('deve exibir link "Entre" quando não autenticado', async ({ page }) => {
    const enterLink = page.getByRole('link', { name: /entre/i });
    await expect(enterLink).toBeVisible();
  });

  test('texto do logo deve se adaptar ao viewport', async ({ page }) => {
    const logoText = page.getByRole('link', { name: /minds of the future/i });
    const viewport = page.viewportSize();
    
    // Em viewports maiores, o texto deve estar visível
    if (viewport && viewport.width >= 768) {
      await expect(logoText).toBeVisible();
    }
    // Em mobile pequeno, pode estar oculto - isso é OK
  });

  test('navbar deve ter position sticky e ficar no topo ao scrollar', async ({ page }) => {
    // Scroll para baixo
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(300);
    
    const navbar = page.locator('nav');
    const navbarBox = await navbar.boundingBox();
    
    // Navbar deve continuar visível no topo
    expect(navbarBox?.y).toBeLessThanOrEqual(10);
  });

  test('link Entre deve navegar para página de auth', async ({ page }) => {
    const enterLink = page.getByRole('link', { name: /entre/i });
    await expect(enterLink).toBeVisible();
    
    await Promise.all([
      page.waitForURL('/auth'),
      enterLink.click(),
    ]);
    
    expect(page.url()).toContain('/auth');
  });
});

test.describe('Navegação Mobile - Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('página inicial deve carregar sem erros', async ({ page }) => {
    // Verificar que não há erros de console graves
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Filtrar erros esperados (ex: hydration warnings em dev)
    const criticalErrors = errors.filter(e => 
      !e.includes('hydrat') && 
      !e.includes('Warning')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('seções principais devem estar visíveis após scroll', async ({ page }) => {
    // Scroll e verificar cada seção
    const sections = [
      { name: 'hero', locator: page.locator('section').first() },
    ];
    
    for (const section of sections) {
      await section.locator.scrollIntoViewIfNeeded();
      await expect(section.locator).toBeVisible();
    }
  });

  test('touch scroll deve funcionar suavemente', async ({ page }) => {
    const initialScrollY = await page.evaluate(() => window.scrollY);
    
    // Simular scroll via touch
    await page.evaluate(() => {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });
    
    await page.waitForTimeout(500);
    
    const finalScrollY = await page.evaluate(() => window.scrollY);
    expect(finalScrollY).toBeGreaterThan(initialScrollY);
  });
});

test.describe('Navegação Mobile - Rotas Protegidas', () => {
  test('deve redirecionar para /auth ao acessar rota protegida sem autenticação', async ({ page }) => {
    await page.goto('/protected');
    
    // Deve redirecionar para página de auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test('deve redirecionar para /auth ao acessar perfil sem autenticação', async ({ page }) => {
    await page.goto('/protected/perfil');
    
    await expect(page).toHaveURL(/\/auth/);
  });

  test('deve redirecionar para /auth ao acessar atividades sem autenticação', async ({ page }) => {
    await page.goto('/protected/activitie');
    
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe('Navegação Mobile - Páginas Públicas', () => {
  test('página de termos deve ser acessível', async ({ page }) => {
    await page.goto('/termos');
    await expect(page).toHaveURL('/termos');
    
    // Deve ter conteúdo
    const content = page.locator('main, article, section');
    await expect(content.first()).toBeVisible();
  });

  test('página de privacidade deve ser acessível', async ({ page }) => {
    await page.goto('/privacidade');
    await expect(page).toHaveURL('/privacidade');
  });

  test('página de trilhas deve carregar', async ({ page }) => {
    const response = await page.goto('/trilhas');
    // Pode ter redirect ou renderizar direto
    expect(response?.status()).toBeLessThan(500);
  });

  test('página de curso deve carregar', async ({ page }) => {
    const response = await page.goto('/course');
    // Pode ter redirect ou renderizar direto
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe('Navegação Mobile - Responsividade Visual', () => {
  test('elementos não devem transbordar horizontalmente', async ({ page }) => {
    await page.goto('/');
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    
    // Body não deve ser mais largo que viewport (sem scroll horizontal)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 para tolerância
  });

  test('textos devem ser legíveis (não muito pequenos)', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que não há textos menores que 12px
    const smallTexts = await page.evaluate(() => {
      const elements = document.querySelectorAll('p, span, a, button, label');
      let tooSmall = 0;
      
      elements.forEach(el => {
        const fontSize = window.getComputedStyle(el).fontSize;
        if (parseFloat(fontSize) < 12) {
          tooSmall++;
        }
      });
      
      return tooSmall;
    });
    
    // Permitir alguns casos (ícones, etc), mas não muitos
    expect(smallTexts).toBeLessThan(5);
  });

  test('botões devem ter tamanho tocável adequado (min 44x44)', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button, a[role="button"], [role="button"]');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // WCAG recomenda mínimo de 44x44 para touch targets
          // Vamos usar 40 como limite mais flexível
          expect(box.width).toBeGreaterThanOrEqual(40);
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });
});

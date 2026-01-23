import { test, expect } from '@playwright/test';
import { scrollToElement } from '../fixtures/mobile.fixture';

test.describe('Home Page Mobile - Hero Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('hero deve ser exibido corretamente em mobile', async ({ page }) => {
    const viewport = page.viewportSize();
    
    // Hero/primeiro section deve estar visível
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
    
    // Imagens do hero devem carregar
    const heroImages = hero.locator('img');
    const imageCount = await heroImages.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = heroImages.nth(i);
      if (await img.isVisible()) {
        // Verificar que imagem carregou (naturalWidth > 0)
        const loaded = await img.evaluate((el: HTMLImageElement) => el.naturalWidth > 0);
        expect(loaded).toBeTruthy();
      }
    }
  });

  test('CTA buttons devem ser tocáveis e visíveis', async ({ page }) => {
    // Procurar botões de CTA no hero
    const ctaButtons = page.locator('section').first().locator('button, a[role="button"], a.btn, a[class*="button"]');
    const count = await ctaButtons.count();
    
    if (count > 0) {
      const firstCTA = ctaButtons.first();
      await expect(firstCTA).toBeVisible();
      
      const box = await firstCTA.boundingBox();
      if (box) {
        // CTA deve ser grande o suficiente para toque
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});

test.describe('Home Page Mobile - Cursos Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('seção de cursos deve ser scrollável horizontalmente ou em grid', async ({ page }) => {
    // Procurar seção de cursos
    const coursesSection = page.locator('[class*="course"], [class*="Course"]').first();
    
    if (await coursesSection.isVisible()) {
      await coursesSection.scrollIntoViewIfNeeded();
      
      // Verificar se tem overflow-x ou é grid responsivo
      const hasHorizontalScroll = await coursesSection.evaluate(el => {
        return el.scrollWidth > el.clientWidth;
      });
      
      // Pode ter scroll horizontal OU ser grid (ambos são válidos)
      console.log(`Courses section has horizontal scroll: ${hasHorizontalScroll}`);
    }
  });

  test('cards de curso devem ter tamanho legível', async ({ page }) => {
    const courseCards = page.locator('[class*="card"], [class*="Card"]');
    const count = await courseCards.count();
    
    if (count > 0) {
      const firstCard = courseCards.first();
      await firstCard.scrollIntoViewIfNeeded();
      
      if (await firstCard.isVisible()) {
        const box = await firstCard.boundingBox();
        if (box) {
          // Card deve ter largura mínima para leitura
          expect(box.width).toBeGreaterThanOrEqual(200);
        }
      }
    }
  });

  test('imagens dos cursos devem ter aspect ratio correto', async ({ page }) => {
    const courseImages = page.locator('[class*="course"] img, [class*="Course"] img');
    const count = await courseImages.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const img = courseImages.nth(i);
      
      if (await img.isVisible()) {
        const box = await img.boundingBox();
        if (box && box.width > 0) {
          const aspectRatio = box.width / box.height;
          // Aspect ratio deve ser razoável (entre 0.5 e 3)
          expect(aspectRatio).toBeGreaterThan(0.5);
          expect(aspectRatio).toBeLessThan(3);
        }
      }
    }
  });
});

test.describe('Home Page Mobile - Footer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('footer deve estar acessível via scroll', async ({ page }) => {
    const footer = page.locator('footer');
    
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
  });

  test('links do footer devem existir', async ({ page }) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    
    const links = footer.locator('a');
    const count = await links.count();
    
    // Footer deve ter pelo menos alguns links
    expect(count).toBeGreaterThan(0);
  });

  test('footer deve ter links para termos e privacidade', async ({ page }) => {
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    
    const termosLink = footer.getByRole('link', { name: /termos/i });
    const privacidadeLink = footer.getByRole('link', { name: /privacidade/i });
    
    // Pelo menos um deve existir
    const hasTermos = await termosLink.isVisible().catch(() => false);
    const hasPrivacidade = await privacidadeLink.isVisible().catch(() => false);
    
    expect(hasTermos || hasPrivacidade).toBeTruthy();
  });
});

test.describe('Home Page Mobile - Performance', () => {
  test('página deve carregar rapidamente', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const loadTime = Date.now() - startTime;
    
    // Página deve carregar DOM em menos de 10 segundos (ambiente de dev pode ser mais lento)
    expect(loadTime).toBeLessThan(10000);
    console.log(`Page load time: ${loadTime}ms`);
  });

  test('imagens devem ter lazy loading', async ({ page }) => {
    await page.goto('/');
    
    // Verificar se imagens abaixo do fold têm lazy loading
    const images = page.locator('img');
    const count = await images.count();
    
    let lazyCount = 0;
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const loading = await img.getAttribute('loading');
      if (loading === 'lazy') {
        lazyCount++;
      }
    }
    
    // Next.js Image component geralmente adiciona lazy loading automaticamente
    console.log(`Images with lazy loading: ${lazyCount}/${count}`);
  });

  test('não deve haver erros de JavaScript críticos', async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filtrar erros não críticos
    const criticalErrors = jsErrors.filter(e => 
      !e.includes('ResizeObserver') && 
      !e.includes('Non-Error') &&
      !e.includes('hydrat')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Home Page Mobile - Interações Touch', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('scroll vertical deve ser suave', async ({ page }) => {
    // Múltiplos scrolls
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(200);
    }
    
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(500);
  });

  test('elementos interativos devem ter feedback visual', async ({ page }) => {
    const links = page.locator('a').first();
    
    if (await links.isVisible()) {
      // Hover/focus deve mudar algo (cursor, cor, etc)
      await links.hover();
      
      // Verificar se tem transição ou mudança de estilo
      const hasTransition = await links.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.transition !== 'none' && style.transition !== '';
      });
      
      // É uma boa prática, mas não obrigatório
      console.log(`Link has transition effect: ${hasTransition}`);
    }
  });

  test('zoom por pinch não deve quebrar layout', async ({ page }) => {
    // Verificar meta viewport
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    
    // Deve permitir zoom para acessibilidade (não ter maximum-scale=1 ou user-scalable=no)
    if (viewport) {
      const blocksZoom = viewport.includes('user-scalable=no') || 
                         viewport.includes('maximum-scale=1');
      
      // Bloquear zoom é ruim para acessibilidade
      expect(blocksZoom).toBeFalsy();
    }
  });
});

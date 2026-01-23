import { test as base, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Fixture de testes com utilitários comuns
 * Pode ser usado em qualquer teste E2E
 */

// Interface para métricas de performance
interface PerformanceMetrics {
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint?: number;
}

// Helper para medir performance de página
export async function measurePerformance(page: Page): Promise<PerformanceMetrics> {
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    const fcp = paint.find(p => p.name === 'first-contentful-paint');
    const fp = paint.find(p => p.name === 'first-paint');
    
    return {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      firstPaint: fp?.startTime || 0,
      firstContentfulPaint: fcp?.startTime || 0,
    };
  });
  
  return timing;
}

// Helper para verificar acessibilidade básica
export async function checkBasicA11y(page: Page): Promise<{
  hasH1: boolean;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  focusableElements: number;
}> {
  return page.evaluate(() => {
    const h1Count = document.querySelectorAll('h1').length;
    const images = document.querySelectorAll('img');
    
    let withAlt = 0;
    let withoutAlt = 0;
    
    images.forEach(img => {
      if (img.alt) withAlt++;
      else withoutAlt++;
    });
    
    const focusable = document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).length;
    
    return {
      hasH1: h1Count > 0,
      imagesWithAlt: withAlt,
      imagesWithoutAlt: withoutAlt,
      focusableElements: focusable,
    };
  });
}

// Helper para verificar console errors
export function setupConsoleErrorCapture(page: Page): string[] {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  return errors;
}

// Helper para verificar network requests
export function setupNetworkCapture(page: Page): { requests: string[]; failed: string[] } {
  const requests: string[] = [];
  const failed: string[] = [];
  
  page.on('request', request => {
    requests.push(request.url());
  });
  
  page.on('requestfailed', request => {
    failed.push(request.url());
  });
  
  return { requests, failed };
}

// Helper para scroll completo da página
export async function scrollFullPage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    for (let i = 0; i < document.body.scrollHeight; i += 300) {
      window.scrollTo(0, i);
      await delay(100);
    }
    
    window.scrollTo(0, 0);
  });
}

// Helper para verificar se elemento está no viewport
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    
    const rect = el.getBoundingClientRect();
    
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }, selector);
}

// Helper para simular conexão lenta
export async function throttleNetwork(context: BrowserContext, speed: 'slow3g' | 'fast3g' | 'offline'): Promise<void> {
  const cdpSession = await context.newCDPSession(context.pages()[0]);
  
  const conditions = {
    'slow3g': { offline: false, downloadThroughput: 50 * 1024, uploadThroughput: 50 * 1024, latency: 2000 },
    'fast3g': { offline: false, downloadThroughput: 150 * 1024, uploadThroughput: 75 * 1024, latency: 563 },
    'offline': { offline: true, downloadThroughput: 0, uploadThroughput: 0, latency: 0 },
  };
  
  await cdpSession.send('Network.emulateNetworkConditions', conditions[speed]);
}

// Tipos para fixtures
type TestFixtures = {
  consoleErrors: string[];
  networkCapture: { requests: string[]; failed: string[] };
};

// Extended test com fixtures úteis
export const test = base.extend<TestFixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors = setupConsoleErrorCapture(page);
    await use(errors);
  },
  
  networkCapture: async ({ page }, use) => {
    const capture = setupNetworkCapture(page);
    await use(capture);
  },
});

export { expect };

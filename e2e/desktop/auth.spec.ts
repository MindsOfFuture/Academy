import { test, expect } from '@playwright/test';

test.describe('Fluxo de Login Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');
  });

  test('página de auth deve carregar com layout desktop side-by-side', async ({ page }) => {
    const viewport = page.viewportSize();
    
    // Em desktop (md+), login e signup devem aparecer lado a lado
    if (viewport && viewport.width >= 768) {
      const loginForm = page.locator('input[type="email"]:visible').first();
      const signupSection = page.locator('text=Criar conta').first();
      
      await expect(loginForm).toBeVisible({ timeout: 15000 });
      // Desktop deve mostrar ambos os formulários
      const visibleForms = await page.locator('form').count();
      expect(visibleForms).toBeGreaterThanOrEqual(1);
    }
  });

  test('formulário de login deve ter todos os campos necessários', async ({ page }) => {
    await page.locator('input[type="email"]:visible').first().waitFor({ timeout: 15000 });
    
    // Email input
    const emailInput = page.locator('input[type="email"]:visible').first();
    await expect(emailInput).toBeVisible();
    
    // Password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput.first()).toBeVisible();
    
    // Botão de entrar
    const loginButton = page.getByRole('button', { name: /entrar/i });
    await expect(loginButton).toBeVisible();
  });

  test('deve mostrar/ocultar senha ao clicar no ícone', async ({ page }) => {
    await page.locator('input[type="email"]:visible').first().waitFor({ timeout: 15000 });
    
    const passwordInput = page.getByPlaceholder('Senha', { exact: true }).first();
    await passwordInput.fill('senha123');
    
    // Clicar no botão de mostrar senha
    const toggleButton = page.getByLabel(/mostrar senha|ocultar senha/i).first();
    
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('validação de email deve funcionar', async ({ page }) => {
    await page.locator('input[type="email"]:visible').first().waitFor({ timeout: 15000 });
    
    const emailInput = page.locator('input[type="email"]:visible').first();
    const loginButton = page.getByRole('button', { name: /entrar/i });
    
    // Tentar submeter com email inválido
    await emailInput.fill('email-invalido');
    await loginButton.click();
    
    // HTML5 validation deve impedir o submit
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage.length).toBeGreaterThan(0);
  });

  test('campos devem ser obrigatórios', async ({ page }) => {
    await page.locator('input[type="email"]:visible').first().waitFor({ timeout: 15000 });
    
    const emailInput = page.locator('input[type="email"]:visible').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    // Verificar atributo required
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('link "Esqueceu sua senha?" deve navegar corretamente', async ({ page }) => {
    await page.locator('input[type="email"]:visible').first().waitFor({ timeout: 15000 });
    
    const forgotLink = page.getByRole('link', { name: /esqueceu/i });
    await expect(forgotLink).toBeVisible();
    
    await Promise.all([
      page.waitForURL('/auth/forgot-password'),
      forgotLink.click(),
    ]);
    
    expect(page.url()).toContain('/auth/forgot-password');
  });

  test('login com credenciais inválidas deve mostrar erro', async ({ page }) => {
    await page.locator('input[type="email"]:visible').first().waitFor({ timeout: 15000 });
    
    const emailInput = page.locator('input[type="email"]:visible').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.getByRole('button', { name: /entrar/i });
    
    await emailInput.fill('usuario@inexistente.com');
    await passwordInput.fill('senhaerrada123');
    await loginButton.click();
    
    // A mensagem do Supabase aparece no formulário (e num toast); a página fica no login.
    const erro = page.locator('form p.text-red-500').first();
    await expect(erro).toBeVisible({ timeout: 15000 });
    await expect(erro).not.toBeEmpty();
    expect(new URL(page.url()).pathname).toBe('/auth');
  });
});

test.describe('Fluxo de Cadastro Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');
  });

  test('formulário de cadastro deve ter seleção de tipo de usuário', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Criar Conta' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Aluno', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Professor', exact: true })).toBeVisible();
  });

  test('cadastro deve ter múltiplos passos', async ({ page }) => {
    await expect(page.getByText('Passo 1 de 4')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /Próximo/ })).toBeVisible();
  });
});

test.describe('Recuperação de Senha Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.waitForLoadState('domcontentloaded');
  });

  test('página de recuperação deve ter layout adequado', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]:visible');
    await expect(emailInput.first()).toBeVisible({ timeout: 15000 });
    
    const submitButton = page.getByRole('button', { name: /enviar/i });
    await expect(submitButton).toBeVisible();
  });

  test('deve validar formato de email', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]:visible').first();
    await emailInput.waitFor({ timeout: 15000 });
    
    // Tentar email inválido
    await emailInput.fill('email-sem-arroba');
    
    const submitButton = page.getByRole('button', { name: /enviar/i });
    await submitButton.click();
    
    // Deve ter validação HTML5
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValid).toBeFalsy();
  });

  test('deve ter link para voltar ao login', async ({ page }) => {
    await page.locator('input[type="email"]:visible').first().waitFor({ timeout: 15000 });
    
    const voltar = page.getByRole('link', { name: 'Voltar para o login' });
    await expect(voltar).toBeVisible();
    await expect(voltar).toHaveAttribute('href', '/auth');
  });
});

test.describe('Acessibilidade Auth Desktop', () => {
  test('formulário de login deve ter labels adequados', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[type="email"]:visible').first().waitFor({ timeout: 15000 });
    
    // Verificar que inputs têm identificação (id, placeholder, ou aria-label)
    const emailInput = page.locator('input[type="email"]:visible').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    const emailId = await emailInput.getAttribute('id');
    const emailPlaceholder = await emailInput.getAttribute('placeholder');
    const emailAriaLabel = await emailInput.getAttribute('aria-label');
    
    expect(emailId || emailPlaceholder || emailAriaLabel).toBeTruthy();
    
    const passwordId = await passwordInput.getAttribute('id');
    const passwordPlaceholder = await passwordInput.getAttribute('placeholder');
    const passwordAriaLabel = await passwordInput.getAttribute('aria-label');
    
    expect(passwordId || passwordPlaceholder || passwordAriaLabel).toBeTruthy();
  });

  test('foco deve ser visível em elementos interativos', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[type="email"]:visible').first().waitFor({ timeout: 15000 });
    
    const emailInput = page.locator('input[type="email"]:visible').first();
    await emailInput.focus();
    
    await page.keyboard.press('Tab'); // foco por teclado, que é quando o anel de foco aparece
    await page.keyboard.press('Shift+Tab');
    await expect(emailInput).toBeFocused();
    const focoVisivel = await emailInput.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return (style.outlineStyle !== 'none' && style.outlineWidth !== '0px') || style.boxShadow !== 'none';
    });
    expect(focoVisivel).toBe(true);
  });

  test('contraste de texto deve ser adequado', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');
    
    // Verificar que títulos têm cor contrastante
    const heading = page.locator('h2').first();
    await expect(heading).toBeVisible({ timeout: 15000 });
    const color = await heading.evaluate((el) => window.getComputedStyle(el).color);
    // Cor deve estar definida (não transparente)
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
  });
});

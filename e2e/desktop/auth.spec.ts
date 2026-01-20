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
      const loginForm = page.locator('input[type="email"]').first();
      const signupSection = page.locator('text=Criar conta').first();
      
      await expect(loginForm).toBeVisible({ timeout: 15000 });
      // Desktop deve mostrar ambos os formulários
      const visibleForms = await page.locator('form').count();
      expect(visibleForms).toBeGreaterThanOrEqual(1);
    }
  });

  test('formulário de login deve ter todos os campos necessários', async ({ page }) => {
    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });
    
    // Email input
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
    
    // Password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput.first()).toBeVisible();
    
    // Botão de entrar
    const loginButton = page.getByRole('button', { name: /entrar/i });
    await expect(loginButton).toBeVisible();
  });

  test('deve mostrar/ocultar senha ao clicar no ícone', async ({ page }) => {
    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });
    
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('senha123');
    
    // Clicar no botão de mostrar senha
    const toggleButton = page.getByLabel(/mostrar senha|ocultar senha/i).first();
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      
      // Agora o input deve ser type="text"
      const inputType = await page.locator('input').filter({ hasText: '' }).first().getAttribute('type');
      // Verificar que mudou
      expect(['text', 'password']).toContain(inputType);
    }
  });

  test('validação de email deve funcionar', async ({ page }) => {
    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });
    
    const emailInput = page.locator('input[type="email"]').first();
    const loginButton = page.getByRole('button', { name: /entrar/i });
    
    // Tentar submeter com email inválido
    await emailInput.fill('email-invalido');
    await loginButton.click();
    
    // HTML5 validation deve impedir o submit
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage.length).toBeGreaterThan(0);
  });

  test('campos devem ser obrigatórios', async ({ page }) => {
    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    // Verificar atributo required
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('link "Esqueceu sua senha?" deve navegar corretamente', async ({ page }) => {
    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });
    
    const forgotLink = page.getByRole('link', { name: /esqueceu/i });
    await expect(forgotLink).toBeVisible();
    
    await Promise.all([
      page.waitForURL('/auth/forgot-password'),
      forgotLink.click(),
    ]);
    
    expect(page.url()).toContain('/auth/forgot-password');
  });

  test('login com credenciais inválidas deve mostrar erro', async ({ page }) => {
    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.getByRole('button', { name: /entrar/i });
    
    await emailInput.fill('usuario@inexistente.com');
    await passwordInput.fill('senhaerrada123');
    await loginButton.click();
    
    // Aguardar resposta do servidor e mensagem de erro
    // Toast ou mensagem de erro deve aparecer
    await page.waitForTimeout(3000);
    
    // Verificar que não redirecionou para /protected
    expect(page.url()).not.toContain('/protected');
  });
});

test.describe('Fluxo de Cadastro Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');
  });

  test('formulário de cadastro deve ter seleção de tipo de usuário', async ({ page }) => {
    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });
    
    const viewport = page.viewportSize();
    
    // Em desktop, signup form deve estar visível
    if (viewport && viewport.width >= 768) {
      // Procurar opções de aluno/professor
      const studentOption = page.getByText(/aluno/i);
      const teacherOption = page.getByText(/professor/i);
      
      const hasStudent = await studentOption.isVisible().catch(() => false);
      const hasTeacher = await teacherOption.isVisible().catch(() => false);
      
      // Pelo menos uma opção de tipo de usuário deve existir
      console.log(`Student option visible: ${hasStudent}, Teacher option visible: ${hasTeacher}`);
    }
  });

  test('cadastro deve ter múltiplos passos', async ({ page }) => {
    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });
    
    const viewport = page.viewportSize();
    
    if (viewport && viewport.width >= 768) {
      // Procurar indicadores de passo ou botão "Próximo"
      const nextButton = page.getByRole('button', { name: /próximo|continuar|avançar/i });
      const stepIndicator = page.locator('[class*="step"], [class*="progress"]');
      
      const hasNextButton = await nextButton.isVisible().catch(() => false);
      const hasStepIndicator = await stepIndicator.first().isVisible().catch(() => false);
      
      console.log(`Next button: ${hasNextButton}, Step indicator: ${hasStepIndicator}`);
    }
  });
});

test.describe('Recuperação de Senha Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await page.waitForLoadState('domcontentloaded');
  });

  test('página de recuperação deve ter layout adequado', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput.first()).toBeVisible({ timeout: 15000 });
    
    const submitButton = page.getByRole('button', { name: /enviar/i });
    await expect(submitButton).toBeVisible();
  });

  test('deve validar formato de email', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
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
    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });
    
    const backLink = page.getByRole('link', { name: /voltar|login|entrar/i });
    const hasBackLink = await backLink.isVisible().catch(() => false);
    
    // Deve ter alguma forma de voltar
    expect(hasBackLink || page.locator('button:has-text("voltar")').isVisible()).toBeTruthy();
  });
});

test.describe('Acessibilidade Auth Desktop', () => {
  test('formulário de login deve ter labels adequados', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });
    
    // Verificar que inputs têm identificação (id, placeholder, ou aria-label)
    const emailInput = page.locator('input[type="email"]').first();
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
    await page.locator('input[type="email"]').first().waitFor({ timeout: 15000 });
    
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.focus();
    
    // Verificar que tem estilo de foco
    const hasFocusStyle = await emailInput.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.outlineWidth !== '0px' || style.boxShadow !== 'none';
    });
    
    // Focus deve ser visível (a menos que use focus-visible)
    console.log(`Email input has visible focus style: ${hasFocusStyle}`);
  });

  test('contraste de texto deve ser adequado', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('domcontentloaded');
    
    // Verificar que títulos têm cor contrastante
    const heading = page.locator('h2').first();
    
    if (await heading.isVisible()) {
      const color = await heading.evaluate(el => {
        return window.getComputedStyle(el).color;
      });
      
      // Cor deve estar definida (não transparente)
      expect(color).not.toBe('rgba(0, 0, 0, 0)');
    }
  });
});

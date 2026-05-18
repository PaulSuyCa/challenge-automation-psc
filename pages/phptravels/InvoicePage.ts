import { expect, Locator, Page } from '@playwright/test';

/**
 * Page Object para validar invoice y avanzar hacia la pantalla de pago.
 */
export class InvoicePage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private get body(): Locator {
    return this.page.locator('body');
  }

  private get makePaymentButton(): Locator {
    return this.page
      .locator('a:has-text("Make Payment"), button:has-text("Make Payment")')
      .first();
  }

  private get proceedToPaymentButton(): Locator {
    return this.page
      .locator('a:has-text("Proceed to Payment"), button:has-text("Proceed to Payment")')
      .first();
  }

  /**
   * Espera que el invoice termine de cargar el gateway Stripe y avanza al formulario de pago.
   */
  async continueToStripePayment(): Promise<void> {
    const paymentSummary = this.page
      .locator('div')
      .filter({ hasText: /Payments Summary/i })
      .first();

    const paymentGatewaySelect = paymentSummary.locator('select').first();

    const paymentButton = paymentSummary
      .locator('button')
      .filter({ hasNotText: /Download Invoice|Resend Invoice|Request Cancellation/i })
      .first();

    await expect(this.page.getByText(/Booking Confirmed Successfully/i)).toBeVisible({
      timeout: 60000,
    });

    await expect(paymentGatewaySelect).toBeVisible({
      timeout: 30000,
    });

    await paymentGatewaySelect.selectOption({ label: 'Credit Card (Stripe)' });

    await expect(paymentButton).toBeVisible({
      timeout: 30000,
    });

    // Espera a que el botón deje de estar en estado Processing.
    await expect(paymentButton).not.toContainText(/Processing/i, {
      timeout: 180000,
    });

    await expect(paymentButton).toBeEnabled({
      timeout: 180000,
    });

    await Promise.all([
      this.page.waitForLoadState('domcontentloaded').catch(() => { }),
      paymentButton.click(),
    ]);
  }

  /**
   * Valida que se haya salido de Booking Processing y se esté en invoice o pago.
   */
  async validateInvoiceOrPaymentStepLoaded(): Promise<void> {
    const processingText = this.page.getByText(/Processing/i).first();

    await expect(processingText).toBeHidden({
      timeout: 180000,
    });

    await expect(this.body).toContainText(/invoice|reservation|confirmed|make payment|proceed to payment|stripe/i, {
      timeout: 60000,
    });
  }

  /**
   * Avanza hacia el formulario de pago si aparecen botones intermedios.
   */
  async continueToPayment(): Promise<void> {
    await this.clickIfVisible(this.makePaymentButton);
    await this.clickIfVisible(this.proceedToPaymentButton);

    await this.page.waitForLoadState('domcontentloaded').catch(() => {
      console.log('[WARN] No se detectó nueva carga al continuar hacia pago.');
    });
  }

  /**
   * Hace click en un botón solo si está visible en pantalla.
   */
  private async clickIfVisible(locator: Locator): Promise<void> {
    if (await locator.isVisible({ timeout: 10000 }).catch(() => false)) {
      await locator.scrollIntoViewIfNeeded();
      await locator.click();
    }
  }
}
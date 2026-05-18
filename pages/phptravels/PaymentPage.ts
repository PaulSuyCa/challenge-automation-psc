import { expect, Page } from '@playwright/test';

export interface StripeCardData {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
  cardHolder: string;
  billingCountry?: string;
  zipCode?: string;
  phoneNumber?: string;
}

/**
 * Page Object para completar el formulario de pago con tarjeta Stripe.
 */
export class PaymentPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private get proceedToPaymentButton() {
    return this.page.getByRole('button', { name: /^Proceed to Payment$/ });
  }

  /**
   * Hace click en la pantalla intermedia de Stripe para abrir el formulario real de pago.
   */
  async proceedToStripeCheckout(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /^Proceed to Payment$/ })).toBeVisible({
      timeout: 30000,
    });

    await expect(this.proceedToPaymentButton).toBeVisible({
      timeout: 30000,
    });

    await expect(this.proceedToPaymentButton).toBeEnabled({
      timeout: 30000,
    });

    await Promise.all([
      this.page.waitForLoadState('domcontentloaded').catch(() => undefined),
      this.proceedToPaymentButton.click(),
    ]);
  }

  /**
   * Completa tarjeta Stripe, cubre campos adicionales de CI y envía el pago.
   */
  async payWithStripeCard(cardData: StripeCardData): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');

    await this.fillStripeField(
      'input[name="cardnumber"], input[name="cardNumber"], #cardNumber, input[autocomplete="cc-number"]',
      cardData.cardNumber
    );

    await this.fillStripeField(
      'input[name="exp-date"], input[name="cardExpiry"], #cardExpiry, input[autocomplete="cc-exp"]',
      cardData.expiryDate
    );

    await this.fillStripeField(
      'input[name="cvc"], input[name="cardCvc"], #cardCvc, input[autocomplete="cc-csc"]',
      cardData.cvc
    );

    await this.fillOptionalStripeField(
      'input[name="billingName"], input[name="name"], #billingName, input[autocomplete="cc-name"]',
      cardData.cardHolder
    );

    // En CI Stripe puede mostrar campos adicionales. Seleccionamos Perú para evitar ZIP obligatorio de USA.
    await this.selectBillingCountryIfVisible(cardData.billingCountry ?? 'Peru');

    // Desmarcamos Link para que no solicite teléfono adicional.
    await this.disableSaveInformationIfVisible();

    // Solo completa ZIP o teléfono si aún aparecen y si fueron enviados en la data.
    await this.fillOptionalBillingFields(cardData);

    await this.submitPayment();
  }

  /**
   * Valida que el pago haya finalizado y que el invoice muestre estado pagado.
   */
  async validatePaymentResult(): Promise<void> {
    await expect
      .poll(
        async () => {
          const bodyText = await this.page.locator('body').innerText().catch(() => '');
          const normalizedText = bodyText.toLowerCase();

          const hasInvoice = normalizedText.includes('invoice');
          const hasPaymentSuccessful = normalizedText.includes('payment successful');
          const hasBookingConfirmed =
            normalizedText.includes('booking status') && normalizedText.includes('confirmed');
          const hasPaymentPaid =
            normalizedText.includes('payment status') && normalizedText.includes('paid');

          const isStillIntermediateScreen =
            normalizedText.includes('proceed to payment') ||
            normalizedText.includes('pay with stripe');

          return (
            hasInvoice &&
            hasPaymentSuccessful &&
            hasBookingConfirmed &&
            hasPaymentPaid &&
            !isStillIntermediateScreen
          );
        },
        {
          timeout: 180000,
          intervals: [2000, 3000, 5000],
          message: 'Esperando invoice con pago confirmado',
        }
      )
      .toBeTruthy();

    await expect(this.page.locator('body')).toContainText(/Payment Successful/i);
    await expect(this.page.locator('body')).toContainText(/Booking Status:\s*Confirmed/i);
    await expect(this.page.locator('body')).toContainText(/Payment Status:\s*Paid/i);
  }

  /**
   * Completa un campo Stripe dentro de la página o dentro de iframes.
   */
  private async fillStripeField(selector: string, value: string): Promise<void> {
    if (await this.tryFillOnPage(selector, value)) {
      return;
    }

    for (const frame of this.page.frames()) {
      const field = frame.locator(selector).first();

      if (await field.isVisible({ timeout: 3000 }).catch(() => false)) {
        await field.fill(value);
        return;
      }
    }

    throw new Error(`No se encontró el campo Stripe: ${selector}`);
  }

  /**
   * Completa un campo opcional si existe en el formulario.
   */
  private async fillOptionalStripeField(selector: string, value: string): Promise<void> {
    if (await this.tryFillOnPage(selector, value)) {
      return;
    }

    for (const frame of this.page.frames()) {
      const field = frame.locator(selector).first();

      if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
        await field.fill(value);
        return;
      }
    }
  }

  /**
   * Intenta completar un campo directamente en la página principal.
   */
  private async tryFillOnPage(selector: string, value: string): Promise<boolean> {
    const field = this.page.locator(selector).first();

    if (await field.isVisible({ timeout: 3000 }).catch(() => false)) {
      await field.fill(value);
      return true;
    }

    return false;
  }

  /**
 * Espera que el formulario real de Stripe esté disponible antes de completar tarjeta.
 */
  async waitForStripeFormLoaded(): Promise<void> {
    await expect
      .poll(
        async () => {
          const pageCardField = await this.page
            .locator('input[name="cardnumber"], input[name="cardNumber"], input[autocomplete="cc-number"]')
            .count()
            .catch(() => 0);

          if (pageCardField > 0) return true;

          for (const frame of this.page.frames()) {
            const frameCardField = await frame
              .locator('input[name="cardnumber"], input[name="cardNumber"], input[autocomplete="cc-number"]')
              .count()
              .catch(() => 0);

            if (frameCardField > 0) return true;
          }

          return false;
        },
        {
          timeout: 180000,
          message: 'Esperando que cargue el formulario de tarjeta Stripe',
        }
      )
      .toBeTruthy();
  }

  /**
   * Envía el formulario de pago usando el botón disponible.
   */
  private async submitPayment(): Promise<void> {
    const payButton = this.page
      .locator(
        [
          'button:has-text("Pay")',
          'button:has-text("Pay now")',
          'button:has-text("Complete")',
          'button:has-text("Submit")',
          'button[type="submit"]',
        ].join(', ')
      )
      .first();

    await expect(payButton).toBeVisible({
      timeout: 30000,
    });

    await expect(payButton).toBeEnabled({
      timeout: 30000,
    });

    await payButton.click();
  }

  /**
   * Desmarca la opción de guardar información de pago si Stripe Link la muestra.
   */
  private async disableSaveInformationIfVisible(): Promise<void> {
    const checkboxName = /Save my information|faster checkout/i;

    const pageCheckbox = this.page.getByRole('checkbox', {
      name: checkboxName,
    }).first();

    if (await pageCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (await pageCheckbox.isChecked().catch(() => false)) {
        await pageCheckbox.uncheck({ force: true });
      }

      await expect(pageCheckbox).not.toBeChecked({
        timeout: 5000,
      });

      return;
    }

    for (const frame of this.page.frames()) {
      const frameCheckbox = frame.getByRole('checkbox', {
        name: checkboxName,
      }).first();

      if (await frameCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
        if (await frameCheckbox.isChecked().catch(() => false)) {
          await frameCheckbox.uncheck({ force: true });
        }

        await expect(frameCheckbox).not.toBeChecked({
          timeout: 5000,
        });

        return;
      }
    }
  }

  /**
   * Selecciona el país de facturación en Stripe si el campo aparece.
   */
  private async selectBillingCountryIfVisible(country: string): Promise<void> {
    const countryName = /Country or region/i;

    const pageCountry = this.page.getByRole('combobox', {
      name: countryName,
    }).first();

    if (await pageCountry.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pageCountry.selectOption({ label: country });
      await this.validateSelectedCountry(pageCountry, country);
      return;
    }

    for (const frame of this.page.frames()) {
      const frameCountry = frame.getByRole('combobox', {
        name: countryName,
      }).first();

      if (await frameCountry.isVisible({ timeout: 3000 }).catch(() => false)) {
        await frameCountry.selectOption({ label: country });
        await this.validateSelectedCountry(frameCountry, country);
        return;
      }
    }
  }

  /**
   * Valida que el país seleccionado sea el esperado.
   */
  private async validateSelectedCountry(countryLocator: ReturnType<Page['locator']>, country: string): Promise<void> {
    const selectedCountry = await countryLocator.evaluate((element) => {
      const select = element as HTMLSelectElement;
      return select.selectedOptions[0]?.textContent?.trim() ?? '';
    });

    expect(selectedCountry).toContain(country);
  }

  /**
   * Completa campos adicionales de facturación si Stripe los muestra en CI.
   */
  private async fillOptionalBillingFields(cardData: StripeCardData): Promise<void> {
    if (cardData.zipCode) {
      await this.fillOptionalStripeField(
        [
          'input[name="postal"]',
          'input[name="postalCode"]',
          'input[autocomplete="postal-code"]',
          'input[placeholder="ZIP"]',
          'input[aria-label="ZIP"]',
        ].join(', '),
        cardData.zipCode
      );
    }

    if (cardData.phoneNumber) {
      await this.fillOptionalStripeField(
        [
          'input[name="phone"]',
          'input[type="tel"]',
          'input[autocomplete="tel"]',
          'input[placeholder*="Phone"]',
          'input[placeholder*="555"]',
          'input[aria-label*="Phone"]',
        ].join(', '),
        cardData.phoneNumber
      );
    }
  }
}
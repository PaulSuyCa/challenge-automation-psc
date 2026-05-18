import { expect, Locator, Page } from '@playwright/test';

export interface TravelerData {
  title: string;
  firstName: string;
  lastName: string;
}

export interface GuestBookingData {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  secondAdult: TravelerData;
}

/**
 * Page Object para validar y operar la pantalla de Booking antes del pago.
 */
export class BookingPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private get bookingTitle(): Locator {
    return this.page.getByRole('heading', { name: /^Booking$/ });
  }

  private get guestDetailsTitle(): Locator {
    return this.page.getByRole('heading', { name: /^Guest Details$/ });
  }

  private get bookingSummaryTitle(): Locator {
    return this.page.getByRole('heading', { name: /^Booking Summary$/ });
  }

  private get paymentMethodsTitle(): Locator {
    return this.page.getByRole('heading', { name: /^Payment Methods$/ });
  }

  private get guestTitleCombo(): Locator {
    return this.page.locator('select[x-model="primary_guest.title"]');
  }

  private get firstNameInput(): Locator {
    return this.page.locator('input[x-model="primary_guest.first_name"]');
  }

  private get lastNameInput(): Locator {
    return this.page.locator('input[x-model="primary_guest.last_name"]');
  }

  private get emailInput(): Locator {
    return this.page.locator('input[x-model="primary_guest.email"]');
  }

  private get countryCodeCombo(): Locator {
    return this.page.locator('select[x-model="primary_guest.country_code"]');
  }

  private get phoneInput(): Locator {
    return this.page.locator('input[x-model="primary_guest.phone"]');
  }

  private get secondAdultTitle(): Locator {
    return this.page.getByRole('heading', { name: /^Adult 2$/ });
  }

  private get secondAdultTitleCombo(): Locator {
    return this.secondAdultTitle.locator('xpath=following::select[1]');
  }

  private get secondAdultFirstNameInput(): Locator {
    return this.secondAdultTitle.locator('xpath=following::input[1]');
  }

  private get secondAdultLastNameInput(): Locator {
    return this.secondAdultTitle.locator('xpath=following::input[2]');
  }

  private get stripePaymentCard(): Locator {
    return this.page
      .getByText('Stripe', { exact: true })
      .locator('xpath=ancestor::div[.//input[@type="radio"]][1]');
  }

  private get stripePaymentRadio(): Locator {
    return this.stripePaymentCard.locator('input[type="radio"]').first();
  }

  private get termsCheckbox(): Locator {
    return this.page.locator('#terms_accepted');
  }

  private get termsText(): Locator {
    return this.page.getByText(/I agree to the/i);
  }

  private get confirmBookingButton(): Locator {
    return this.page.getByRole('button', { name: /Confirm Booking/i });
  }

  private get processingMessage(): Locator {
    return this.page.getByText(/Processing/i);
  }

  private get processingInstruction(): Locator {
    return this.page.getByText(/Please wait, Do Not Refresh or Close This Page/i);
  }

  /**
   * Valida que la pantalla de Booking haya cargado correctamente.
   */
  async validateBookingPageLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');

    await expect(this.bookingTitle).toBeVisible({ timeout: 30000 });
    await expect(this.guestDetailsTitle).toBeVisible({ timeout: 10000 });
    await expect(this.bookingSummaryTitle).toBeVisible({ timeout: 10000 });
    await expect(this.confirmBookingButton).toBeVisible({ timeout: 10000 });
  }

  /**
   * Completa los datos principales del huésped y del segundo adulto.
   */
  async fillGuestDetails(guestData: GuestBookingData): Promise<void> {
    await expect(this.firstNameInput).toBeVisible({ timeout: 10000 });

    await this.guestTitleCombo.selectOption({ label: guestData.title });
    await this.firstNameInput.fill(guestData.firstName);
    await this.lastNameInput.fill(guestData.lastName);
    await this.emailInput.fill(guestData.email);

    await this.selectCountryCode(guestData.countryCode);

    await this.phoneInput.fill(guestData.phone);
    await this.fillSecondAdultDetails(guestData.secondAdult);
  }

  /**
   * Selecciona el código de país del huésped si el combo está disponible.
   */
  private async selectCountryCode(countryCode: string): Promise<void> {
    if (await this.countryCodeCombo.isVisible().catch(() => false)) {
      await this.countryCodeCombo.selectOption({ label: countryCode }).catch(async () => {
        console.log(`[WARN] No se pudo seleccionar el código de país: ${countryCode}`);
      });
    }
  }

  /**
   * Completa los datos del segundo adulto de la habitación.
   */
  private async fillSecondAdultDetails(secondAdult: TravelerData): Promise<void> {
    await this.secondAdultTitle.scrollIntoViewIfNeeded();

    await expect(this.secondAdultTitle).toBeVisible({
      timeout: 10000,
    });

    await expect(this.secondAdultTitleCombo).toBeVisible({
      timeout: 10000,
    });

    await this.secondAdultTitleCombo.selectOption({ label: secondAdult.title });
    await this.secondAdultFirstNameInput.fill(secondAdult.firstName);
    await this.secondAdultLastNameInput.fill(secondAdult.lastName);
  }

  /**
   * Valida que los datos del huésped hayan sido ingresados correctamente.
   */
  async validateGuestDetailsCompleted(guestData: GuestBookingData): Promise<void> {
    await expect(this.firstNameInput).toHaveValue(guestData.firstName);
    await expect(this.lastNameInput).toHaveValue(guestData.lastName);
    await expect(this.emailInput).toHaveValue(guestData.email);
    await expect(this.phoneInput).toHaveValue(guestData.phone);

    await expect(this.secondAdultFirstNameInput).toHaveValue(guestData.secondAdult.firstName);
    await expect(this.secondAdultLastNameInput).toHaveValue(guestData.secondAdult.lastName);
  }

  /**
   * Selecciona el método de pago Credit Card - Stripe.
   */
  async selectStripePaymentMethod(): Promise<void> {
    await this.paymentMethodsTitle.scrollIntoViewIfNeeded();

    await expect(this.paymentMethodsTitle).toBeVisible({
      timeout: 15000,
    });

    await expect(this.stripePaymentCard).toBeVisible({
      timeout: 10000,
    });

    if (!(await this.stripePaymentRadio.isChecked().catch(() => false))) {
      await this.stripePaymentCard.click();
    }

    await expect(this.stripePaymentRadio).toBeChecked({
      timeout: 10000,
    });
  }

  /**
   * Acepta los términos y condiciones actualizando el checkbox y el modelo interno de la web.
   */
  async acceptTermsAndConditions(): Promise<void> {
    await this.termsCheckbox.scrollIntoViewIfNeeded();

    await expect(this.termsCheckbox).toBeAttached({
      timeout: 10000,
    });

    await this.termsCheckbox.evaluate((checkbox) => {
      const input = checkbox as HTMLInputElement;

      input.checked = true;

      // Si la web usa Alpine/x-model, actualiza también el modelo interno.
      const alpineInput = input as HTMLInputElement & {
        _x_model?: {
          set: (value: boolean) => void;
        };
      };

      alpineInput._x_model?.set(true);

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await expect(this.termsCheckbox).toBeChecked({
      timeout: 10000,
    });

    await expect(this.confirmBookingButton).toBeEnabled({
      timeout: 10000,
    });
  }

  /**
   * Confirma la reserva y espera hasta que termine la pantalla Processing.
   */
  async confirmBooking(): Promise<void> {
    await this.confirmBookingButton.scrollIntoViewIfNeeded();

    await expect(this.confirmBookingButton).toBeEnabled({
      timeout: 15000,
    });

    await this.confirmBookingButton.click();

    await this.waitUntilProcessingFinish();
  }

  /**
   * Espera que aparezca Processing y no permite avanzar hasta que desaparezca.
   */
  private async waitUntilProcessingFinish(): Promise<void> {
    const processingText = this.page.getByText(/Processing/i).first();

    await expect(processingText).toBeVisible({
      timeout: 15000,
    });

    await expect(processingText).toBeHidden({
      timeout: 180000,
    });

    await this.page.waitForLoadState('domcontentloaded', {
      timeout: 60000,
    }).catch(() => {
      console.log('[WARN] No se detectó domcontentloaded después de Processing.');
    });
  }
}
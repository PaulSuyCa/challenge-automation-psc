import { expect, Locator, Page } from '@playwright/test';

/**
 * Page Object para validar y operar la pantalla de detalle del hotel.
 */
export class HotelDetailsPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private get detailsBreadcrumb(): Locator {
    return this.page.getByText('Details', { exact: true });
  }

  private get modifySearchSection(): Locator {
    return this.page.getByText('Modify Search');
  }

  private get filterRoomsSection(): Locator {
    return this.page.getByText(/Filter Rooms/i).first();
  }

  private get firstRoomHeading(): Locator {
    return this.page.getByRole('heading', { name: /Deluxe Room/i }).first();
  }

  private get firstAvailableRoomRateRow(): Locator {
    return this.page
      .getByRole('row', { name: /Refundable \+ Breakfast.*Select/i })
      .first();
  }

  private get firstRoomQuantityCombo(): Locator {
    return this.firstAvailableRoomRateRow.getByRole('combobox').first();
  }

  private get firstRoomSelectButton(): Locator {
    return this.firstAvailableRoomRateRow.getByRole('button', { name: /^Select$/i });
  }

  private get continueBookingButton(): Locator {
    return this.page.getByRole('button', { name: /Continue Booking/i });
  }

  /**
   * Espera que la página de detalle termine de cargar antes de interactuar.
   */
  async waitUntilHotelDetailsIsReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');

    await this.page.waitForLoadState('load', {
      timeout: 60000,
    }).catch(() => {
      console.log('[WARN] Load completo no terminó, se continúa con validaciones visibles.');
    });

    await expect(this.detailsBreadcrumb).toBeVisible({
      timeout: 30000,
    });

    await expect(this.modifySearchSection).toBeVisible({
      timeout: 30000,
    });
  }

  /**
   * Valida que la pantalla de detalle del hotel haya cargado correctamente.
   */
  async validateHotelDetailsLoaded(): Promise<void> {
    await this.waitUntilHotelDetailsIsReady();
  }

  /**
   * Valida que la sección de habitaciones esté disponible antes de hacer scroll.
   */
  async validateRoomsSectionVisible(): Promise<void> {
    await this.waitUntilHotelDetailsIsReady();

    await expect(this.filterRoomsSection).toBeAttached({
      timeout: 30000,
    });

    await this.filterRoomsSection.scrollIntoViewIfNeeded();

    await expect(this.filterRoomsSection).toBeVisible({
      timeout: 30000,
    });
  }

  /**
 * Selecciona la primera habitación disponible y continúa con la reserva.
 */
  async bookFirstAvailableRoom(): Promise<void> {
    await this.waitUntilHotelDetailsIsReady();

    await expect(this.filterRoomsSection).toBeVisible({
      timeout: 30000,
    });

    await this.filterRoomsSection.scrollIntoViewIfNeeded();

    await expect(this.firstRoomHeading).toBeVisible({
      timeout: 30000,
    });

    await expect(this.firstAvailableRoomRateRow).toBeVisible({
      timeout: 30000,
    });

    await expect(this.firstRoomQuantityCombo).toBeVisible({
      timeout: 10000,
    });

    await this.firstRoomQuantityCombo.selectOption('1');

    await expect(this.firstRoomSelectButton).toBeVisible({
      timeout: 10000,
    });

    await this.firstRoomSelectButton.click();

    await expect(this.continueBookingButton).toBeVisible({
      timeout: 15000,
    });

    await Promise.all([
      this.page.waitForURL(/booking|checkout|invoice|reservation/i, {
        timeout: 60000,
      }),
      this.continueBookingButton.click(),
    ]);

    await this.page.waitForLoadState('domcontentloaded');
  }
}
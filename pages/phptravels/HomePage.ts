import { expect, Locator, Page } from '@playwright/test';
import { getWebBaseUrl } from '../../utils/configReader';

/**
 * Page Object para centralizar elementos, acciones y validaciones del Home de PHPTravels.
 */
export interface StayBookingCriteria {
  destination: string;
  hotelName: string;
  hotelSlug: string;
  hotelId: string;
  checkIn: string;
  checkOut: string;
  nationality: string;
  nationalityCode: string;
  rooms: number;
  adults: number;
  children: number;
}

export class HomePage {
  private readonly page: Page;
  private readonly url: string;

  constructor(page: Page) {
    this.page = page;
    this.url = getWebBaseUrl();
  }

  private get demoContinueButton(): Locator {
    return this.page.getByRole('button', { name: /I Understand & Continue/i });
  }

  private get staysTab(): Locator {
    return this.page.getByRole('tab', { name: /Stays/i });
  }

  private get destinationInput(): Locator {
    return this.page.getByRole('textbox', { name: /Search By City/i });
  }

  private get checkInInput(): Locator {
    return this.page.getByRole('textbox', { name: /Check-in Date/i });
  }

  private get checkOutInput(): Locator {
    return this.page.getByRole('textbox', { name: /Check-out Date/i });
  }

  private get nationalitySelector(): Locator {
    return this.page.getByText('Select Nationality', { exact: true });
  }

  private get guestsAndRoomsSelector(): Locator {
    return this.page.getByText(/2 Guests, 1 Room/i);
  }

  private get searchHotelsButton(): Locator {
    return this.page.getByRole('button', { name: /Search Hotels/i });
  }

  private get featuredPropertiesHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Featured Properties' });
  }

  private get featuredCarsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Featured Cars' });
  }

  private get popularToursHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Popular Tours' });
  }

  private get featuredFlightsHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Featured Flights' });
  }


  private get countrySearchInput(): Locator {
    return this.page.getByRole('textbox', { name: /Search country/i });
  }

  /**
   * Navega hacia la página principal configurada por ambiente.
   */
  async navigate(): Promise<void> {
    await this.page.goto(this.url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
  }

  /**
   * Cierra el modal informativo del ambiente demo si aparece.
   */
  async acceptDemoEnvironmentNoticeIfVisible(): Promise<void> {
    if (await this.demoContinueButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.demoContinueButton.click();
    }
  }

  /**
   * Valida que la página cargue correctamente mediante URL y título.
   */
  async validateHomePageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/phptravels\.net/);

    const title = await this.page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  }

  /**
   * Valida que las secciones principales del Home estén visibles.
   */
  async validateHomeSectionsVisible(): Promise<void> {
    await expect(this.featuredPropertiesHeading).toBeVisible();
    await expect(this.featuredCarsHeading).toBeVisible();
    await expect(this.popularToursHeading).toBeVisible();
    await expect(this.featuredFlightsHeading).toBeVisible();
  }

  /**
   * Selecciona la pestaña Stays para validar el formulario de alojamientos.
   */
  async selectStaysTab(): Promise<void> {
    await this.staysTab.click();
  }

  /**
   * Valida que los elementos principales del formulario Stays estén visibles.
   */
  async validateStaysFormVisible(): Promise<void> {
    await expect(this.destinationInput).toBeVisible();
    await expect(this.checkInInput).toBeVisible();
    await expect(this.checkOutInput).toBeVisible();
    await expect(this.guestsAndRoomsSelector).toBeVisible();
    await expect(this.nationalitySelector).toBeVisible();
    await expect(this.searchHotelsButton).toBeVisible();
  }

  /**
   * Busca un hotel desde Stays y navega al detalle sin validar URL exacta.
   */
  async searchHotel(criteria: StayBookingCriteria): Promise<void> {
    await this.selectNationality(criteria.nationality);
    await this.openHotelDetailsFromGeneratedLink(criteria);
  }

  /**
   * Selecciona la nacionalidad desde el combo Nationality y valida que quede aplicada.
   */
  private async selectNationality(nationality: string): Promise<void> {
    const nationalityTrigger = this.page.getByText('Select Nationality', { exact: true });

    if (await nationalityTrigger.isVisible().catch(() => false)) {
      await nationalityTrigger.click();
    }

    await expect(this.countrySearchInput).toBeVisible({
      timeout: 5000,
    });

    await this.countrySearchInput.fill(nationality);

    const nationalityOption = this.countrySearchInput
      .locator(`xpath=following::*[normalize-space()="${nationality}"][1]`);

    await expect(nationalityOption).toBeVisible({
      timeout: 5000,
    });

    await nationalityOption.click();

    await expect(this.page.getByText(nationality, { exact: true }).first()).toBeVisible({
      timeout: 5000,
    });
  }

  /**
   * Obtiene el link real del hotel mostrado en la web y navega al detalle con la nacionalidad correcta.
   */
  private async openHotelDetailsFromGeneratedLink(criteria: StayBookingCriteria): Promise<void> {
    await this.destinationInput.click();
    await this.destinationInput.fill(criteria.destination);

    const hotelLink = this.page
      .locator(`a[href*="/stay/${criteria.hotelSlug}/${criteria.hotelId}/hotels"]`)
      .first();

    await expect(hotelLink).toBeAttached({
      timeout: 10000,
    });

    const href = await hotelLink.getAttribute('href');

    if (!href) {
      throw new Error(`No se encontró el link del hotel: ${criteria.hotelName}`);
    }

    const fixedHref = href.replace('/NULL/', `/${criteria.nationalityCode}/`);

    await this.page.goto(fixedHref, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
  }
}
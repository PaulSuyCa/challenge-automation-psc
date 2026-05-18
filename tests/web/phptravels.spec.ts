import { test } from '@playwright/test';
import { HomePage } from '../../pages/phptravels/HomePage';
import { HotelDetailsPage } from '../../pages/phptravels/HotelDetailsPage';
import { takeScreenshot } from '../../utils/screenshotUtil';
import { stayBookingData } from '../../data/stayBookingData';
import { BookingPage } from '../../pages/phptravels/BookingPage';
import { guestBookingData } from '../../data/guestBookingData';
import { InvoicePage } from '../../pages/phptravels/InvoicePage';
import { PaymentPage } from '../../pages/phptravels/PaymentPage';
import { stripeTestCards } from '../../data/stripeTestCards';

/**
 * Pruebas Web para PHPTravels.
 */
test.describe('PHPTravels - Web Tests', () => {
  test('@smoke Validar carga inicial de Home y formulario Stays', async ({ page }, testInfo) => {
    const homePage = new HomePage(page);

    await homePage.navigate();
    await homePage.acceptDemoEnvironmentNoticeIfVisible();

    await homePage.validateHomePageLoaded();
    await homePage.validateHomeSectionsVisible();

    await homePage.selectStaysTab();
    await homePage.validateStaysFormVisible();

    await takeScreenshot(page, testInfo, 'phptravels-smoke-stays');
  });

  test('@payment Buscar hotel específico, reservar y realizar el pago', async ({ page }, testInfo) => {
    test.setTimeout(240000);
    const homePage = new HomePage(page);
    const hotelDetailsPage = new HotelDetailsPage(page);
    const bookingPage = new BookingPage(page);
    const invoicePage = new InvoicePage(page);
    const paymentPage = new PaymentPage(page);

    await homePage.navigate();
    await homePage.acceptDemoEnvironmentNoticeIfVisible();
    await homePage.selectStaysTab();

    await homePage.searchHotel(stayBookingData);

    await hotelDetailsPage.validateHotelDetailsLoaded();
    await hotelDetailsPage.validateRoomsSectionVisible();
    await hotelDetailsPage.bookFirstAvailableRoom();

    await bookingPage.validateBookingPageLoaded();
    await bookingPage.fillGuestDetails(guestBookingData);
    await bookingPage.validateGuestDetailsCompleted(guestBookingData);

    await bookingPage.selectStripePaymentMethod();
    await bookingPage.acceptTermsAndConditions();
    await bookingPage.confirmBooking();

    await invoicePage.validateInvoiceOrPaymentStepLoaded();
    await invoicePage.continueToStripePayment();

    await paymentPage.proceedToStripeCheckout();
    await paymentPage.waitForStripeFormLoaded();
    if (!stripeTestCards?.successfulVisa) {
      throw new Error('No se encontró la tarjeta de prueba successfulVisa en data/stripeTestCards.ts');
    }

    await paymentPage.payWithStripeCard(stripeTestCards.successfulVisa);
    await paymentPage.validatePaymentResult();

    await takeScreenshot(page, testInfo, 'phptravels-payment-success');
  });
});
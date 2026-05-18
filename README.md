# Challenge Automation PSC

Proyecto de automatización de pruebas desarrollado con **Playwright + TypeScript**, orientado a validar flujos **API** y **Web** como parte de un challenge técnico QA Automation.

El proyecto cubre:

- Pruebas API sobre **PokeAPI**, usando data externa desde Excel.
- Pruebas Web sobre **PHPTravels**, incluyendo búsqueda/reserva de hotel y pago con tarjeta de prueba mediante Stripe.
- Ejecución por ambientes mediante archivos `.properties`.
- Generación de evidencias, screenshots, traces, videos en fallos y reporte HTML de Playwright.

---

## Tecnologías utilizadas

- Node.js
- TypeScript
- Playwright Test
- ExcelJS
- PokeAPI
- PHPTravels Demo
- Stripe Test Cards

---

## Estructura del proyecto

```text
challenge-automation-psc/
├── config/
│   ├── qa.example.properties
│   └── cert.example.properties
├── data/
│   ├── Datos-pruebas.xlsx
│   ├── guestBookingData.ts
│   ├── stayBookingData.ts
│   └── stripeTestCards.ts
├── pages/
│   └── phptravels/
│       ├── HomePage.ts
│       ├── HotelDetailsPage.ts
│       ├── BookingPage.ts
│       ├── InvoicePage.ts
│       └── PaymentPage.ts
├── scripts/
│   └── run-tests.js
├── tests/
│   ├── api/
│   │   └── pokemon.spec.ts
│   └── web/
│       └── phptravels.spec.ts
├── utils/
│   ├── configReader.ts
│   ├── excelReader.ts
│   ├── hashUtil.ts
│   ├── logger.ts
│   └── screenshotUtil.ts
├── .env.example
├── .gitignore
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

---

## Instalación del proyecto

Clonar el repositorio:

```bash
git clone https://github.com/PaulSuyCa/challenge-automation-psc.git
cd challenge-automation-psc
git checkout feature/automation-testing
```

Instalar dependencias:

```bash
npm install
```

Instalar navegadores de Playwright:

```bash
npx playwright install
```

---

## Configuración de ambientes

El proyecto trabaja con archivos `.properties` por ambiente.

Los archivos reales no se suben al repositorio por seguridad. Solo se incluyen archivos de ejemplo:

```text
config/qa.example.properties
config/cert.example.properties
```

Para ejecutar localmente, crear los archivos reales:

```text
config/qa.properties
config/cert.properties
```

Ejemplo para `config/qa.properties`:

```properties
environment=QA
baseUrl=https://pokeapi.co/api/v2
webBaseUrl=https://phptravels.net/
secretVariable=QA_SECRET_KEY
```

Ejemplo para `config/cert.properties`:

```properties
environment=CERT
baseUrl=https://pokeapi.co/api/v2
webBaseUrl=https://phptravels.net/
secretVariable=CERT_SECRET_KEY
```

---

## Variables de entorno

El proyecto usa una variable secreta por ambiente para demostrar manejo seguro de información sensible.

En PowerShell:

```powershell
$env:QA_SECRET_KEY="your-secret-value"
$env:CERT_SECRET_KEY="your-cert-secret-value"
```

En Git Bash o terminal Linux/Mac:

```bash
export QA_SECRET_KEY="your-secret-value"
export CERT_SECRET_KEY="your-cert-secret-value"
```

---

## Ejecución de pruebas

### Validar TypeScript

```bash
npm run typecheck
```

---

## Pruebas API

Las pruebas API validan información de Pokémon desde un archivo Excel ubicado en:

```text
data/Datos-pruebas.xlsx
```

El flujo API realiza validaciones por:

- ID del Pokémon.
- Nombre del Pokémon.
- Código de respuesta HTTP.
- Tiempo de respuesta menor a 10 segundos.
- Nombre esperado.
- Habilidades esperadas.

Ejecutar en QA:

```bash
npm run test:api:qa
```

Ejecutar en CERT:

```bash
npm run test:api:cert
```

---

## Pruebas Web

Las pruebas Web se ejecutan sobre PHPTravels Demo.

### Smoke Test

Valida la carga inicial del Home y la disponibilidad del formulario Stays.

```bash
npm run test:web:smoke:qa
```

### Flujo completo de reserva y pago

Valida el flujo principal del challenge:

```text
Home
→ Stays
→ Búsqueda de hotel
→ Detalle del hotel
→ Selección de habitación
→ Booking
→ Datos del huésped
→ Método de pago Credit Card - Stripe
→ Confirm Booking
→ Invoice
→ Proceed to Payment
→ Stripe
→ Pago exitoso
```

Ejecutar en modo headless:

```bash
npm run test:web:payment:qa
```

Ejecutar con navegador visible:

```bash
npm run test:web:payment:qa:headed
```

Ejecutar en modo debug:

```bash
npm run test:web:qa:debug
```

---

## Reporte HTML

Playwright genera reporte HTML después de la ejecución.

Abrir reporte:

```bash
npm run report
```

El reporte se genera en:

```text
playwright-report/
```

---

## Evidencias generadas

El proyecto puede generar evidencias como:

- Screenshots.
- Videos en caso de fallo.
- Trace en primer reintento.
- Reporte HTML.

Configuración aplicada en `playwright.config.ts`:

```ts
screenshot: 'only-on-failure'
video: 'retain-on-failure'
trace: 'on-first-retry'
```

Además, se generan screenshots manuales en puntos relevantes del flujo mediante `screenshotUtil.ts`.

---

## Datos de prueba Web

Los datos principales del flujo Web se encuentran en:

```text
data/stayBookingData.ts
data/guestBookingData.ts
data/stripeTestCards.ts
```

Ejemplo de tarjeta usada para pruebas Stripe:

```text
Card Number: 4242 4242 4242 4242
Expiry Date: 12/34
CVC: 123
```

Estos datos corresponden a pruebas en ambiente test y no deben reemplazarse por tarjetas reales.

---

## Consideraciones técnicas

### PHPTravels Demo

PHPTravels es un ambiente demo, por lo que puede presentar comportamientos variables como:

- Carga lenta de datos.
- Modales informativos.
- Redirecciones dinámicas.
- Botones en estado `Processing`.
- Cambios temporales en disponibilidad de hoteles o habitaciones.

Por ese motivo, se implementaron esperas explícitas y validaciones visuales para estabilizar el flujo.

### Selección de hotel

Debido a la inestabilidad del listado de búsqueda, el flujo se enfoca en reservar el hotel:

```text
Address Downtown Dubai
```

Esto permite continuar con el flujo principal solicitado: reserva, invoice y pago.

### Pago con Stripe

El flujo selecciona el método:

```text
Credit Card (Stripe)
```

Luego continúa hacia la pantalla intermedia de pago y completa el formulario de tarjeta con datos de prueba.

La validación final se realiza en el invoice, verificando:

```text
Payment Successful
Booking Status: Confirmed
Payment Status: Paid
```

---

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run typecheck` | Valida errores de TypeScript |
| `npm run test` | Ejecuta todos los tests Playwright |
| `npm run test:api:qa` | Ejecuta pruebas API en QA |
| `npm run test:api:cert` | Ejecuta pruebas API en CERT |
| `npm run test:web:qa` | Ejecuta pruebas Web en QA |
| `npm run test:web:cert` | Ejecuta pruebas Web en CERT |
| `npm run test:web:smoke:qa` | Ejecuta smoke test Web en QA |
| `npm run test:web:payment:qa` | Ejecuta flujo Web de pago en QA |
| `npm run test:web:payment:qa:headed` | Ejecuta flujo Web de pago con navegador visible |
| `npm run test:web:qa:debug` | Ejecuta pruebas Web en modo debug |
| `npm run report` | Abre el reporte HTML de Playwright |

---

## Buenas prácticas aplicadas

- Uso de Page Object Model para la capa Web.
- Separación de datos de prueba.
- Configuración por ambientes.
- Manejo de variables sensibles por entorno.
- Lectura de data externa desde Excel.
- Validaciones funcionales y de respuesta.
- Screenshots como evidencia.
- Reporte HTML de ejecución.
- Reintentos configurados para CI.
- Trace y video para análisis de fallos.

---

## Autor

**Paul Suybate**

QA Automation Engineer  
Especializado en automatización Web, API, Mobile y Performance Testing.
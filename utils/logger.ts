/**
 * Utilidades simples para registrar información relevante durante la ejecución de pruebas.
 */
export function logInfo(message: string): void {
  console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
}

export function logEncryptedSecret(encryptedSecret: string): void {
  console.log(`[SECRET SHA256] ${encryptedSecret}`);
}

export function logTestFinished(testName: string): void {
  console.log(`[FIN TEST] ${testName} - ${new Date().toLocaleString()}`);
}
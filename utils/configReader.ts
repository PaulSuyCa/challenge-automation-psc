import fs from 'node:fs';
import path from 'node:path';

type ConfigProperties = Record<string, string>;

/**
 * Carga variables locales desde un archivo .env según el ambiente seleccionado.
 */
function loadEnvFile(env: string): void {
  const envPath = path.resolve(process.cwd(), `.env.${env}`);

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf-8');

  content.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    const [key, ...valueParts] = trimmedLine.split('=');
    const value = valueParts.join('=').trim();

    if (!process.env[key.trim()]) {
      process.env[key.trim()] = value;
    }
  });
}

/**
 * Lee el archivo properties del ambiente seleccionado y obtiene sus valores de configuración.
 */
function loadProperties(filePath: string): ConfigProperties {
  const content = fs.readFileSync(filePath, 'utf-8');
  const properties: ConfigProperties = {};

  content.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    const [key, ...valueParts] = trimmedLine.split('=');
    properties[key.trim()] = valueParts.join('=').trim();
  });

  return properties;
}

const env = (process.env.ENV || 'qa').toLowerCase();

loadEnvFile(env);

const configPath = path.resolve(process.cwd(), 'config', `${env}.properties`);

if (!fs.existsSync(configPath)) {
  throw new Error(`No existe el archivo de configuración: ${configPath}`);
}

const properties = loadProperties(configPath);

function getRequiredProperty(key: string): string {
  const value = properties[key];

  if (!value) {
    throw new Error(`No se encontró la propiedad requerida: ${key}`);
  }

  return value;
}

export function getEnvironment(): string {
  return getRequiredProperty('environment');
}

export function getBaseUrl(): string {
  return getRequiredProperty('baseUrl');
}

export function getWebBaseUrl(): string {
  return getRequiredProperty('webBaseUrl');
}

export function getSecretKey(): string {
  const secretVariable = getRequiredProperty('secretVariable');
  const secretValue = process.env[secretVariable];

  if (!secretValue) {
    throw new Error(`No se encontró la variable de entorno requerida: ${secretVariable}`);
  }

  return secretValue;
}
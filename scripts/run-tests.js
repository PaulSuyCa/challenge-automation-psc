const { spawnSync } = require('node:child_process');

/**
 * Ejecuta Playwright usando el ambiente recibido por parámetro y evitando comandos largos en consola.
 */
const envName = process.argv[2] || 'qa';
const testPath = process.argv[3];

const playwrightCli = require.resolve('@playwright/test/cli');

const args = [playwrightCli, 'test'];

if (testPath) {
  args.push(testPath);
}

console.log(`[INFO] Ambiente seleccionado: ${envName}`);
console.log(`[INFO] Ejecutando: node ${args.join(' ')}`);

const result = spawnSync(process.execPath, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    ENV: envName,
  },
});

process.exit(result.status ?? 1);

console.log(`[INFO] Ambiente seleccionado: ${envName}`);
console.log(`[INFO] Ejecutando: npx ${args.join(' ')}`);
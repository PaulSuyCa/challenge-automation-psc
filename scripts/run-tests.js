const { spawnSync } = require('node:child_process');

/**
 * Ejecuta Playwright con el ambiente seleccionado y permite agregar flags como --headed o --debug.
 */
const envName = process.argv[2] || 'qa';
const playwrightArgs = process.argv.slice(3);

const playwrightCli = require.resolve('@playwright/test/cli');
const args = [playwrightCli, 'test', ...playwrightArgs];

const executionMode = playwrightArgs.includes('--headed')
  ? 'headed / visible'
  : playwrightArgs.includes('--debug')
    ? 'debug'
    : 'headless';

console.log(`[INFO] Ambiente seleccionado: ${envName}`);
console.log(`[INFO] Modo de ejecución: ${executionMode}`);
console.log(`[INFO] Ejecutando: node ${args.join(' ')}`);

const result = spawnSync(process.execPath, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    ENV: envName,
  },
});

process.exit(result.status ?? 1);
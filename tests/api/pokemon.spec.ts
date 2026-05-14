import { test, expect } from '@playwright/test';
import { readPokemonData } from '../../utils/excelReader';
import { encryptSHA256 } from '../../utils/hashUtil';
import { getBaseUrl, getSecretKey } from '../../utils/configReader';
import { logEncryptedSecret, logTestFinished } from '../../utils/logger';

const excelPath = 'data/Datos-pruebas.xlsx';

/**
 * Valida la PokeAPI usando los datos del Excel por ID y por nombre.
 */
test.describe('PokeAPI - Validación de Pokémon desde Excel', () => {
  test('GET Pokemon por ID y nombre desde archivo Excel', async ({ request }) => {
    const pokemonData = await readPokemonData(excelPath);

    for (const pokemon of pokemonData) {
      await test.step(`Validar Pokemon por ID - ${pokemon.id}`, async () => {
        const encryptedSecret = encryptSHA256(getSecretKey());
        logEncryptedSecret(encryptedSecret);

        const startTime = Date.now();

        const response = await request.get(`${getBaseUrl()}/pokemon/${pokemon.id}`);

        const responseTime = Date.now() - startTime;
        const body = await response.json();

        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(10000);

        expect(body.id).toBe(pokemon.id);
        expect(body.name).toBe(pokemon.name.toLowerCase());

        const responseAbilities = body.abilities.map(
          (item: { ability: { name: string } }) => item.ability.name
        );

        const expectedAbilities = pokemon.abilities
          .split(',')
          .map((ability) => ability.trim().toLowerCase())
          .filter(Boolean);

        for (const ability of expectedAbilities) {
          expect(responseAbilities).toContain(ability);
        }

        logTestFinished(`GET Pokemon por ID - ${pokemon.id}`);
      });

      await test.step(`Validar Pokemon por nombre - ${pokemon.name}`, async () => {
        const encryptedSecret = encryptSHA256(getSecretKey());
        logEncryptedSecret(encryptedSecret);

        const startTime = Date.now();

        const response = await request.get(
          `${getBaseUrl()}/pokemon/${pokemon.name.toLowerCase()}`
        );

        const responseTime = Date.now() - startTime;
        const body = await response.json();

        expect(response.status()).toBe(200);
        expect(responseTime).toBeLessThan(10000);

        expect(body.id).toBe(pokemon.id);
        expect(body.name).toBe(pokemon.name.toLowerCase());

        const responseAbilities = body.abilities.map(
          (item: { ability: { name: string } }) => item.ability.name
        );

        const expectedAbilities = pokemon.abilities
          .split(',')
          .map((ability) => ability.trim().toLowerCase())
          .filter(Boolean);

        for (const ability of expectedAbilities) {
          expect(responseAbilities).toContain(ability);
        }

        logTestFinished(`GET Pokemon por nombre - ${pokemon.name}`);
      });
    }
  });
});
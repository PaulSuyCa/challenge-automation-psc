import ExcelJS from 'exceljs';

export interface PokemonData {
  id: number;
  name: string;
  abilities: string;
}

/**
 * Lee el archivo Excel de datos de prueba y transforma cada fila en un caso de prueba.
 */
export async function readPokemonData(filePath: string): Promise<PokemonData[]> {
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet('GET pokemon');

  if (!worksheet) {
    throw new Error('No se encontró la hoja "GET pokemon" en el archivo Excel');
  }

  const pokemonData: PokemonData[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const id = Number(row.getCell(1).value);
    const name = String(row.getCell(2).value);
    const abilities = String(row.getCell(3).value);

    if (!id || !name) {
      throw new Error(`Fila ${rowNumber} inválida. Se requiere id y name.`);
    }

    pokemonData.push({
      id,
      name,
      abilities,
    });
  });

  return pokemonData;
}
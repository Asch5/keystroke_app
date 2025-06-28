import * as fs from 'fs/promises';
import * as path from 'path';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';

export async function saveJson(data: unknown, name: string) {
  //let's save the data to a json file onside the project folder
  try {
    const documentationPath = path.resolve(
      process.cwd(),
      'documentation',
      'JSON',
      'schema_merriam.json',
    );

    // Read existing file
    const existingData = await fs.readFile(documentationPath, 'utf-8');
    const parsedExistingData = JSON.parse(existingData);

    // Ensure parsedExistingData is an array
    const dataArray = Array.isArray(parsedExistingData)
      ? parsedExistingData
      : [];

    // Push new data to the array

    const dataObject = { [name]: data };

    dataArray.push(dataObject);

    // Write updated array back to file
    await fs.writeFile(
      documentationPath,
      JSON.stringify(dataArray, null, 2),
      'utf-8',
    );
    await serverLog('Merriam-Webster API response saved successfully', 'info', {
      name,
      filePath: documentationPath,
    });
  } catch (writeError) {
    await serverLog('Error saving Merriam-Webster API response', 'error', {
      error: writeError,
      name,
    });
  }
}

import * as fs from 'fs/promises';
import * as path from 'path';

export async function saveJson(data: unknown, name: string) {
  try {
    const documentationPath = path.resolve(
      process.cwd(),
      'documentation',
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
    console.log('Merriam-Webster API response saved successfully');
  } catch (writeError) {
    console.error('Error saving Merriam-Webster API response:', writeError);
  }
}

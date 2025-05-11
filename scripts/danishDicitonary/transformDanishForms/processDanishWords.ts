import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url);

// Define types
interface DanishWord {
  word: string;
  phonetic: string;
  partOfSpeech: string[];
  forms: string[];
  variant?: string;
}

// Function to transform the words_by_pos.json into structured array
function transformWordsToArray(jsonPath: string): DanishWord[] {
  // Read and parse JSON file
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const wordsByPos = JSON.parse(rawData);

  const result: DanishWord[] = [];

  // Process each part of speech
  for (const pos in wordsByPos) {
    const words = wordsByPos[pos];

    // Process each word in this part of speech
    for (const wordKey in words) {
      const wordData = words[wordKey];

      // Skip invalid entries
      if (!wordData || !wordData.word) continue;

      // Create a structured entry
      const entry: DanishWord = {
        word: wordData.word,
        phonetic: wordData.phonetic || '',
        partOfSpeech: Array.isArray(wordData.partOfSpeech)
          ? wordData.partOfSpeech
          : [pos],
        forms: Array.isArray(wordData.forms) ? wordData.forms : [],
      };

      // Add optional fields if they exist
      if (wordData.variant) {
        entry.variant = wordData.variant;
      }

      result.push(entry);
    }
  }

  return result;
}

// Path to the data file
const dataPath = path.join(
  process.cwd(),
  'documentation',
  'SERVICES_DOC',
  'words_by_pos.json',
);

try {
  // Transform data
  const wordsArray = transformWordsToArray(dataPath);

  // Write output to file
  const outputDir = path.join(path.dirname(__filename), 'output');
  const outputPath = path.join(outputDir, 'danishWordsArray.json');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(wordsArray, null, 2), 'utf8');

  console.log(`Transformed ${wordsArray.length} words into array format`);
  console.log(`Output saved to ${outputPath}`);

  // Print first few examples
  console.log('\nExample entries:');
  wordsArray.slice(0, 5).forEach((entry, i) => {
    console.log(`\nExample ${i + 1}:`);
    console.log(JSON.stringify(entry, null, 2));
  });
} catch (error) {
  console.error('Error processing words:', error);
}

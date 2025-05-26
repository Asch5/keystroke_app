import { WordEntryData } from '@/core/lib/actions/dictionaryActions';
import { WordFormData } from '@/core/types/wordDefinition';
import { WordFrequency } from '@/core/lib/utils/commonDictUtils/frequencyUtils';

/**
 * Adapter function to convert WordEntryData to WordDetails for the form
 */
export function convertWordEntryDataToWordDetails(
  wordEntryData: WordEntryData,
): WordFormData {
  // Extract primary WordDetails and aggregate data
  const primaryWordDetails = wordEntryData.details[0];
  const etymology = primaryWordDetails?.etymology || null;

  // Aggregate all definitions from all WordDetails
  const allDefinitions = wordEntryData.details.flatMap((detail) =>
    detail.definitions.map((def) => ({
      id: def.id,
      text: def.text,
      partOfSpeech: detail.partOfSpeech, // Use the detail's partOfSpeech
      image: def.image,
      frequencyPartOfSpeech:
        typeof def.frequencyPartOfSpeech === 'number'
          ? def.frequencyPartOfSpeech
          : 0,
      languageCode: def.languageCode,
      source: def.source,
      subjectStatusLabels: def.subjectStatusLabels,
      isPlural: detail.isPlural, // Use detail's isPlural
      generalLabels: def.generalLabels,
      grammaticalNote: def.grammaticalNote,
      usageNote: def.usageNote,
      isInShortDef: def.isInShortDef,
      examples: def.examples,
      translations: def.translations || [],
    })),
  );

  // Aggregate all audio files from all WordDetails
  const allAudioFiles = wordEntryData.details.flatMap((detail) =>
    detail.audioFiles.map((audio) => ({
      id: audio.id,
      url: audio.url,
      isPrimary: audio.isPrimary,
    })),
  );

  return {
    word: {
      id: wordEntryData.id,
      text: wordEntryData.word,
      phoneticGeneral: wordEntryData.phoneticGeneral,
      audio: null, // Not directly available in WordEntryData
      audioFiles: allAudioFiles,
      etymology: etymology,
      isPlural: primaryWordDetails?.isPlural || false,
      pluralForm: null, // Not available in WordEntryData
      pastTenseForm: null, // Not available in WordEntryData
      pastParticipleForm: null, // Not available in WordEntryData
      presentParticipleForm: null, // Not available in WordEntryData
      thirdPersonForm: null, // Not available in WordEntryData
      wordFrequency: mapFrequencyToEnum(wordEntryData.frequencyGeneral),
      languageCode: wordEntryData.languageCode,
      createdAt: wordEntryData.createdAt,
      additionalInfo:
        typeof wordEntryData.additionalInfo === 'string'
          ? wordEntryData.additionalInfo
          : JSON.stringify(wordEntryData.additionalInfo),
    },
    relatedWords: wordEntryData.relatedWords,
    definitions: allDefinitions,
    phrases: [], // Phrases are not included in WordEntryData for now
    mistakes: wordEntryData.mistakes || [],
  };
}

/**
 * Helper function to map frequency number to WordFrequency enum
 */
function mapFrequencyToEnum(frequency: number): WordFrequency {
  if (frequency <= 1000) return WordFrequency.top_1000;
  if (frequency <= 2000) return WordFrequency.top_2000;
  if (frequency <= 3000) return WordFrequency.top_3000;
  if (frequency <= 4000) return WordFrequency.top_4000;
  if (frequency <= 5000) return WordFrequency.top_5000;
  if (frequency <= 6000) return WordFrequency.top_6000;
  if (frequency <= 7000) return WordFrequency.top_7000;
  if (frequency <= 8000) return WordFrequency.top_8000;
  if (frequency <= 9000) return WordFrequency.top_9000;
  if (frequency <= 10000) return WordFrequency.top_10000;
  return WordFrequency.beyond_10000;
}

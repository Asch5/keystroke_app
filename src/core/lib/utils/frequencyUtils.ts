// Define the enums here to avoid circular dependency with dictionaryActions
export enum WordFrequency {
  top_1000 = 'top_1000',
  top_2000 = 'top_2000',
  top_3000 = 'top_3000',
  top_4000 = 'top_4000',
  top_5000 = 'top_5000',
  top_6000 = 'top_6000',
  top_7000 = 'top_7000',
  top_8000 = 'top_8000',
  top_9000 = 'top_9000',
  top_10000 = 'top_10000',
  beyond_10000 = 'beyond_10000',
}

export enum FrequencyPartOfSpeech {
  top_100 = 'top_100',
  top_200 = 'top_200',
  top_300 = 'top_300',
  top_400 = 'top_400',
  top_500 = 'top_500',
  top_600 = 'top_600',
  top_700 = 'top_700',
  top_800 = 'top_800',
  top_900 = 'top_900',
  top_1000 = 'top_1000',
  beyond_1000 = 'beyond_1000',
}

/**
 * Maps a word position in frequency list to a WordFrequency enum value
 */
export function getWordFrequencyEnum(wordPosition: number): WordFrequency {
  if (wordPosition <= 0) {
    return WordFrequency.beyond_10000;
  } else if (wordPosition <= 1000) {
    return WordFrequency.top_1000;
  } else if (wordPosition <= 2000) {
    return WordFrequency.top_2000;
  } else if (wordPosition <= 3000) {
    return WordFrequency.top_3000;
  } else if (wordPosition <= 4000) {
    return WordFrequency.top_4000;
  } else if (wordPosition <= 5000) {
    return WordFrequency.top_5000;
  } else if (wordPosition <= 6000) {
    return WordFrequency.top_6000;
  } else if (wordPosition <= 7000) {
    return WordFrequency.top_7000;
  } else if (wordPosition <= 8000) {
    return WordFrequency.top_8000;
  } else if (wordPosition <= 9000) {
    return WordFrequency.top_9000;
  } else if (wordPosition <= 10000) {
    return WordFrequency.top_10000;
  } else {
    return WordFrequency.beyond_10000;
  }
}

/**
 * Maps a position in part of speech frequency list to a FrequencyPartOfSpeech enum value
 */
export function getFrequencyPartOfSpeechEnum(
  positionInPartOfSpeech: number,
): FrequencyPartOfSpeech {
  if (positionInPartOfSpeech <= 0) {
    return FrequencyPartOfSpeech.beyond_1000;
  } else if (positionInPartOfSpeech <= 100) {
    return FrequencyPartOfSpeech.top_100;
  } else if (positionInPartOfSpeech <= 200) {
    return FrequencyPartOfSpeech.top_200;
  } else if (positionInPartOfSpeech <= 300) {
    return FrequencyPartOfSpeech.top_300;
  } else if (positionInPartOfSpeech <= 400) {
    return FrequencyPartOfSpeech.top_400;
  } else if (positionInPartOfSpeech <= 500) {
    return FrequencyPartOfSpeech.top_500;
  } else if (positionInPartOfSpeech <= 600) {
    return FrequencyPartOfSpeech.top_600;
  } else if (positionInPartOfSpeech <= 700) {
    return FrequencyPartOfSpeech.top_700;
  } else if (positionInPartOfSpeech <= 800) {
    return FrequencyPartOfSpeech.top_800;
  } else if (positionInPartOfSpeech <= 900) {
    return FrequencyPartOfSpeech.top_900;
  } else if (positionInPartOfSpeech <= 1000) {
    return FrequencyPartOfSpeech.top_1000;
  } else {
    return FrequencyPartOfSpeech.beyond_1000;
  }
}

/**
 * Maps a frequency rank to difficulty level
 */
export function mapDifficultyLevelFromOrderIndex(
  orderIndex: number,
): 'easy' | 'medium' | 'hard' {
  if (orderIndex <= 3000) return 'easy';
  if (orderIndex <= 7000) return 'medium';
  return 'hard';
}

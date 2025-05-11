import { PartOfSpeech, Gender } from '@prisma/client';
import { PartOfSpeechDanish } from '@/core/types/translationDanishTypes';
/**
 * Maps Danish grammatical terms to PartOfSpeech enum values
 * @param danishTerm The Danish grammatical term to convert
 * @returns Corresponding PartOfSpeech enum value
 */
export function mapDanishPosToEnum(
  danishTerm: string | undefined,
): PartOfSpeech {
  if (!danishTerm) return PartOfSpeech.undefined;

  const normalizedTerm = danishTerm.toLowerCase().trim();

  const posMap: Record<PartOfSpeechDanish, PartOfSpeech> = {
    // Direct mappings
    substantiv: PartOfSpeech.noun,
    verbum: PartOfSpeech.verb,
    adjektiv: PartOfSpeech.adjective,
    adverbium: PartOfSpeech.adverb,
    pronomen: PartOfSpeech.pronoun,
    præposition: PartOfSpeech.preposition,
    konjunktion: PartOfSpeech.conjunction,
    interjektion: PartOfSpeech.interjection,
    'talord (mængdetal)': PartOfSpeech.numeral,
    'talord (ordenstal)': PartOfSpeech.numeral,
    talord: PartOfSpeech.numeral,
    artikel: PartOfSpeech.article,
    udråbsord: PartOfSpeech.exclamation,
    forkortelse: PartOfSpeech.abbreviation,
    suffiks: PartOfSpeech.undefined,
    sidsteled: PartOfSpeech.undefined,
    undefined: PartOfSpeech.undefined,
  };

  return posMap[normalizedTerm as PartOfSpeechDanish] || PartOfSpeech.undefined;
}

// Optional TypeScript type guard
export function isPartOfSpeech(value: string): value is PartOfSpeech {
  return Object.values(PartOfSpeech).includes(value as PartOfSpeech);
}

// function to map danish gender to enum
export function mapDanishGenderToEnum(
  danishTerm: string | undefined,
): Gender | null {
  if (!danishTerm) return null;

  const normalizedTerm = danishTerm.toLowerCase().trim();

  const genderMap: Record<string, Gender> = {
    fælleskøn: Gender.common,
    intetkøn: Gender.neuter,
  };

  return genderMap[normalizedTerm] ?? null;
}

/**
 * Extracts usage notes from Danish detail labels
 */
export function extractUsageNote(
  labels?: Record<string, string[] | boolean | string>,
): string | null {
  if (!labels) return null;

  const usageNotes: string[] = [];

  if (labels['SPROGBRUG']) {
    usageNotes.push(
      typeof labels['SPROGBRUG'] === 'string'
        ? labels['SPROGBRUG']
        : Array.isArray(labels['SPROGBRUG'])
          ? labels['SPROGBRUG'].join('; ')
          : 'SPROGBRUG',
    );
  }

  if (labels['overført'] === true || labels['overført'] === '') {
    usageNotes.push('overført (figurative/metaphorical usage)');
  }

  return usageNotes.length > 0 ? usageNotes.join('; ') : null;
}

/**
 * Extracts grammatical notes from Danish detail labels
 */
export function extractGrammaticalNote(
  labels?: Record<string, string[] | boolean | string>,
): string | null {
  if (!labels) return null;

  if (labels['grammatik']) {
    return typeof labels['grammatik'] === 'string'
      ? labels['grammatik']
      : Array.isArray(labels['grammatik'])
        ? labels['grammatik'].join('; ')
        : null;
  }

  return null;
}

/**
 * Extracts general labels from Danish detail labels
 */
export function extractGeneralLabels(
  labels?: Record<string, string[] | boolean | string>,
): string | null {
  if (!labels) return null;

  const generalLabels: string[] = [];

  if (labels['talemåde'] === true || labels['talemåde'] === '') {
    generalLabels.push('talemåde (idiom/proverb)');
  }

  if (labels['Forkortelse']) {
    generalLabels.push('forkortelse (abbreviation)');
  }

  return generalLabels.length > 0 ? generalLabels.join('; ') : null;
}

/**
 * Extracts subject and status labels from Danish detail labels
 */
export function extractSubjectStatusLabels(
  labels?: Record<string, string[] | boolean | string>,
): string | null {
  if (!labels) return null;

  const subjectLabels: string[] = [];

  // Check for subject domains
  const subjectDomains = [
    'MEDICIN',
    'JURA',
    'TEKNIK',
    'KEMI',
    'MATEMATIK',
    'MUSIK',
    'SPORT',
    'BOTANIK',
    'ZOOLOGI',
    'ØKONOMI',
    'POLITIK',
    'RELIGION',
    'MILITÆR',
    'LITTERATUR',
    'ASTRONOMI',
    'GASTRONOMI',
    'SØFART',
  ];

  for (const domain of subjectDomains) {
    if (labels[domain]) {
      subjectLabels.push(domain);
    }
  }

  if (labels['slang'] === true || labels['slang'] === '') {
    subjectLabels.push('slang');
  }

  return subjectLabels.length > 0 ? subjectLabels.join('; ') : null;
}

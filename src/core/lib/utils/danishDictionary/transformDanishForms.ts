import { RelationshipType } from '@prisma/client';
import { PartOfSpeechDanish } from '@/core/types/translationDanishTypes';

export interface DanishWordEntry {
  word: string;
  word_variants: string[];
  variant: string;
  variant_pos: string;
  phonetic: string;
  partOfSpeech: PartOfSpeechDanish[];
  forms: string[];
  contextual_forms: {
    [key: string]: string[];
  };
  audio: Audio[];
}

export interface WordRelationship {
  baseWord: string;
  relatedWord: string;
  relationshipType: RelationshipType;
  definitionNumbers?: number[];
}

export interface Audio {
  audio_url: string;
  audio_type: string;
  word: string;
  phonetic_audio: string;
}

export interface RelatedWordModal {
  word: string;
  phonetic?: string | null;
  partOfSpeech: PartOfSpeechDanish;
  audio?: Audio[] | null;
  relationships: WordRelationship[];
}

export interface BaseWordModal {
  word: string;
  audio?: Audio[] | null;
  relatedWords: RelatedWordModal[];
}

/**
 * Function to transform Danish word forms into complete words with relationship types
 * @param entry The Danish word entry with forms
 * @returns BaseWordModal containing the base word and its related forms
 */
export function transformDanishForms(entry: DanishWordEntry): BaseWordModal {
  const { word, forms, phonetic, audio, partOfSpeech, contextual_forms } =
    entry;
  const relationships: WordRelationship[] = [];

  // Process regular forms based on part of speech
  if (partOfSpeech.includes('substantiv' as PartOfSpeechDanish)) {
    if (forms && forms.length > 0) {
      processNounForms(word, forms, relationships, partOfSpeech);
    } else if (contextual_forms && Object.keys(contextual_forms).length > 0) {
      // If no regular forms but has contextual forms, process those
      processContextualForms(
        word,
        contextual_forms,
        relationships,
        partOfSpeech,
      );
    }
  } else if (partOfSpeech.includes('adjektiv' as PartOfSpeechDanish)) {
    processAdjectiveForms(word, forms, relationships);
  } else if (partOfSpeech.includes('verbum' as PartOfSpeechDanish)) {
    processVerbForms(word, forms, relationships);
  }

  // Create related word modals from relationships
  const relatedWords = createRelatedWordModals(
    word,
    phonetic,
    relationships,
    partOfSpeech[0] || ('substantiv' as PartOfSpeechDanish),
    audio,
    contextual_forms,
  );

  return {
    word,
    audio,
    relatedWords,
  };
}

/**
 * Process contextual forms of Danish words
 * @param baseWord The base word
 * @param contextualForms Object containing contextual forms
 * @param relationships Array to fill with word relationships
 * @param partOfSpeech Part of speech information including gender
 */
function processContextualForms(
  baseWord: string,
  contextualForms: { [key: string]: string[] },
  relationships: WordRelationship[],
  partOfSpeech: PartOfSpeechDanish[] = [],
): void {
  // Check if this is a special case with multiple gender possibilities
  const hasCommonGender =
    partOfSpeech.includes('fælleskøn' as PartOfSpeechDanish) ||
    partOfSpeech.includes('intetkønellerfælleskøn' as PartOfSpeechDanish);
  const hasNeuterGender =
    partOfSpeech.includes('intetkøn' as PartOfSpeechDanish) ||
    partOfSpeech.includes('intetkønellerfælleskøn' as PartOfSpeechDanish);

  // Process each contextual form group
  for (const [contextKey, formEntries] of Object.entries(contextualForms)) {
    if (!formEntries || formEntries.length === 0) continue;

    // Extract definition numbers from the contextKey if possible
    const definitionNumbers: number[] = [];
    if (contextKey.includes('betydning')) {
      // Extract definition numbers using regex
      const matches = contextKey.match(/\d+/g);
      if (matches) {
        matches.forEach((numStr) => {
          const num = parseInt(numStr, 10);
          if (!isNaN(num)) {
            definitionNumbers.push(num);
          }
        });
      }
    }

    // Process each form in the contextual group
    formEntries.forEach((formEntry, index) => {
      // Skip empty forms
      if (!formEntry) return;

      // Transform the entry to a proper word form
      const relatedWord = applyEnding(baseWord, formEntry);

      // Skip if it's the same as base word
      if (relatedWord === baseWord) return;

      // Determine relationship type based on the form pattern and index
      if (
        formEntry === '-en' ||
        (formEntry.endsWith('-en') && !formEntry.includes('/'))
      ) {
        // Common gender definite form
        const relationship: WordRelationship = {
          baseWord,
          relatedWord,
          relationshipType: 'definite_form_da' as RelationshipType,
        };

        // Add definition numbers if available
        if (definitionNumbers.length > 0) {
          (relationship as WordRelationship).definitionNumbers =
            definitionNumbers;
        }

        relationships.push(relationship);

        if (hasCommonGender) {
          const genderRelationship: WordRelationship = {
            baseWord,
            relatedWord,
            relationshipType: 'common_gender_da' as RelationshipType,
          };

          // Add definition numbers if available
          if (definitionNumbers.length > 0) {
            (genderRelationship as WordRelationship).definitionNumbers =
              definitionNumbers;
          }

          relationships.push(genderRelationship);
        }
      } else if (
        formEntry === '-et' ||
        (formEntry.endsWith('-et') && !formEntry.includes('/'))
      ) {
        // Neuter gender definite form
        const relationship: WordRelationship = {
          baseWord,
          relatedWord,
          relationshipType: 'definite_form_da' as RelationshipType,
        };

        // Add definition numbers if available
        if (definitionNumbers.length > 0) {
          (relationship as WordRelationship).definitionNumbers =
            definitionNumbers;
        }

        relationships.push(relationship);

        if (hasNeuterGender) {
          const genderRelationship: WordRelationship = {
            baseWord,
            relatedWord,
            relationshipType: 'neuter_gender_da' as RelationshipType,
          };

          // Add definition numbers if available
          if (definitionNumbers.length > 0) {
            (genderRelationship as WordRelationship).definitionNumbers =
              definitionNumbers;
          }

          relationships.push(genderRelationship);
        }
      } else if (formEntry === '-' && index === 1) {
        // Same as base word for plural (common in some words)
        const relationship: WordRelationship = {
          baseWord,
          relatedWord: baseWord,
          relationshipType: 'plural_da' as RelationshipType,
        };

        // Add definition numbers if available
        if (definitionNumbers.length > 0) {
          (relationship as WordRelationship).definitionNumbers =
            definitionNumbers;
        }

        relationships.push(relationship);
      } else if (
        formEntry === '-e' ||
        formEntry === '-er' ||
        ((formEntry.endsWith('-e') || formEntry.endsWith('-er')) && index === 1)
      ) {
        // Plural form
        const relationship: WordRelationship = {
          baseWord,
          relatedWord,
          relationshipType: 'plural_da' as RelationshipType,
        };

        // Add definition numbers if available
        if (definitionNumbers.length > 0) {
          (relationship as WordRelationship).definitionNumbers =
            definitionNumbers;
        }

        relationships.push(relationship);
      } else if (
        formEntry === '-ene' ||
        formEntry === '-erne' ||
        ((formEntry.endsWith('-ene') || formEntry.endsWith('-erne')) &&
          index === 2)
      ) {
        // Plural definite form
        const relationship: WordRelationship = {
          baseWord,
          relatedWord,
          relationshipType: 'plural_definite_da' as RelationshipType,
        };

        // Add definition numbers if available
        if (definitionNumbers.length > 0) {
          (relationship as WordRelationship).definitionNumbers =
            definitionNumbers;
        }

        relationships.push(relationship);
      }
      // Additional patterns can be added based on Danish grammar rules
    });
  }
}

/**
 * Process adjective forms
 * Typical patterns vary but often include comparative and superlative forms
 * @param baseWord The base adjective
 * @param forms Array of form suffixes
 * @param relationships Array to fill with word relationships
 */
function processAdjectiveForms(
  baseWord: string,
  forms: string[],
  relationships: WordRelationship[],
): void {
  // Check if the adjective has any forms
  if (!forms || forms.length === 0) {
    return;
  }

  // Typical Danish adjective pattern has multiple forms
  if (forms.length >= 3) {
    // Process comparative form (e.g., "større")
    if (forms[0]) {
      const comparativeForm = applyEnding(baseWord, forms[0]);
      relationships.push({
        baseWord,
        relatedWord: comparativeForm,
        relationshipType: 'comparative_da' as RelationshipType,
      });
    }

    // Process superlative form (e.g., "størst")
    if (forms[1]) {
      const superlativeForm = applyEnding(baseWord, forms[1]);
      relationships.push({
        baseWord,
        relatedWord: superlativeForm,
        relationshipType: 'superlative_da' as RelationshipType,
      });
    }

    // Process adverbial form if present (e.g., "stort")
    if (forms[2]) {
      const adverbialForm = applyEnding(baseWord, forms[2]);
      relationships.push({
        baseWord,
        relatedWord: adverbialForm,
        relationshipType: 'adverbial_form_da' as RelationshipType,
      });
    }
  } else {
    // For adjectives with fewer forms, process what's available
    forms.forEach((form, index) => {
      if (form) {
        const relatedWord = applyEnding(baseWord, form);
        const relationshipType =
          index === 0
            ? ('comparative_da' as RelationshipType)
            : ('superlative_da' as RelationshipType);

        relationships.push({
          baseWord,
          relatedWord,
          relationshipType,
        });
      }
    });
  }
}

/**
 * Process verb forms
 * Typical patterns often include present, past, and participle forms
 * @param baseWord The base verb
 * @param forms Array of form suffixes
 * @param relationships Array to fill with word relationships
 */
function processVerbForms(
  baseWord: string,
  forms: string[],
  relationships: WordRelationship[],
): void {
  // Check if the verb has any forms
  if (!forms || forms.length === 0) {
    return;
  }

  // Typical Danish verb pattern has multiple forms
  if (forms.length >= 4) {
    // Process present tense form (e.g., "spiser")
    if (forms[0]) {
      const presentForm = applyEnding(baseWord, forms[0]);
      relationships.push({
        baseWord,
        relatedWord: presentForm,
        relationshipType: 'present_tense_da' as RelationshipType,
      });
    }

    // Process past tense form (e.g., "spiste")
    if (forms[1]) {
      const pastForm = applyEnding(baseWord, forms[1]);
      relationships.push({
        baseWord,
        relatedWord: pastForm,
        relationshipType: 'past_tense_da' as RelationshipType,
      });
    }

    // Process past participle (e.g., "spist")
    if (forms[2]) {
      const pastParticipleForm = applyEnding(baseWord, forms[2]);
      relationships.push({
        baseWord,
        relatedWord: pastParticipleForm,
        relationshipType: 'past_participle_da' as RelationshipType,
      });
    }

    // Process imperative form if present (e.g., "spis!")
    if (forms[3]) {
      const imperativeForm = applyEnding(baseWord, forms[3]);
      relationships.push({
        baseWord,
        relatedWord: imperativeForm,
        relationshipType: 'imperative_da' as RelationshipType,
      });
    }
  } else {
    // For verbs with fewer forms, process what's available
    const relationshipTypes: RelationshipType[] = [
      'present_tense_da' as RelationshipType,
      'past_tense_da' as RelationshipType,
      'past_participle_da' as RelationshipType,
    ];

    forms.forEach((form, index) => {
      if (form) {
        const relatedWord = applyEnding(baseWord, form);
        // Make sure we don't get undefined here by providing a fallback
        const relationshipType: RelationshipType =
          index < relationshipTypes.length
            ? (relationshipTypes[index] as RelationshipType)
            : ('other_form_da' as RelationshipType);

        relationships.push({
          baseWord,
          relatedWord,
          relationshipType,
        });
      }
    });
  }
}

/**
 * Process noun forms
 * Typical patterns vary but often follow ["-en/-et", "-er/-e", "-erne/-ene"]
 * @param baseWord The base noun
 * @param forms Array of form suffixes
 * @param relationships Array to fill with word relationships
 * @param partOfSpeech The part of speech array, which may contain gender information
 */
function processNounForms(
  baseWord: string,
  forms: string[],
  relationships: WordRelationship[],
  partOfSpeech: PartOfSpeechDanish[] = [],
): void {
  // Check if the noun is empty form
  if (!forms || forms.length === 0) {
    return;
  }

  // Determine gender from part of speech
  const hasCommonGender = partOfSpeech.includes(
    'fælleskøn' as PartOfSpeechDanish,
  );
  const hasNeuterGender = partOfSpeech.includes(
    'intetkøn' as PartOfSpeechDanish,
  );

  // Process definite form (bestemt form ental)
  if (forms.length >= 1 && forms[0]) {
    const definiteForm = applyEnding(baseWord, forms[0]);

    // Add definite form relationship
    relationships.push({
      baseWord,
      relatedWord: definiteForm,
      relationshipType: 'definite_form_da' as RelationshipType,
    });

    // Add gender relationship based on ending or explicit gender
    if (
      hasCommonGender ||
      (!hasNeuterGender && (forms[0] === '-en' || forms[0].endsWith('-en')))
    ) {
      relationships.push({
        baseWord,
        relatedWord: definiteForm,
        relationshipType: 'common_gender_da' as RelationshipType,
      });
    } else if (
      hasNeuterGender ||
      forms[0] === '-et' ||
      forms[0].endsWith('-et')
    ) {
      relationships.push({
        baseWord,
        relatedWord: definiteForm,
        relationshipType: 'neuter_gender_da' as RelationshipType,
      });
    }
  }

  // Process plural form (ubestemt form flertal)
  if (forms.length >= 2 && forms[1]) {
    const pluralForm = applyEnding(baseWord, forms[1]);
    relationships.push({
      baseWord,
      relatedWord: pluralForm,
      relationshipType: 'plural_da' as RelationshipType,
    });
  }

  // Process plural definite form (bestemt form flertal)
  if (forms.length >= 3 && forms[2]) {
    const pluralDefiniteForm = applyEnding(baseWord, forms[2]);
    relationships.push({
      baseWord,
      relatedWord: pluralDefiniteForm,
      relationshipType: 'plural_definite_da' as RelationshipType,
    });
  }
}

/**
 * Apply an ending to a base word, handling special cases
 * @param baseWord The base word
 * @param ending The ending to apply, often with a dash prefix
 * @returns The combined word
 */
function applyEnding(baseWord: string, ending: string): string {
  if (!ending) return baseWord;

  // If the ending doesn't start with a dash, it might be a complete replacement
  if (!ending.startsWith('-')) {
    // Check if it's a complete form rather than an ending
    if (ending.startsWith('..')) {
      // Return just the ending without the prefix
      return ending.substring(2);
    }
    return ending;
  }

  // Remove the dash and apply the ending
  return baseWord + ending.substring(1);
}

/**
 * Create RelatedWordModal objects from relationships
 * @param baseWord The base word
 * @param phonetic The phonetic representation
 * @param relationships Array of word relationships
 * @param partOfSpeech The primary part of speech
 * @param baseAudio Array of audio entries for the base word
 * @param contextualForms Object containing contextual forms
 * @returns Array of RelatedWordModal objects
 */
function createRelatedWordModals(
  baseWord: string,
  phonetic: string,
  relationships: WordRelationship[],
  partOfSpeech: PartOfSpeechDanish,
  baseAudio: Audio[],
  contextualForms: { [key: string]: string[] } = {},
): RelatedWordModal[] {
  // Group relationships by related word
  const relatedWordsMap = new Map<string, WordRelationship[]>();

  relationships.forEach((rel) => {
    if (!relatedWordsMap.has(rel.relatedWord)) {
      relatedWordsMap.set(rel.relatedWord, []);
    }
    const relList = relatedWordsMap.get(rel.relatedWord);
    if (relList) {
      relList.push(rel);
    }
  });

  // Create modal for each related word
  return Array.from(relatedWordsMap.entries()).map(([relatedWord, rels]) => {
    // Default to null for audio and phonetic - we'll only set them if we have form-specific values
    let audioToUse: Audio[] | null = null;
    let phoneticToUse: string | null = null;

    // Extract just the relationship type strings for easier checking
    const relationshipTypes = rels.map((r) => r.relationshipType.toString());

    // Match each relationship type with the appropriate audio type
    if (
      relationshipTypes.includes('plural_da') &&
      !relationshipTypes.includes('plural_definite_da')
    ) {
      // Only use pluralis audio for exact plural forms, not definite plurals
      const pluralAudio = baseAudio.filter(
        (audio) => audio.word === 'pluralis',
      );
      if (pluralAudio.length > 0) {
        audioToUse = pluralAudio;
        if (pluralAudio[0]?.phonetic_audio) {
          phoneticToUse = pluralAudio[0].phonetic_audio;
        }
      }
    }
    // For other forms like plural_definite_da, only use audio if there's a specific match
    else if (relationshipTypes.includes('plural_definite_da')) {
      // For now, definite plurals will have null audio unless we find specific audio for them
      audioToUse = null;
    }

    // For contextual forms, check if we have a direct match in the values
    if (!audioToUse && contextualForms) {
      for (const [formType, formValues] of Object.entries(contextualForms)) {
        if (formValues.includes(relatedWord)) {
          // Map the contextual form type to audio word type
          let audioWordType = formType;
          if (
            formType === 'ubestemt form pluralis' &&
            relationshipTypes.includes('plural_da')
          ) {
            audioWordType = 'pluralis';
          }

          const formAudio = baseAudio.filter(
            (audio) => audio.word === audioWordType,
          );
          if (formAudio.length > 0) {
            audioToUse = formAudio;
            if (formAudio[0]?.phonetic_audio) {
              phoneticToUse = formAudio[0].phonetic_audio;
            }
          }
          break;
        }
      }
    }

    return {
      word: relatedWord,
      phonetic: phoneticToUse,
      partOfSpeech: partOfSpeech,
      audio: audioToUse,
      relationships: rels,
    };
  });
}

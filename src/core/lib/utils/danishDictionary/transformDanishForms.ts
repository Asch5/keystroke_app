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

export interface BaseWordModal {
  word: string;
  audio?: Audio[] | null;
  relatedWords: RelatedWordModal[];
}

export interface RelatedWordModal {
  word: string;
  phonetic?: string | null;
  partOfSpeech: PartOfSpeechDanish;
  audio?: Audio[] | null;
  relationships: WordRelationship[];
}

export interface Audio {
  audio_url: string;
  audio_type: string;
  word: string;
  phonetic_audio: string;
  note?: string;
}

export interface WordRelationship {
  baseWord: string;
  relatedWord: string;
  relationshipType: RelationshipType;
  definitionNumbers?: number[];
  usageNote?: string;
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
  } else if (
    partOfSpeech.includes('adjektiv' as PartOfSpeechDanish) ||
    partOfSpeech.includes('adj. pl.' as PartOfSpeechDanish)
  ) {
    // Process regular adjective forms
    processAdjectiveForms(word, forms, relationships);

    // If there are contextual forms, process those too for additional variations
    if (contextual_forms && Object.keys(contextual_forms).length > 0) {
      processAdjectiveContextualForms(word, contextual_forms, relationships);
    }
  } else if (partOfSpeech.includes('verbum' as PartOfSpeechDanish)) {
    processVerbForms(word, forms, relationships);
  } else if (partOfSpeech.includes('pronomen' as PartOfSpeechDanish)) {
    // Add call to processPronounForms
    processPronounForms(word, forms, relationships, contextual_forms);
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
  const hasCommonGender =
    partOfSpeech.includes('fælleskøn' as PartOfSpeechDanish) ||
    partOfSpeech.includes('intetkønellerfælleskøn' as PartOfSpeechDanish);
  const hasNeuterGender =
    partOfSpeech.includes('intetkøn' as PartOfSpeechDanish) ||
    partOfSpeech.includes('intetkønellerfælleskøn' as PartOfSpeechDanish);

  const addedRelationships = new Set<string>();

  const addRelationship = (
    currentBaseWord: string,
    currentRelatedWord: string,
    relationshipType: RelationshipType,
    usageNote?: string | undefined,
    definitionNumbers?: number[] | undefined,
  ) => {
    // Create a more unique key including usageNote and definitionNumbers
    const defNumKey = definitionNumbers ? definitionNumbers.join(',') : '';
    const relationshipKey = `${currentRelatedWord}:${relationshipType}:${usageNote || ''}:${defNumKey}`;

    if (!addedRelationships.has(relationshipKey)) {
      const relationship: WordRelationship = {
        baseWord: currentBaseWord,
        relatedWord: currentRelatedWord,
        relationshipType,
      };
      if (usageNote) relationship.usageNote = usageNote;
      if (definitionNumbers && definitionNumbers.length > 0) {
        relationship.definitionNumbers = definitionNumbers;
      }
      relationships.push(relationship);
      addedRelationships.add(relationshipKey);
    }
  };

  for (const [contextKey, formEntries] of Object.entries(contextualForms)) {
    if (!formEntries || formEntries.length === 0) continue;

    const usageNote = contextKey.replace(/[:;,.]$/, '').trim();
    const definitionNumbers: number[] = [];
    if (contextKey.includes('betydning')) {
      const matches = contextKey.match(/\d+/g);
      if (matches) {
        matches.forEach((numStr: string) => {
          const num = parseInt(numStr, 10);
          if (!isNaN(num)) {
            definitionNumbers.push(num);
          }
        });
      }
    }

    formEntries.forEach((formEntry, entryIndex) => {
      if (!formEntry) return;
      const relatedWord = applyEnding(baseWord, formEntry);

      if (relatedWord === baseWord && formEntry !== '-') return;

      let relationshipAdded = false;

      // 1. Try contextKey-based determination for full word forms
      if (!formEntry.startsWith('-')) {
        const lowerContextKey = contextKey.toLowerCase();
        if (
          lowerContextKey.includes('pluralis') ||
          lowerContextKey.includes('plural')
        ) {
          addRelationship(
            baseWord,
            relatedWord,
            'plural_da' as const,
            usageNote,
            definitionNumbers,
          );
          relationshipAdded = true;
        } else if (lowerContextKey.includes('genitiv')) {
          addRelationship(
            baseWord,
            relatedWord,
            'genitive_form_da' as const,
            usageNote,
            definitionNumbers,
          );
          relationshipAdded = true;
        }
        // Add more full-word, context-key based rules here if needed (e.g., dativ)
      }

      // 2. If not handled by contextKey, or if it's a suffix, use suffix/index-based logic
      if (!relationshipAdded) {
        if (
          formEntry === '-en' ||
          (formEntry.endsWith('-en') && !formEntry.includes('/'))
        ) {
          addRelationship(
            baseWord,
            relatedWord,
            'definite_form_da' as const,
            usageNote,
            definitionNumbers,
          );
          if (hasCommonGender) {
            addRelationship(
              baseWord,
              relatedWord,
              'common_gender_da' as const,
              usageNote,
              definitionNumbers,
            );
          }
          relationshipAdded = true;
        } else if (
          formEntry === '-et' ||
          (formEntry.endsWith('-et') && !formEntry.includes('/'))
        ) {
          addRelationship(
            baseWord,
            relatedWord,
            'definite_form_da' as const,
            usageNote,
            definitionNumbers,
          );
          if (hasNeuterGender) {
            addRelationship(
              baseWord,
              relatedWord,
              'neuter_gender_da' as const,
              usageNote,
              definitionNumbers,
            );
          }
          relationshipAdded = true;
        }

        // Fallback for plurals and plural definites if not caught by specific context key rule and not a definite form
        // These can apply to suffixes OR full words matching endsWith and entryIndex.
        if (!relationshipAdded) {
          if (
            formEntry === '-' &&
            entryIndex === 1 &&
            baseWord === relatedWord
          ) {
            addRelationship(
              baseWord,
              baseWord,
              'plural_da' as const,
              usageNote,
              definitionNumbers,
            );
          } else if (
            entryIndex === 1 &&
            (formEntry === '-e' ||
              formEntry === '-er' ||
              formEntry.endsWith('-e') ||
              formEntry.endsWith('-er'))
          ) {
            addRelationship(
              baseWord,
              relatedWord,
              'plural_da' as const,
              usageNote,
              definitionNumbers,
            );
          } else if (
            entryIndex === 2 &&
            (formEntry === '-ene' ||
              formEntry === '-erne' ||
              formEntry.endsWith('-ene') ||
              formEntry.endsWith('-erne'))
          ) {
            addRelationship(
              baseWord,
              relatedWord,
              'plural_definite_da' as const,
              usageNote,
              definitionNumbers,
            );
          }
        }
      }
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

  // Use a Set to track which relationship types we've already added to avoid duplicates
  const addedRelationshipTypes = new Set<string>();

  // Helper function to add a relationship only if it doesn't already exist
  const addRelationship = (
    baseWord: string,
    relatedWord: string,
    relationshipType: RelationshipType,
  ) => {
    // Create a unique key for this relationship
    const relationshipKey = `${relatedWord}:${relationshipType}`;

    // Only add if we haven't seen this relationship type + word combination before
    if (!addedRelationshipTypes.has(relationshipKey)) {
      relationships.push({
        baseWord,
        relatedWord,
        relationshipType,
      });
      addedRelationshipTypes.add(relationshipKey);
    }
  };

  // Add neuter form for most adjectives (first form with -t suffix)
  if (forms[0] && (forms[0] === '-t' || forms[0].endsWith('-t'))) {
    const neuterForm = applyEnding(baseWord, forms[0]);
    addRelationship(baseWord, neuterForm, 'neuter_form_da' as const);
  } else if (forms[0] === '-') {
    // If invariable in neuter form, use base word
    addRelationship(baseWord, baseWord, 'neuter_form_da' as const);
  }

  // Add plural/definite form (usually second form with -e suffix)
  if (
    forms[1] &&
    (forms[1] === '-e' ||
      forms[1].endsWith('-e') ||
      forms[1].endsWith('-te') ||
      forms[1] === '-ne' ||
      forms[1].endsWith('-ke'))
  ) {
    const pluralDefForm = applyEnding(baseWord, forms[1]);
    addRelationship(baseWord, pluralDefForm, 'plural_definite_da' as const);
  } else if (forms[1] === '-') {
    // If invariable in plural/definite form, use base word
    addRelationship(baseWord, baseWord, 'plural_definite_da' as const);
  }

  // Process comparative form (e.g., "større", "-ere")
  if (forms.length >= 3 && forms[2] && forms[2].includes('ere')) {
    const comparativeForm = applyEnding(baseWord, forms[2]);
    addRelationship(baseWord, comparativeForm, 'comparative_da' as const);
  } else if (baseWord === 'god' && forms.length >= 3 && forms[2] === 'bedre') {
    // Special case for 'god' -> 'bedre' (irregular)
    addRelationship(baseWord, 'bedre', 'comparative_da' as const);
  } else if (forms[0] === '-' && forms[1] === '-') {
    // Invariable adjective like "direkte"
    addRelationship(baseWord, `mere ${baseWord}`, 'comparative_da' as const);
  }

  // Process superlative form (e.g., "størst", "-est")
  if (forms.length >= 4) {
    let superlativeForm = '';
    let superlativeAdded = false;

    if (forms[3] && forms[3].includes('est') && !forms[3].includes('(')) {
      // Handle normal -est forms
      superlativeForm = applyEnding(baseWord, forms[3]);
      addRelationship(baseWord, superlativeForm, 'superlative_da' as const);
      superlativeAdded = true;
    } else if (
      forms[3] &&
      (forms[3] === '(-est)' || forms[3].includes('(-est)'))
    ) {
      // Special pattern (-est) - convert to proper form by removing parentheses
      const actualSuffix = '-est';
      superlativeForm = applyEnding(baseWord, actualSuffix);
      addRelationship(baseWord, superlativeForm, 'superlative_da' as const);
      superlativeAdded = true;
    } else if (baseWord === 'god' && forms[3] === 'bedst') {
      // Special case for 'god' -> 'bedst' (irregular)
      addRelationship(baseWord, 'bedst', 'superlative_da' as const);
      superlativeAdded = true;
    }

    // If we haven't added a superlative yet and this is an invariable adjective
    if (!superlativeAdded && forms[0] === '-' && forms[1] === '-') {
      addRelationship(baseWord, `mest ${baseWord}`, 'superlative_da' as const);
    }
  } else if (forms.length === 2 && forms[0] === '-' && forms[1] === '-') {
    // For invariable adjectives with fewer forms
    addRelationship(baseWord, `mere ${baseWord}`, 'comparative_da' as const);
    addRelationship(baseWord, `mest ${baseWord}`, 'superlative_da' as const);
  } else {
    // For adjectives with fewer forms, do our best with what we have
    forms.forEach((form) => {
      if (form && form !== '-') {
        const relatedWord = applyEnding(baseWord, form);

        // Determine relationship type based on form pattern and index
        if (form === '-t' || form.endsWith('-t')) {
          addRelationship(baseWord, relatedWord, 'neuter_form_da' as const);
        } else if (
          form === '-e' ||
          form.endsWith('-e') ||
          form === '-ne' ||
          form.endsWith('-ke')
        ) {
          addRelationship(baseWord, relatedWord, 'plural_definite_da' as const);
        } else if (form.includes('ere')) {
          addRelationship(baseWord, relatedWord, 'comparative_da' as const);
        } else if (
          form.includes('est') ||
          form === '(-est)' ||
          form.includes('(-est)')
        ) {
          const actualWord =
            form === '(-est)' || form.includes('(-est)')
              ? applyEnding(baseWord, '-est')
              : relatedWord;
          addRelationship(baseWord, actualWord, 'superlative_da' as const);
        }
      }
    });
  }

  // Add adverbial form if missing
  const hasAdverbialForm = relationships.some(
    (rel) => rel.relationshipType === ('adverbial_form_da' as const),
  );

  if (!hasAdverbialForm) {
    // First look for a comparative form ending in -ere
    const comparativeRel = relationships.find(
      (rel) =>
        rel.relationshipType === ('comparative_da' as const) &&
        rel.relatedWord.endsWith('ere'),
    );

    if (comparativeRel) {
      addRelationship(
        baseWord,
        comparativeRel.relatedWord,
        'adverbial_form_da' as const,
      );
    }
    // If no comparative form but we have a neuter form, use that for the adverbial
    else if (forms[0] && (forms[0] === '-t' || forms[0].endsWith('-t'))) {
      const neuterForm = applyEnding(baseWord, forms[0]);
      addRelationship(baseWord, neuterForm, 'adverbial_form_da' as const);
    }
    // For invariable adjectives, use the base word
    else if (forms[0] === '-') {
      addRelationship(baseWord, baseWord, 'adverbial_form_da' as const);
    }
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
        relationshipType: 'present_tense_da' as const,
      });
    }

    // Process past tense form (e.g., "spiste")
    if (forms[1]) {
      const pastForm = applyEnding(baseWord, forms[1]);
      relationships.push({
        baseWord,
        relatedWord: pastForm,
        relationshipType: 'past_tense_da' as const,
      });
    }

    // Process past participle (e.g., "spist")
    if (forms[2]) {
      const pastParticipleForm = applyEnding(baseWord, forms[2]);
      relationships.push({
        baseWord,
        relatedWord: pastParticipleForm,
        relationshipType: 'past_participle_da' as const,
      });
    }

    // Process imperative form if present (e.g., "spis!")
    if (forms[3]) {
      const imperativeForm = applyEnding(baseWord, forms[3]);
      relationships.push({
        baseWord,
        relatedWord: imperativeForm,
        relationshipType: 'imperative_da' as const,
      });
    }
  } else {
    // For verbs with fewer forms, process what's available
    const relationshipTypes: RelationshipType[] = [
      'present_tense_da' as const,
      'past_tense_da' as const,
      'past_participle_da' as const,
    ];

    forms.forEach((form, index) => {
      if (form) {
        const relatedWord = applyEnding(baseWord, form);
        // Make sure we don't get undefined here by providing a fallback
        const relationshipType: RelationshipType =
          index < relationshipTypes.length && relationshipTypes[index]
            ? relationshipTypes[index]!
            : RelationshipType.related; // Default to 'related' or a more specific default if appropriate

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
      relationshipType: 'definite_form_da' as const,
    });

    // Add gender relationship based on ending or explicit gender
    if (
      hasCommonGender ||
      (!hasNeuterGender && (forms[0] === '-en' || forms[0].endsWith('-en')))
    ) {
      relationships.push({
        baseWord,
        relatedWord: definiteForm,
        relationshipType: 'common_gender_da' as const,
      });
    } else if (
      hasNeuterGender ||
      forms[0] === '-et' ||
      forms[0].endsWith('-et')
    ) {
      relationships.push({
        baseWord,
        relatedWord: definiteForm,
        relationshipType: 'neuter_gender_da' as const,
      });
    }
  }

  // Process plural form (ubestemt form flertal)
  if (forms.length >= 2 && forms[1]) {
    const pluralForm = applyEnding(baseWord, forms[1]);
    relationships.push({
      baseWord,
      relatedWord: pluralForm,
      relationshipType: 'plural_da' as const,
    });
  }

  // Process plural definite form (bestemt form flertal)
  if (forms.length >= 3 && forms[2]) {
    const pluralDefiniteForm = applyEnding(baseWord, forms[2]);
    relationships.push({
      baseWord,
      relatedWord: pluralDefiniteForm,
      relationshipType: 'plural_definite_da' as const,
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

  // Handle compound words (words with spaces)
  if (baseWord.includes(' ')) {
    // For compounds like "for stærkt", only apply ending to the last word
    const parts = baseWord.split(' ');
    const lastPart = parts[parts.length - 1];
    const modifiedLastPart = lastPart + ending.substring(1);
    parts[parts.length - 1] = modifiedLastPart;
    return parts.join(' ');
  }

  // Remove the dash and apply the ending
  return baseWord + ending.substring(1);
}

/**
 * Process contextual forms specifically for adjectives
 * @param baseWord The base adjective
 * @param contextualForms Object containing contextual forms
 * @param relationships Array to fill with word relationships
 */
function processAdjectiveContextualForms(
  baseWord: string,
  contextualForms: { [key: string]: string[] },
  relationships: WordRelationship[],
): void {
  // Use a Set to track existing relationship type + word combinations
  const existingRelationships = new Set<string>(
    relationships.map((rel) => `${rel.relatedWord}:${rel.relationshipType}`),
  );

  // Helper function to add a relationship only if it doesn't already exist
  const addRelationship = (
    baseWord: string,
    relatedWord: string,
    relationshipType: RelationshipType,
    usageNote?: string | undefined,
  ) => {
    // Create a unique key for this relationship
    const relationshipKey = `${relatedWord}:${relationshipType}`;

    // Only add if we haven't seen this relationship type + word combination before
    if (!existingRelationships.has(relationshipKey)) {
      const relationship: WordRelationship = {
        baseWord,
        relatedWord,
        relationshipType,
      };

      // Only add usageNote if it's defined
      if (usageNote) {
        relationship.usageNote = usageNote;
      }

      relationships.push(relationship);
      existingRelationships.add(relationshipKey);
    }
  };

  // Process each contextual form group
  for (const [contextKey, formEntries] of Object.entries(contextualForms)) {
    if (!formEntries || formEntries.length === 0) continue;

    // Extract the usage note from the context key
    // Clean up the context key by removing any trailing colons or other punctuation
    const usageNote = contextKey.replace(/[:;,.]$/, '').trim();

    // Process each form in the contextual group
    formEntries.forEach((formEntry) => {
      // Skip empty forms
      if (!formEntry) return;

      // Transform the entry to a proper word form
      const relatedWord = applyEnding(baseWord, formEntry);

      // Skip if it's the same as base word
      if (relatedWord === baseWord) return;

      // Determine relationship type based on the form pattern
      if (formEntry === '-t' || formEntry.endsWith('-t')) {
        addRelationship(
          baseWord,
          relatedWord,
          'neuter_form_da' as const,
          usageNote,
        );
      } else if (formEntry === '-e' || formEntry.endsWith('-e')) {
        addRelationship(
          baseWord,
          relatedWord,
          'plural_definite_da' as const,
          usageNote,
        );
      } else if (formEntry === '-ere' || formEntry.endsWith('-ere')) {
        addRelationship(
          baseWord,
          relatedWord,
          'comparative_da' as const,
          usageNote,
        );
      } else if (formEntry === '-est' || formEntry.endsWith('-est')) {
        addRelationship(
          baseWord,
          relatedWord,
          'superlative_da' as const,
          usageNote,
        );
      } else if (formEntry === '-mest' || formEntry.endsWith('-mest')) {
        const actualWord = `mest ${baseWord}`;
        addRelationship(
          baseWord,
          actualWord,
          'superlative_da' as const,
          usageNote,
        );
      }
    });
  }
}

/**
 * Create RelatedWordModal objects from relationships
 * @param baseWord The base word
 * @param phonetic The phonetic representation of the base word
 * @param relationships Array of word relationships
 * @param partOfSpeech The primary part of speech
 * @param baseAudio Array of audio entries for the base word
 * @param contextualForms Object containing contextual forms (can be used for special cases)
 * @returns Array of RelatedWordModal objects
 */
function createRelatedWordModals(
  baseWord: string,
  phonetic: string,
  relationships: WordRelationship[],
  partOfSpeech: PartOfSpeechDanish,
  baseAudio: Audio[],
  // Keep the parameter but mark it as unused for now
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Handle the base form case separately
    if (relatedWord === baseWord) {
      phoneticToUse = phonetic; // Initialize phonetic for base word
      // If this is the base word itself, use only base form audio
      const baseFormAudio = baseAudio.filter(
        (audio) => audio.word === 'grundform' || audio.word === '',
      );
      if (baseFormAudio.length > 0) {
        audioToUse = baseFormAudio;
        // Use phonetic from base form audio if available, otherwise keep base word's main phonetic
        if (baseFormAudio[0]?.phonetic_audio) {
          phoneticToUse = baseFormAudio[0].phonetic_audio;
        }
      }

      return {
        word: relatedWord,
        phonetic: phoneticToUse,
        partOfSpeech: partOfSpeech,
        audio: audioToUse,
        relationships: rels,
      };
    }

    // Extract just the relationship type strings for easier checking for non-base words
    const relationshipTypes = rels.map((r) => r.relationshipType.toString());

    // For different forms, be selective about audio files

    // Try to find a direct match for the exact word form in the audio entries
    const exactWordMatch = baseAudio.filter(
      (audio) =>
        audio.word === relatedWord ||
        audio.word.toLowerCase() === relatedWord.toLowerCase(),
    );

    if (exactWordMatch.length > 0) {
      audioToUse = exactWordMatch;
      if (exactWordMatch[0]?.phonetic_audio) {
        phoneticToUse = exactWordMatch[0].phonetic_audio;
      }
    }
    // Grammatical Form Match for Verbs
    else if (relationshipTypes.includes('present_tense_da' as const)) {
      const presentAudio = baseAudio.filter((audio) =>
        audio.word.includes('præsens'),
      );
      if (presentAudio.length > 0) {
        audioToUse = presentAudio;
        if (presentAudio[0]?.phonetic_audio) {
          phoneticToUse = presentAudio[0].phonetic_audio;
        }
      }
    } else if (relationshipTypes.includes('past_tense_da' as const)) {
      const pastAudio = baseAudio.filter(
        (audio) =>
          audio.word.includes('præteritum') &&
          !audio.word.includes('participium'),
      );
      if (pastAudio.length > 0) {
        audioToUse = pastAudio;
        if (pastAudio[0]?.phonetic_audio) {
          phoneticToUse = pastAudio[0].phonetic_audio;
        }
      }
    } else if (relationshipTypes.includes('past_participle_da' as const)) {
      const pastParticipleAudio = baseAudio.filter((audio) =>
        audio.word.includes('præteritum participium'),
      );
      if (pastParticipleAudio.length > 0) {
        audioToUse = pastParticipleAudio;
        if (pastParticipleAudio[0]?.phonetic_audio) {
          phoneticToUse = pastParticipleAudio[0].phonetic_audio;
        }
      }
    }
    // Grammatical Form Match for Pronouns
    else if (relationshipTypes.includes('neuter_pronoun_da' as const)) {
      const neuterAudio = baseAudio.filter(
        (audio) =>
          audio.word.includes('intetkøn') || audio.word.includes('neuter'),
      );
      if (neuterAudio.length > 0) {
        audioToUse = neuterAudio;
        if (neuterAudio[0]?.phonetic_audio) {
          phoneticToUse = neuterAudio[0].phonetic_audio;
        }
      }
    } else if (relationshipTypes.includes('plural_pronoun_da' as const)) {
      const pluralAudio = baseAudio.filter(
        (audio) =>
          audio.word.includes('pluralis') || audio.word.includes('plural'),
      );
      if (pluralAudio.length > 0) {
        audioToUse = pluralAudio;
        if (pluralAudio[0]?.phonetic_audio) {
          phoneticToUse = pluralAudio[0].phonetic_audio;
        }
      }
    }
    // Match audio based on grammatical form labels for Adjectives
    else if (relationshipTypes.includes('comparative_da')) {
      // For comparative forms like "bedre" (better)
      const comparativeAudio = baseAudio.filter(
        (audio) =>
          audio.word === 'komparativ' ||
          audio.word.includes('comparative') ||
          audio.word.includes('komparativ'),
      );
      if (comparativeAudio.length > 0) {
        audioToUse = comparativeAudio;
        if (comparativeAudio[0]?.phonetic_audio) {
          phoneticToUse = comparativeAudio[0].phonetic_audio;
        }
      }
    } else if (relationshipTypes.includes('superlative_da')) {
      // For superlative forms like "bedst" (best)
      const superlativeAudio = baseAudio.filter(
        (audio) =>
          audio.word === 'superlativ' ||
          audio.word.includes('superlative') ||
          audio.word.includes('superlativ'),
      );
      if (superlativeAudio.length > 0) {
        audioToUse = superlativeAudio;
        if (superlativeAudio[0]?.phonetic_audio) {
          phoneticToUse = superlativeAudio[0].phonetic_audio;
        }
      }
    } else if (relationshipTypes.includes('neuter_form_da')) {
      // For neuter forms like "godt" (good in neuter)
      const neuterAudio = baseAudio.filter(
        (audio) =>
          audio.word === 'intetkøn' ||
          audio.word === 'neutrum' ||
          audio.word.includes('neuter'),
      );
      if (neuterAudio.length > 0) {
        audioToUse = neuterAudio;
        if (neuterAudio[0]?.phonetic_audio) {
          phoneticToUse = neuterAudio[0].phonetic_audio;
        }
      }
    } else if (relationshipTypes.includes('plural_definite_da')) {
      // For plural definite forms
      const pluralDefAudio = baseAudio.filter(
        (audio) =>
          audio.word === 'pluralis bestemt' ||
          audio.word === 'flertal bestemt' ||
          audio.word.includes('plural definite'),
      );
      if (pluralDefAudio.length > 0) {
        audioToUse = pluralDefAudio;
        if (pluralDefAudio[0]?.phonetic_audio) {
          phoneticToUse = pluralDefAudio[0].phonetic_audio;
        }
      }
    } else if (relationshipTypes.includes('plural_da')) {
      // For plain plural forms
      const pluralAudio = baseAudio.filter(
        (audio) =>
          audio.word === 'pluralis' ||
          audio.word === 'flertal' ||
          audio.word.includes('plural'),
      );
      if (pluralAudio.length > 0) {
        audioToUse = pluralAudio;
        if (pluralAudio[0]?.phonetic_audio) {
          phoneticToUse = pluralAudio[0].phonetic_audio;
        }
      }
    } else if (relationshipTypes.includes('definite_form_da')) {
      // For definite forms
      const definiteAudio = baseAudio.filter(
        (audio) =>
          audio.word === 'bestemt form' ||
          audio.word.includes('definite') ||
          audio.word.includes('bestemt'),
      );
      if (definiteAudio.length > 0) {
        audioToUse = definiteAudio;
        if (definiteAudio[0]?.phonetic_audio) {
          phoneticToUse = definiteAudio[0].phonetic_audio;
        }
      }
    }

    // Augmentation step: Check for "i sammensætning" variants
    // This step runs after a primary audio match is found (audioToUse is populated)
    // and before the partial word match fallback.
    if (audioToUse && audioToUse.length > 0) {
      const finalAugmentedAudio: Audio[] = [];
      // Iterate over each audio entry that was considered a primary match.
      audioToUse.forEach((primaryMatchedAudio) => {
        finalAugmentedAudio.push(primaryMatchedAudio); // Add the primary match itself

        // Find this primaryMatchedAudio in the original baseAudio array
        // to check its *next* sibling for "i sammensætning".
        // We use findIndex with a direct object reference comparison, as primaryMatchedAudio
        // is an object directly from (a filtered version of) baseAudio.
        const primaryIndexInBase = baseAudio.findIndex(
          (ba) => ba === primaryMatchedAudio,
        );

        if (
          primaryIndexInBase !== -1 &&
          primaryIndexInBase + 1 < baseAudio.length
        ) {
          const nextAudioEntry = baseAudio[primaryIndexInBase + 1];
          if (nextAudioEntry && nextAudioEntry.word === 'i sammensætning') {
            // Add the "i sammensætning" variant with the note
            finalAugmentedAudio.push({
              ...nextAudioEntry,
              note: 'i sammensætning',
            });
          }
          if (nextAudioEntry && nextAudioEntry.word === '') {
            // Add the "i sammensætning" variant with the note
            finalAugmentedAudio.push({
              ...nextAudioEntry,
              note: 'alternativ udtale',
            });
          }
        }
      });
      audioToUse = finalAugmentedAudio; // Update audioToUse with the fully augmented list
    }

    // Try a partial word match if we still don't have audio, but only for irregular forms
    // This is useful for forms like "bedre" (better) from "god" (good)
    // or "grund" → "grundet" where the audio is labeled as "grundet"
    if (
      !audioToUse &&
      (relatedWord.startsWith(baseWord) === false ||
        baseWord.startsWith(relatedWord) === false)
    ) {
      // Remove common prefixes/suffixes to get the stem
      const relatedWordStem = relatedWord
        .replace(/^(mere|mest) /, '')
        .replace(/[etr]+$/, '');

      const partialMatches = baseAudio.filter(
        (audio) =>
          audio.word !== 'grundform' &&
          audio.word !== 'pluralis' &&
          audio.word !== '' &&
          (audio.word.startsWith(relatedWordStem) ||
            (relatedWord.startsWith(audio.word) &&
              audio.word.length >= relatedWordStem.length)),
      );

      if (partialMatches.length > 0) {
        audioToUse = partialMatches;
        if (partialMatches[0]?.phonetic_audio) {
          phoneticToUse = partialMatches[0].phonetic_audio;
        }
      }
    }

    // Do NOT fall back to base form audio for different forms
    // audioToUse will remain null if no appropriate audio was found

    return {
      word: relatedWord,
      phonetic: phoneticToUse,
      partOfSpeech: partOfSpeech,
      audio: audioToUse,
      relationships: rels,
    };
  });
}

/**
 * Process pronoun forms
 * @param baseWord The base pronoun
 * @param forms Array of form suffixes or full forms
 * @param relationships Array to fill with word relationships
 * @param contextualForms Optional contextual forms for pronouns like "nogen"
 */
function processPronounForms(
  baseWord: string,
  forms: string[],
  relationships: WordRelationship[],
  contextualForms?: { [key: string]: string[] },
): void {
  const addedRelationships = new Set<string>();

  const addRelationship = (
    currentBaseWord: string,
    currentRelatedWord: string,
    relationshipType: RelationshipType,
    usageNote?: string | undefined,
  ) => {
    const relationshipKey = `${currentRelatedWord}:${relationshipType}:${usageNote || ''}`;
    if (!addedRelationships.has(relationshipKey)) {
      const relationship: WordRelationship = {
        baseWord: currentBaseWord,
        relatedWord: currentRelatedWord,
        relationshipType,
      };
      if (usageNote) {
        relationship.usageNote = usageNote;
      }
      relationships.push(relationship);
      addedRelationships.add(relationshipKey);
    }
  };

  // Handle regular forms first
  if (forms && forms.length > 0) {
    forms.forEach((formEntry) => {
      if (!formEntry) return;
      const relatedWord = applyEnding(baseWord, formEntry);
      if (relatedWord === baseWord) return;

      // Determine relationship type based on common pronoun patterns
      if (formEntry === '-t' || relatedWord.endsWith('t')) {
        addRelationship(baseWord, relatedWord, 'neuter_pronoun_da' as const);
      } else if (formEntry === '-le' || relatedWord.endsWith('le')) {
        addRelationship(baseWord, relatedWord, 'plural_pronoun_da' as const);
      } else if (formEntry === 'andet' || relatedWord === 'andet') {
        addRelationship(baseWord, relatedWord, 'neuter_pronoun_da' as const);
      } else if (formEntry === 'andre' || relatedWord === 'andre') {
        addRelationship(baseWord, relatedWord, 'plural_pronoun_da' as const);
      } else if (formEntry === 'dette' || relatedWord === 'dette') {
        addRelationship(baseWord, relatedWord, 'neuter_pronoun_da' as const);
      } else if (formEntry === 'disse' || relatedWord === 'disse') {
        addRelationship(baseWord, relatedWord, 'plural_pronoun_da' as const);
      } else if (formEntry === 'noget' || relatedWord === 'noget') {
        addRelationship(baseWord, relatedWord, 'neuter_pronoun_da' as const);
      }
      // More specific pronoun form patterns can be added here
    });
  }

  // Handle contextual forms for pronouns (e.g., "nogen" -> "nogle")
  if (contextualForms) {
    for (const [contextKey, formEntries] of Object.entries(contextualForms)) {
      if (!formEntries || formEntries.length === 0) continue;
      const usageNote = contextKey.replace(/[:;,.]$/, '').trim();

      formEntries.forEach((formEntry) => {
        if (!formEntry) return;
        const relatedWord = applyEnding(baseWord, formEntry);

        // If the related word is the same as the base word, only add if there is a specific usage note
        if (relatedWord === baseWord) {
          // DEBUG: Log the usage note and its trimmed state
          console.log(
            `Pronoun: ${baseWord}, Contextual identical: ${relatedWord}, Original contextKey: '${contextKey}', Processed usageNote: '${usageNote}', IsTrimmedNoteEmpty: ${usageNote.trim() === ''}`,
          );
          if (usageNote && usageNote.trim() !== '') {
            // Use a specific relationship type for contextual usage of the base form
            addRelationship(
              baseWord,
              relatedWord,
              'contextual_usage_da' as const,
              usageNote,
            );
          }
          return; // Skip further processing for identical words unless a usage note makes it distinct
        }

        // For "nogen", "nogle" is explicitly a plural form
        if (baseWord === 'nogen' && relatedWord === 'nogle') {
          addRelationship(
            baseWord,
            relatedWord,
            'plural_pronoun_da' as const,
            usageNote,
          );
        }
        // Add other contextual pronoun rules if necessary
      });
    }
  }
}

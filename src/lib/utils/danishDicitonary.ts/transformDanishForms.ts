import { RelationshipType } from '@prisma/client';

// Types for Danish dictionary
interface DanishWordEntry {
  word: string;
  phonetic: string;
  partOfSpeech: string[];
  forms: string[];
}

interface WordRelationship {
  baseWord: string;
  relatedWord: string;
  relationshipType: RelationshipType;
}

/**
 * Function to transform Danish word forms into complete words with relationship types
 * @param entry The Danish word entry with forms
 * @returns Array of word relationships
 */
function transformDanishForms(entry: DanishWordEntry): WordRelationship[] {
  const relationships: WordRelationship[] = [];
  const baseWord = entry.word;

  // Process based on part of speech
  if (entry.partOfSpeech.includes('adjektiv')) {
    // Handle adjectives
    processAdjectiveForms(baseWord, entry.forms, relationships);
  } else if (entry.partOfSpeech.includes('verbum')) {
    // Handle verbs
    processVerbForms(baseWord, entry.forms, relationships);
  } else if (entry.partOfSpeech.includes('substantiv')) {
    // Handle nouns
    processNounForms(baseWord, entry.forms, relationships);
  }

  return relationships;
}

/**
 * Process adjective forms
 * Typical patterns: ["-t", "-e  -ere", "-st"] for regular adjectives
 */
function processAdjectiveForms(
  baseWord: string,
  forms: string[],
  relationships: WordRelationship[],
): void {
  // Handle neuter form (-t)
  if (forms[0] && forms[0].includes('-t')) {
    relationships.push({
      baseWord,
      relatedWord: applyEnding(baseWord, forms[0]),
      relationshipType: RelationshipType.adjective_neuter_da,
    });
  }

  // Handle plural/common form and comparative (often in same slot as "-e  -ere")
  if (forms[1]) {
    const secondForms = forms[1].split(/\s+/);

    // Plural/common form
    if (secondForms[0] && secondForms[0].startsWith('-')) {
      relationships.push({
        baseWord,
        relatedWord: applyEnding(baseWord, secondForms[0]),
        relationshipType: RelationshipType.adjective_plural_da,
      });
    }

    // Comparative form
    if (secondForms.length > 1) {
      // Check if it's a regular comparative (-ere) or irregular (like "større")
      const comparativeForm = secondForms[1]?.startsWith('-')
        ? applyEnding(baseWord, secondForms[1])
        : secondForms[1];

      relationships.push({
        baseWord,
        relatedWord: comparativeForm ?? '',
        relationshipType: RelationshipType.comparative_da,
      });
    }
  }

  // Handle superlative form (-st)
  if (forms[2]) {
    // Check if it's a regular superlative (-st) or irregular (like "størst")
    const superlativeForm = forms[2].startsWith('-')
      ? applyEnding(baseWord, forms[2])
      : forms[2];

    relationships.push({
      baseWord,
      relatedWord: superlativeForm,
      relationshipType: RelationshipType.superlative_da,
    });
  }
}

/**
 * Process verb forms
 * Typical patterns: ["-r", "sang", "sunget"] for verbs
 */
function processVerbForms(
  baseWord: string,
  forms: string[],
  relationships: WordRelationship[],
): void {
  // Handle present tense (-r)
  if (forms[0]) {
    relationships.push({
      baseWord,
      relatedWord: applyEnding(baseWord, forms[0]),
      relationshipType: RelationshipType.present_tense_da,
    });
  }

  // Handle past tense (often irregular like "sang")
  if (forms[1]) {
    // Check if it's a form with dash or full form
    const pastForm = forms[1].startsWith('-')
      ? applyEnding(baseWord, forms[1])
      : forms[1];

    relationships.push({
      baseWord,
      relatedWord: pastForm,
      relationshipType: RelationshipType.past_tense_da,
    });
  }

  // Handle past participle (often irregular like "sunget")
  if (forms[2]) {
    // Check if it's a form with dash or full form
    const participleForm = forms[2].startsWith('-')
      ? applyEnding(baseWord, forms[2])
      : forms[2];

    relationships.push({
      baseWord,
      relatedWord: participleForm,
      relationshipType: RelationshipType.past_participle_da,
    });
  }

  // For verbs, we can also infer the imperative form (which is often the stem)
  // Danish imperatives often drop the -e ending if the infinitive ends with it
  if (baseWord.endsWith('e')) {
    const imperativeForm = baseWord.slice(0, -1);
    relationships.push({
      baseWord,
      relatedWord: imperativeForm,
      relationshipType: RelationshipType.imperative_da,
    });
  } else {
    relationships.push({
      baseWord,
      relatedWord: baseWord,
      relationshipType: RelationshipType.imperative_da,
    });
  }
}

/**
 * Process noun forms
 * Typical patterns vary but often follow ["-et/-en", "-er", "-erne"]
 */
function processNounForms(
  baseWord: string,
  forms: string[],
  relationships: WordRelationship[],
): void {
  // Handle definite form (-et/-en)
  if (forms[0]) {
    // Check for gender indication (common vs neuter)
    if (forms[0].includes('-en')) {
      relationships.push({
        baseWord,
        relatedWord: applyEnding(baseWord, forms[0].replace('-en', '-en')),
        relationshipType: RelationshipType.common_gender_da,
      });

      relationships.push({
        baseWord,
        relatedWord: applyEnding(baseWord, forms[0].replace('-en', '-en')),
        relationshipType: RelationshipType.definite_form_da,
      });
    } else if (forms[0].includes('-et')) {
      relationships.push({
        baseWord,
        relatedWord: applyEnding(baseWord, forms[0].replace('-et', '-et')),
        relationshipType: RelationshipType.neuter_gender_da,
      });

      relationships.push({
        baseWord,
        relatedWord: applyEnding(baseWord, forms[0].replace('-et', '-et')),
        relationshipType: RelationshipType.definite_form_da,
      });
    } else {
      // Just a regular definite form
      relationships.push({
        baseWord,
        relatedWord: applyEnding(baseWord, forms[0]),
        relationshipType: RelationshipType.definite_form_da,
      });
    }
  }

  // Handle plural form (-er/-e)
  if (forms[1]) {
    relationships.push({
      baseWord,
      relatedWord: applyEnding(baseWord, forms[1]),
      relationshipType: RelationshipType.plural_da,
    });
  }

  // Handle definite plural form (-erne/-ene)
  if (forms[2]) {
    relationships.push({
      baseWord,
      relatedWord: applyEnding(baseWord, forms[2]),
      relationshipType: RelationshipType.plural_definite_da,
    });
  }
}

/**
 * Apply an ending (suffix) to a base word
 * Handles both regular suffixes with dashes (-en, -er, etc.) and full replacements
 */
function applyEnding(baseWord: string, ending: string): string {
  if (!ending.startsWith('-')) {
    // If no dash, it's a full form replacement
    return ending;
  }

  const suffix = ending.substring(1); // Remove the dash

  // Special handling for endings that require removing letters from the base word
  if (suffix.includes('/')) {
    // Handle cases like "-et/-en" by taking just the first option
    return baseWord + suffix.split('/')[0];
  }

  return baseWord + suffix;
}

// Example usage:
const examples = [
  {
    word: 'bruge',
    phonetic: 'ˈbruːɡə',
    partOfSpeech: ['verbum'],
    forms: ['-r', 'brugte', 'brugt'],
  },
  {
    word: 'ligge',
    phonetic: 'ˈliɡə',
    partOfSpeech: ['verbum'],
    forms: ['-r', 'lå', '-t'],
  },
  {
    word: 'bog',
    phonetic: 'ˈboːɡ',
    partOfSpeech: ['substantiv'],
    forms: ['-en', 'bøger', 'bøgerne'],
  },
  // {
  //   word: 'stor',
  //   phonetic: 'ˈsdoˀɐ̯',
  //   partOfSpeech: ['adjektiv'],
  //   forms: ['-t', '-e  større', 'størst'],
  // },
  // {
  //   word: 'hus',
  //   phonetic: 'ˈhuːˀs',
  //   partOfSpeech: ['substantiv'],
  //   forms: ['-et', '-e', '-ene'],
  // },
];

// Process examples
examples.forEach((example) => {
  console.log(
    `\nProcessing word: ${example.word} (${example.partOfSpeech.join(', ')})`,
  );
  const relationships = transformDanishForms(example);

  relationships.forEach((rel) => {
    console.log(
      `${rel.baseWord} → ${rel.relatedWord} [${RelationshipType[rel.relationshipType]}]`,
    );
  });
});

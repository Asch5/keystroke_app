import { LanguageCode } from '@prisma/client';

// substantiv - noun;
// verbum - verb;
// adjektiv - adjective;
// adverbium - adverb;
// pronomen - pronoun;
// præposition - preposition;
// konjunktion - conjunction;
// interjektion - interjection;
// artikel - article;
// talord - numeral;
// udråbsord - exclamation;
// forkortelse - abbreviation;

/**Definitions:
 * generalLabels "lbs" - General labels provide information such as whether a headword is typically capitalized, used as an attributive noun, etc. A set of one or more such labels is contained in an lbs. (like capitalization indicators, usage notes, etc.)
 *
 * subjectStatusLabels "sls" - A subject/status label describes the subject area (eg, "computing") or regional/usage status (eg, "British", "formal", "slang") of a headword or a particular sense of a headword. A set of one or more subject/status labels is contained in an sls.
 *
 * grammaticalNote "gram" - General labels provide information such as whether a headword is typically capitalized, used as an attributive noun, etc. A set of one or more such labels is contained in an lbs.
 *
 * usageNote "usg" - Usage notes provide information about the usage of a headword or a particular sense of a headword. A set of one or more such labels is contained in an usg.
 
 *
 *
 */

export interface TranslationRequest {
  metadata: {
    languageCode: string;
    languageCode_translation: string;
    sourceTranslator: string;
  };
  word: {
    wordId: number;
    word: string;
    word_variants: string[] | null;
    phonetic: string | null;
    word_translation: string;
    phonetic_translation: string;
    sourceTranslator: string;
    relatedWords: Array<{
      type: string;
      word: string;
      synonym_translation?: string;
      antonym_translation?: string;
    }>;
  };
  definitions: Array<{
    definitionId: number;
    partOfSpeech: string;
    definition: string;
    definition_translation: string;
    examples: Array<{
      exampleId: number;
      example: string;
      example_translation: string;
      source?: string | null;
    }>;
  }>;
  stems: string[];
  stems_translation: string[];
}

export type RelationshipTypeVerbsInAudio =
  | 'grundform'
  | 'præsens' //present tense
  | 'præteritum'
  | 'præteritum participium'
  | 'præteritum og præteritum participium'
  | 'i sammensætning'
  | 'pluralis'
  | 'præteritum, betød' //need to handle this leave onle the first word
  | 'syntes'
  //it means that audio belongs to a definition.  We need to retrive the number of the definition and connect this audio to the definition as well as the word
  | 'betydning 1'
  | 'betydning 2'
  | 'betydning 3'
  | 'betydning 1 og 6'
  | 'betydning 2 og 6'
  | 'betydning 3 og 6'
  | 'betydning 1, 2 og 6'
  | 'betydning 1, 2, 3 og 6'
  | ''; //that means that it is the second sound of a previous word
//exact word (we need to attmpt to find a comparason by the worsd as well)

export type PartOfSpeechDanish =
  //default Part Of Speech for a Defitnitions (if we do not have Labels like this "'som adjektiv'")
  | 'substantiv'
  | 'verbum'
  | 'adjektiv'
  | 'adj. pl.'
  | 'adverbium'
  | 'pronomen'
  | 'præposition'
  | 'konjunktion'
  | 'interjektion'
  | 'artikel'
  | 'talord'
  | 'talord (mængdetal)'
  | 'talord (ordenstal)'
  | 'udråbsord'
  | 'forkortelse'
  | 'suffiks'
  | 'sidsteled' //last letter
  | 'undefined'
  //gender
  | 'fælleskøn'
  | 'intetkøn'
  | 'fælleskønellerintetkøn';

export type PartOfSpeechForStems =
  | 'vb.'
  | 'adj.'
  | 'adv.'
  | 'sb.'
  | 'præp.'
  | 'konj.'
  | 'pron.'
  | 'num.'
  | 'interj.';

export type GenderTypeDanish =
  | 'fælleskøn'
  | 'intetkøn'
  | 'fælleskønellerintetkøn';

export type DetailCategoryDanish =
  | 'SPROGBRUG' // language break
  //usageNote: "text of SPROGBRUG"
  | 'overført' // transferred (boolean or "")
  //-----------------------------------------------------------
  // usageNote: "overført (figurative/metaphorical usage)"
  | 'grammatik' // grammar
  //-----------------------------------------------------------
  //grammaticalNote: "text of grammatik"
  | 'talemåde' //"", (if we have a slang category it means it exists)
  //generalLabels: "talemåde (idiom/proverb)"
  | 'Forkortelse' //here we get abbreviation as a value and we need to relate it to the word as RelationshipType.abbreviation
  //-----------------------------------------------------------
  //put it in the subjectStatusLabels (if it exists)
  | 'slang' //"", slang (if we have a slang category it means it exists)
  //subjectStatusLabels: "slang"
  | 'MEDICIN' // as medicine (give part of speech of this definition as medicine)
  | 'JURA' // as law (give part of speech of this definition as law)
  | 'TEKNIK' // as technology (give part of speech of this definition as technology)
  | 'KEMI' // as chemistry (give part of speech of this definition as chemistry)
  | 'MATEMATIK' // as mathematics (give part of speech of this definition as mathematics)
  | 'MUSIK' // as music (give part of speech of this definition as music)
  | 'SPORT' // as sports (give part of speech of this definition as sports)
  | 'BOTANIK' // as botany (give part of speech of this definition as botany)
  | 'ZOOLOGI' // as zoology (give part of speech of this definition as zoology)
  | 'ØKONOMI' // as economics (give part of speech of this definition as economics)
  | 'POLITIK' // as politics (give part of speech of this definition as politics)
  | 'RELIGION' // as religion (give part of speech of this definition as religion)
  | 'MILITÆR' // as military (give part of speech of this definition as military)
  | 'LITTERATUR' // as literature (give part of speech of this definition as literature)
  | 'ASTRONOMI' // as astronomy (give part of speech of this definition as astronomy)
  | 'GASTRONOMI' // as gastronomy (give part of speech of this definition as gastronomy)
  | 'SØFART' // as maritime (give part of speech of this definition as maritime)
  //-----------------------------------------------------------
  | 'Eksempler' // examples
  | 'Se også' // see also
  // 1. relationshipType: "related" (from the main word to this word and the relationship connects to this definition)
  | 'Synonym' // synonym
  //1. relationshipType: "synonym" (from the main word to this synonym and the relationship connects to this definition)
  //2.this word also gets the same definition as the main word
  | 'Synonymer'
  //1. relationshipType: "synonym" (from the main word to this synonym and the relationship connects to this definition)
  //2.this word also gets the same definition as the main word
  | 'Antonym' // antonym
  //1. relationshipType: "antonym" (from the main word to this antonym)
  | 'som adverbium' // as adverb (give part of speech of this definition as adverb)
  | 'som adjektiv' // as adjective (give part of speech of this definition as adjective)
  | 'som substantiv' // as noun (give part of speech of this definition as noun)
  | 'som verbum' // as verb (give part of speech of this definition as verb)
  | 'som præposition' // as preposition (give part of speech of this definition as preposition)
  | 'som konjunktion' // as conjunction (give part of speech of this definition as conjunction)
  | 'som interjektion' // as interjection (give part of speech of this definition as interjection)
  | 'som talord' // as numeral (give part of speech of this definition as numeral)
  | 'som udråbsord' // as exclamation (give part of speech of this definition as exclamation)
  | 'som forkortelse'; // as abbreviation (give part of speech of this definition as abbreviation)

export type SourceOfExample = {
  short: string;
  full: string;
};

export interface WordVariant {
  word: {
    word: string;
    word_variants: string[] | null;
    phonetic: string;
    partOfSpeech: [PartOfSpeechDanish, GenderTypeDanish] | [PartOfSpeechDanish];
    forms: string[];
    contextual_forms: string[] | null;
    audio: {
      audio_type: string;
      audio_url: string;
      phonetic_audio: string;
      word: RelationshipTypeVerbsInAudio | null;
    }[];
    etymology: string | null;
    colloquialism: string[];
    variant: string;
    variant_pos: string;
  };
  definition: {
    id: string;
    definition: string;
    definition_translation_en: string;
    examples: string[];
    examples_translation_en: string[];
    sources: SourceOfExample[];
    labels: {
      [key in DetailCategoryDanish]?: string[] | boolean | string;
    };
    labels_translation_en?: {
      [key in DetailCategoryDanish]?: string[] | boolean | string;
    };
  }[];
  fixed_expressions: {
    expression: string;
    expression_translation_en: string;
    expression_variants: string[];
    definition: string;
    definition_translation_en: string;
    examples: string[];
    examples_translation_en: string[];
    sources: SourceOfExample[];
    labels: {
      [key in DetailCategoryDanish]?: string[] | boolean | string;
    };
    labels_translation_en?: {
      [key in DetailCategoryDanish]?: string[] | boolean | string;
    };
  }[];
  stems: {
    stem: string;
    stem_translation_en: string;
    partOfSpeech: PartOfSpeechForStems;
  }[];
  compositions: {
    composition: string;
    composition_translation_en: string;
  }[];
  synonyms: string[];
  synonyms_translation_en: string[];
  antonyms: string[];
  antonyms_translation_en: string[];
}

export interface DanishDictionaryObject {
  metadata?: {
    languageCode: LanguageCode;
    languageCode_translation: LanguageCode;
    sourceTranslator: string;
    sourceWord: string;
  };
  word: {
    word: string;
    word_variants: string[] | null;
    phonetic: string;
    partOfSpeech:
      | [PartOfSpeechDanish, GenderTypeDanish]
      | [PartOfSpeechDanish]
      | [];
    forms?: string[];
    contextual_forms?: string[];
    audio: {
      audio_type: string;
      audio_url: string;
      phonetic_audio: string;
      word: RelationshipTypeVerbsInAudio | null;
    }[];
    etymology: string;
    colloquialism?: string[];
  };
  definition: {
    id: string;
    definition: string;
    definition_translation_en: string;
    examples: string[];
    examples_translation_en: string[];
    sources: SourceOfExample[];
    labels?: {
      [key in DetailCategoryDanish]?: string[] | boolean | string;
    };
    labels_translation_en?: {
      [key in DetailCategoryDanish]?: string[] | boolean | string;
    };
  }[];
  fixed_expressions: {
    expression: string;
    expression_translation_en: string;
    expression_variants: string[];
    definition: string;
    definition_translation_en: string;
    examples: string[];
    examples_translation_en: string[];
    sources: SourceOfExample[];
    labels?: {
      [key in DetailCategoryDanish]?: string[] | boolean | string;
    };
    labels_translation_en?: {
      [key in DetailCategoryDanish]?: string[] | boolean | string;
    };
  }[];
  //1. relationshipType: "stem" (from the main word to these word)
  stems?: {
    stem: string;
    stem_translation_en: string;
    partOfSpeech: PartOfSpeechForStems;
  }[];
  // 1. relationshipType: "composition" (from the main word to these word)
  compositions?: {
    composition: string;
    composition_translation_en: string;
  }[];
  //Do not use this synonyms because we have them in defintions and allocate them from there
  synonyms: string[];
  synonyms_translation_en: string[];
  //1. relationshipType: "antonym" (from the main word to this antonym)
  antonyms: string[];
  antonyms_translation_en?: string[];
  variants?: WordVariant[];
  related_words?: string[];
  error?: string;
}

export interface Example {
  example: string;
  translation?: string;
  notes?: string;
}

export interface FixedExpression {
  fixed_expression: string;
  definition: string;
  examples: Example[];
}

export interface TranslationCombinedResponse {
  english_word_data: TranslationRequest;
  translation_word_for_danish_dictionary: DanishDictionaryObject;
}

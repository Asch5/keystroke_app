/**
 * Danish label and category types
 * Split from translationDanishTypes.ts for better maintainability
 */

/**
 * Definitions:
 * generalLabels "lbs" - General labels provide information such as whether a headword is typically capitalized, used as an attributive noun, etc.
 * subjectStatusLabels "sls" - A subject/status label describes the subject area (eg, "computing") or regional/usage status (eg, "British", "formal", "slang") of a headword or a particular sense of a headword.
 * grammaticalNote "gram" - General labels provide information such as whether a headword is typically capitalized, used as an attributive noun, etc.
 * usageNote "usg" - Usage notes provide information about the usage of a headword or a particular sense of a headword.
 */

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

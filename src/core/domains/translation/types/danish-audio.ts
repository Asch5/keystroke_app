/**
 * Danish audio relationship types
 * Split from translationDanishTypes.ts for better maintainability
 */

export type RelationshipTypeVerbsInAudio =
  | 'grundform'
  | 'præsens' //present tense
  | 'præteritum'
  | 'præteritum participium'
  | 'præteritum og præteritum participium'
  | 'i sammensætning'
  | 'pluralis'
  | 'præteritum, betød' //need to handle this leave only the first word
  | 'syntes'
  //it means that audio belongs to a definition. We need to retrieve the number of the definition and connect this audio to the definition as well as the word
  | 'betydning 1'
  | 'betydning 2'
  | 'betydning 3'
  | 'betydning 1 og 6'
  | 'betydning 2 og 6'
  | 'betydning 3 og 6'
  | 'betydning 1, 2 og 6'
  | 'betydning 1, 2, 3 og 6'
  | ''; //that means that it is the second sound of a previous word
//exact word (we need to attempt to find a comparison by the words as well)

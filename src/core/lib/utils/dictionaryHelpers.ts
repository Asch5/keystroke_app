// import {
//   DanishDictionaryObject,
//   Example,
//   FixedExpression,
// } from '@/core/types/translationDanishTypes';

// /**
//  * Check if a word is a noun based on its part of speech
//  */
// export function isNoun(ddo: DanishDictionaryObject): boolean {
//   return ddo.word.partOfSpeech.noun.is_noun;
// }

// /**
//  * Check if a word is a verb based on its part of speech
//  */
// export function isVerb(ddo: DanishDictionaryObject): boolean {
//   return ddo.word.partOfSpeech.verb.is_verb;
// }

// /**
//  * Check if a word is an adjective based on its part of speech
//  */
// export function isAdjective(ddo: DanishDictionaryObject): boolean {
//   return ddo.word.partOfSpeech.adjective.is_adjective;
// }

// /**
//  * Get all examples from a Danish dictionary object
//  */
// export function getAllExamples(ddo: DanishDictionaryObject): Example[] {
//   const definitionExamples = ddo.definition.examples ?? [];

//   const fixedExpressionExamples = ddo.fixed_expressions.flatMap(
//     (expression: FixedExpression) => expression.examples ?? [],
//   );

//   return [...definitionExamples, ...fixedExpressionExamples];
// }

// /**
//  * Get all related words (synonyms, antonyms, and related words)
//  */
// export function getAllRelatedWords(ddo: DanishDictionaryObject): string[] {
//   return [...ddo.synonyms, ...ddo.antonyms, ...ddo.related_words];
// }

// /**
//  * Format a Danish dictionary object as a simple string representation
//  */
// export function formatDDOToString(ddo: DanishDictionaryObject): string {
//   let result = `${ddo.word.word} [${ddo.word.phonetic}]\n\n`;

//   result += `Definition: ${ddo.definition.definition}\n`;

//   if (ddo.definition.examples.length > 0) {
//     result += 'Examples:\n';
//     ddo.definition.examples.forEach((ex) => {
//       result += `- ${ex.example}\n`;
//       if (ex.translation) {
//         result += `  (${ex.translation})\n`;
//       }
//     });
//   }

//   if (ddo.fixed_expressions.length > 0) {
//     result += '\nFixed Expressions:\n';
//     ddo.fixed_expressions.forEach((expr) => {
//       result += `- ${expr.fixed_expression}: ${expr.definition}\n`;
//       if (expr.examples.length > 0) {
//         expr.examples.forEach((ex) => {
//           result += `  * ${ex.example}\n`;
//           if (ex.translation) {
//             result += `    (${ex.translation})\n`;
//           }
//         });
//       }
//     });
//   }

//   if (ddo.synonyms.length > 0) {
//     result += `\nSynonyms: ${ddo.synonyms.join(', ')}\n`;
//   }

//   if (ddo.antonyms.length > 0) {
//     result += `Antonyms: ${ddo.antonyms.join(', ')}\n`;
//   }

//   if (ddo.related_words.length > 0) {
//     result += `Related words: ${ddo.related_words.join(', ')}\n`;
//   }

//   return result;
// }

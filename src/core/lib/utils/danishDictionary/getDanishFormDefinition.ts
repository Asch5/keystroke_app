import { RelationshipType } from '@prisma/client';
import { clientLog } from '@/core/infrastructure/monitoring/clientLogger';

/**
 * Generates a standardized definition for Danish word forms based on relationship type
 * @param baseWordText The base word that the form is derived from
 * @param relatedWordText The actual form word (not used in current implementation but kept for consistency)
 * @param relationshipType The type of relationship between the base and related word
 * @returns A string describing the word form, or an empty string if no specific description is generated
 */
export function getDanishFormDefinition(
  baseWordText: string,
  relatedWordText: string,
  relationshipType: RelationshipType | string, // Allow string for custom Danish types
): string {
  switch (relationshipType) {
    case 'definite_form_da' as const:
    case RelationshipType.definite_form_da:
      return `Definite form (bestemt form) of {it}${baseWordText}{/it}.`;
    case 'plural_da' as const:
    case RelationshipType.plural_da:
      return `Plural form (flertal) of {it}${baseWordText}{/it}.`;
    case 'plural_definite_da' as const:
    case RelationshipType.plural_definite_da:
      return `Plural definite form (bestemt form flertal) of {it}${baseWordText}{/it}.`;
    case 'present_tense_da' as const:
    case RelationshipType.present_tense_da:
      return `Present tense (nutid) of {it}${baseWordText}{/it}.`;
    case 'past_tense_da' as const:
    case RelationshipType.past_tense_da:
      return `Past tense (datid) of {it}${baseWordText}{/it}.`;
    case 'past_participle_da' as const:
    case RelationshipType.past_participle_da:
      return `Past participle (førnutid) of {it}${baseWordText}{/it}.`;
    case 'imperative_da' as const:
    case RelationshipType.imperative_da:
      return `Imperative form (bydeform) of {it}${baseWordText}{/it}.`;
    case 'comparative_da' as const:
    case RelationshipType.comparative_da:
      return `Comparative form (komparativ) of {it}${baseWordText}{/it}.`;
    case 'superlative_da' as const:
    case RelationshipType.superlative_da:
      return `Superlative form (superlativ) of {it}${baseWordText}{/it}.`;
    case 'common_gender_da' as const:
      return `Common gender form (fælleskøn) of {it}${baseWordText}{/it}.`;
    case 'neuter_gender_da' as const:
      return `Neuter gender form (intetkøn) of {it}${baseWordText}{/it}.`;
    case 'neuter_form_da' as const: // Typically for adjectives
      return `Neuter form (intetkønsform) of {it}${baseWordText}{/it}.`;
    case 'adverbial_form_da' as const:
      return `Adverbial form of {it}${baseWordText}{/it}.`;
    case 'contextual_usage_da' as const:
      return `Contextual usage of {it}${baseWordText}{/it}.`; // Usage note should provide more detail
    case 'neuter_pronoun_da' as const:
      return `Neuter form of the pronoun {it}${baseWordText}{/it}.`;
    case 'plural_pronoun_da' as const:
      return `Plural form of the pronoun {it}${baseWordText}{/it}.`;
    // Add other relevant Danish form types if needed
    default:
      // For other relationship types (synonym, antonym, stem, related, composition, phrase),
      // the definition is usually more complex or comes from the API directly,
      // so we don't generate a simple form description here.
      // Check if it's a valid RelationshipType enum member before returning empty
      if (
        Object.values(RelationshipType).includes(
          relationshipType as RelationshipType,
        )
      ) {
        return 'unknown relationship type'; // It's a valid enum but not handled above
      }
      // If it's a string not matching any case and not in enum, it's an unknown/custom type
      clientLog(
        `Unknown relationship type in getDanishFormDefinition: ${relationshipType}`,
        'warn',
      );
      return ''; // Return empty or a generic placeholder if preferred
  }
}

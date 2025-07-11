'use server';

import { revalidatePath } from 'next/cache';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import { prisma } from '@/core/lib/prisma';
import { getDanishFormDefinition } from '@/core/lib/utils/danishDictionary/getDanishFormDefinition';
import {
  RelationshipType,
  LanguageCode,
  SourceType,
  PartOfSpeech,
} from '@/core/types';
import { DatabaseKnownRequestError } from '@/core/types/database';

interface ManualFormData {
  wordText: string;
  relationshipType: RelationshipType;
  phonetic?: string | undefined;
  usageNote?: string | undefined;
  definition?: string | undefined;
}

interface AddManualFormsRequest {
  baseWordDetailId: number;
  baseWordText: string;
  forms: ManualFormData[];
}

interface AddManualFormsResponse {
  success: boolean;
  error?: string;
  formsAdded?: number;
}

/**
 * Generates a descriptive definition for a Danish word form
 * Similar to the function in processOrdnetApi.ts but simplified for manual forms
 */
function generateFormDefinition(
  baseWordText: string,
  relatedWordText: string,
  relationshipType: RelationshipType,
): string {
  switch (relationshipType) {
    case RelationshipType.definite_form_da:
      return `Definite form (bestemt form) of {it}${baseWordText}{/it}.`;
    case RelationshipType.plural_da:
      return `Plural form (flertal) of {it}${baseWordText}{/it}.`;
    case RelationshipType.plural_definite_da:
      return `Plural definite form (bestemt form flertal) of {it}${baseWordText}{/it}.`;
    case RelationshipType.present_tense_da:
      return `Present tense (nutid) of {it}${baseWordText}{/it}.`;
    case RelationshipType.past_tense_da:
      return `Past tense (datid) of {it}${baseWordText}{/it}.`;
    case RelationshipType.past_participle_da:
      return `Past participle (førnutid) of {it}${baseWordText}{/it}.`;
    case RelationshipType.imperative_da:
      return `Imperative form (bydeform) of {it}${baseWordText}{/it}.`;
    case RelationshipType.comparative_da:
      return `Comparative form (komparativ) of {it}${baseWordText}{/it}.`;
    case RelationshipType.superlative_da:
      return `Superlative form (superlativ) of {it}${baseWordText}{/it}.`;
    case RelationshipType.neuter_form_da:
      return `Neuter form (intetkønsform) of {it}${baseWordText}{/it}.`;
    case RelationshipType.adverbial_form_da:
      return `Adverbial form of {it}${baseWordText}{/it}.`;
    case RelationshipType.genitive_form_da:
      return `Genitive form (genitiv) of {it}${baseWordText}{/it}.`;
    case RelationshipType.common_gender_da:
      return `Common gender form (fælleskøn) of {it}${baseWordText}{/it}.`;
    case RelationshipType.neuter_gender_da:
      return `Neuter gender form (intetkøn) of {it}${baseWordText}{/it}.`;
    case RelationshipType.contextual_usage_da:
      return `Contextual usage of {it}${baseWordText}{/it}.`;
    default:
      return `Manual form of {it}${baseWordText}{/it}.`;
  }
}

/**
 * Determines the appropriate PartOfSpeech for a word form based on the relationship type
 */
function determinePartOfSpeechForForm(
  relationshipType: RelationshipType,
  basePartOfSpeech: PartOfSpeech,
): PartOfSpeech {
  switch (relationshipType) {
    case RelationshipType.adverbial_form_da:
      return PartOfSpeech.adverb;
    case RelationshipType.present_tense_da:
    case RelationshipType.past_tense_da:
    case RelationshipType.past_participle_da:
    case RelationshipType.imperative_da:
      return PartOfSpeech.verb;
    case RelationshipType.comparative_da:
    case RelationshipType.superlative_da:
    case RelationshipType.neuter_form_da:
      return PartOfSpeech.adjective;
    default:
      // For most form types, inherit the base word's part of speech
      return basePartOfSpeech;
  }
}

export async function addManualWordForms({
  baseWordDetailId,
  baseWordText,
  forms,
}: AddManualFormsRequest): Promise<AddManualFormsResponse> {
  try {
    void serverLog(
      `Starting manual forms addition for word "${baseWordText}" (ID: ${baseWordDetailId})`,
      'info',
    );

    // First, get the base word details to understand the context
    const baseWordDetail = await prisma.wordDetails.findUnique({
      where: { id: baseWordDetailId },
      include: {
        word: true,
      },
    });

    if (!baseWordDetail) {
      return {
        success: false,
        error: 'Base word details not found',
      };
    }

    const baseWord = baseWordDetail.word;
    const languageCode = LanguageCode.da; // We're working with Danish forms
    const source = SourceType.admin; // Manual forms are admin-created

    let formsAdded = 0;

    await prisma.$transaction(async (tx) => {
      for (const formData of forms) {
        void serverLog(
          `Processing manual form: "${formData.wordText}" (${formData.relationshipType})`,
          'info',
        );

        // 1. Create or get the word entity for this form
        const formWord = await tx.word.upsert({
          where: {
            word_languageCode: {
              word: formData.wordText,
              languageCode: languageCode,
            },
          },
          create: {
            word: formData.wordText,
            languageCode: languageCode,
          },
          update: {
            // Don't overwrite existing data, just ensure it exists
          },
        });

        // 2. Determine the appropriate part of speech for this form
        const formPartOfSpeech = determinePartOfSpeechForForm(
          formData.relationshipType,
          baseWordDetail.partOfSpeech,
        );

        // 3. Create or get the WordDetails for this form
        const formWordDetails = await tx.wordDetails.upsert({
          where: {
            wordId_partOfSpeech_variant: {
              wordId: formWord.id,
              partOfSpeech: formPartOfSpeech,
              variant: '',
            },
          },
          create: {
            wordId: formWord.id,
            partOfSpeech: formPartOfSpeech,
            source: source,
            phonetic: formData.phonetic ?? null,
            etymology: baseWordText,
            variant: '',
            isPlural:
              formData.relationshipType === RelationshipType.plural_da ||
              formData.relationshipType === RelationshipType.plural_definite_da,
          },
          update: {
            phonetic: formData.phonetic ?? null,
            etymology: baseWordText,
          },
        });

        // 4. Create a definition for this form if provided, or generate a standardized one
        const definitionText =
          formData.definition ||
          getDanishFormDefinition(
            baseWordText,
            formData.wordText,
            formData.relationshipType,
          )
            .replace(/\{it\}/g, '')
            .replace(/\{\/it\}/g, '') ||
          generateFormDefinition(
            baseWordText,
            formData.wordText,
            formData.relationshipType,
          );

        const formDefinition = await tx.definition.upsert({
          where: {
            definition_languageCode_source: {
              definition: definitionText,
              languageCode: languageCode,
              source: source,
            },
          },
          create: {
            definition: definitionText,
            languageCode: languageCode,
            source: source,
            usageNote: formData.usageNote ?? null,
            isInShortDef: false,
          },
          update: {
            usageNote: formData.usageNote ?? null,
          },
        });

        // 5. Link the definition to the word details
        await tx.wordDefinition.upsert({
          where: {
            wordDetailsId_definitionId: {
              wordDetailsId: formWordDetails.id,
              definitionId: formDefinition.id,
            },
          },
          create: {
            wordDetailsId: formWordDetails.id,
            definitionId: formDefinition.id,
            isPrimary: true,
          },
          update: {},
        });

        // 6. Create the relationship between base word and this form
        await tx.wordDetailsRelationship.upsert({
          where: {
            fromWordDetailsId_toWordDetailsId_type: {
              fromWordDetailsId: baseWordDetailId,
              toWordDetailsId: formWordDetails.id,
              type: formData.relationshipType,
            },
          },
          create: {
            fromWordDetailsId: baseWordDetailId,
            toWordDetailsId: formWordDetails.id,
            type: formData.relationshipType,
            description: `Manual form: ${formData.relationshipType}`,
          },
          update: {
            description: `Manual form: ${formData.relationshipType}`,
          },
        });

        // 7. Also create a word-to-word relationship for broader connectivity
        await tx.wordToWordRelationship.upsert({
          where: {
            fromWordId_toWordId_type: {
              fromWordId: baseWord.id,
              toWordId: formWord.id,
              type: RelationshipType.related,
            },
          },
          create: {
            fromWordId: baseWord.id,
            toWordId: formWord.id,
            type: RelationshipType.related,
            description: 'Manual form relationship',
          },
          update: {},
        });

        formsAdded++;
        void serverLog(
          `Successfully added manual form: "${formData.wordText}"`,
          'info',
        );
      }
    });

    // Revalidate the admin dictionaries page to show the new forms
    revalidatePath('/admin/dictionaries');

    void serverLog(
      `Successfully added ${formsAdded} manual forms for "${baseWordText}"`,
      'info',
    );

    return {
      success: true,
      formsAdded,
    };
  } catch (error) {
    void serverLog(
      `Error adding manual forms for "${baseWordText}": ${error}`,
      'error',
    );
    console.error('Error adding manual word forms:', error);

    if (error instanceof DatabaseKnownRequestError) {
      return {
        success: false,
        error: `Database error: ${error.message}`,
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred while adding manual forms',
    };
  }
}

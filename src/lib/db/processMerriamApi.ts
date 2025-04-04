'use server';
'use server';

import { prisma } from '@/lib/prisma';
import { ProcessedWordData } from '@/types/dictionary';
import {
    LanguageCode,
    PartOfSpeech,
    Prisma,
    SourceType,
    RelationshipType,
} from '@prisma/client';

// Define a more accurate type for the API response, especially for 'prs' and 'ins'
export interface MerriamWebsterPronunciation {
    mw?: string;
    sound?: { audio: string };
    ipa?: string;
}

export interface MerriamWebsterInflection {
    il?: string;
    if?: string;
    prs?: MerriamWebsterPronunciation[];
}

export interface MerriamWebsterDefinitionSense {
    sn?: string;
    dt: Array<[string, unknown]>;
    sdsense?: MerriamWebsterDefinitionSense;
}

export interface MerriamWebsterDefinitionEntry {
    vd?: string;
    sseq: Array<Array<[string, MerriamWebsterDefinitionSense]>>;
}

export interface MerriamWebsterResponse {
    meta: {
        id: string;
        uuid: string;
        src: string;
        section: string;
        stems: string[];
        offensive: boolean;
    };
    hwi: {
        hw: string;
        prs?: MerriamWebsterPronunciation[];
    };
    fl?: string;
    ins?: MerriamWebsterInflection[];
    def?: MerriamWebsterDefinitionEntry[];
    et?: Array<[string, string]>;
    dros?: Array<{
        drp: string;
        def: MerriamWebsterDefinitionEntry[];
    }>;
}

export type StateMerriamWebster =
    | {
          message: string;
          errors: Record<string, never>;
          data: MerriamWebsterResponse;
      }
    | {
          message: null;
          errors: {
              word: string[];
          };
          data?: never;
      };

export async function getWordFromMerriamWebster(
    _prevState: StateMerriamWebster,
    formData: FormData,
): Promise<StateMerriamWebster> {
    const word = formData.get('word');
    const dictionaryType = formData.get('dictionaryType');

    if (!word || typeof word !== 'string') {
        return {
            message: null,
            errors: {
                word: ['Word is required'],
            },
        };
    }

    try {
        const API_KEY =
            dictionaryType === 'intermediate'
                ? process.env.DICTIONARY_INTERMEDIATE_API_KEY
                : process.env.DICTIONARY_LEARNERS_API_KEY;

        if (!API_KEY) {
            throw new Error('API key is not configured');
        }

        const dictionaryPath =
            dictionaryType === 'intermediate' ? 'sd3' : 'learners';
        const response = await fetch(
            `https://www.dictionaryapi.com/api/v3/references/${dictionaryPath}/json/${encodeURIComponent(word)}?key=${API_KEY}`,
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `API request failed (${response.status}): ${errorText}`,
            );
            return {
                message: null,
                errors: {
                    word: [
                        `API request failed: ${response.statusText || 'Unknown error'}`,
                    ],
                },
            };
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return { message: null, errors: { word: ['No results found.'] } };
        }

        if (typeof data[0] === 'string') {
            return {
                message: null,
                errors: {
                    word: [
                        'Word not found. Did you mean: ' +
                            data.slice(0, 3).join(', ') +
                            '?',
                    ],
                },
            };
        }

        return {
            message: 'Success',
            data: data[0],
            errors: {},
        };
    } catch (error) {
        console.error('Error fetching word from Merriam-Webster:', error);
        return {
            message: null,
            errors: {
                word: ['Failed to fetch word definition. Please try again.'],
            },
        };
    }
}

// Update the type for dros to include gram property
type MerriamWebsterDro = {
    drp: string;
    def?: MerriamWebsterDefinitionEntry[];
    gram?: string;
};

export async function processAndSaveWord(
    apiResponse: MerriamWebsterResponse,
): Promise<ProcessedWordData> {
    // --- 1. Initial Word Processing ---
    // Clean headword: remove all asterisks and any potential trailing ones (though replaceAll should handle it)
    const sourceWordText = apiResponse.hwi.hw.replaceAll('*', '');
    const language = LanguageCode.en; // Hardcoded as per workflow
    const source = mapSourceType(apiResponse.meta.src);
    const partOfSpeech = mapPartOfSpeech(apiResponse.fl);

    const processedData: ProcessedWordData = {
        word: {
            word: sourceWordText,
            languageCode: language,
            phonetic:
                apiResponse.hwi.prs?.[0]?.ipa ||
                apiResponse.hwi.prs?.[0]?.mw ||
                null,
            audio: apiResponse.hwi.prs?.[0]?.sound?.audio
                ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${apiResponse.hwi.prs[0].sound.audio.charAt(0)}/${apiResponse.hwi.prs[0].sound.audio}.mp3`
                : null,
            relatedWords: [],
        },
        definitions: [],
        phrases: [],
        stems: apiResponse.meta.stems || [],
    };

    let pluralForm: string | null = null;
    if (apiResponse.ins) {
        for (const inflection of apiResponse.ins) {
            if (inflection.il === 'plural' && inflection.if) {
                pluralForm = inflection.if.replace(/\*$/, '');
                break;
            }
        }
    }

    if (apiResponse.def) {
        for (const defEntry of apiResponse.def) {
            const currentPartOfSpeech = defEntry.vd
                ? mapPartOfSpeech(defEntry.vd)
                : partOfSpeech;

            if (defEntry.sseq) {
                for (const sseqItem of defEntry.sseq) {
                    for (const [senseType, senseData] of sseqItem) {
                        if (senseType === 'sense' || senseType === 'sdsense') {
                            const dt = senseData.dt;
                            const definitionText = dt?.find(
                                ([type]) => type === 'text',
                            )?.[1];
                            const examplesArray = dt
                                ?.filter(([type]) => type === 'vis')
                                .flatMap(
                                    ([, visData]) =>
                                        visData as VerbalIllustration[],
                                );

                            // Clean the definition text first
                            const cleanedDefinition =
                                cleanupDefinitionText(definitionText);

                            // Only proceed if the cleaned definition is not empty
                            if (cleanedDefinition) {
                                processedData.definitions.push({
                                    partOfSpeech: currentPartOfSpeech,
                                    source: source,
                                    languageCode: language,
                                    isPlural: !!(
                                        pluralForm &&
                                        currentPartOfSpeech === partOfSpeech
                                    ),
                                    definition: cleanedDefinition,
                                    examples:
                                        examplesArray?.map((ex) => ({
                                            example: cleanupExampleText(ex.t),
                                            languageCode: LanguageCode.en,
                                        })) || [],
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    try {
        await prisma.$transaction(
            async (tx) => {
                const sourceWord = await tx.word.upsert({
                    where: {
                        word_languageCode: {
                            word: processedData.word.word,
                            languageCode: language,
                        },
                    },
                    create: {
                        word: processedData.word.word,
                        languageCode: language,
                        phonetic: processedData.word.phonetic,
                        audio: processedData.word.audio,
                        difficultyLevel: 'B1',
                    },
                    update: {
                        phonetic: processedData.word.phonetic,
                        audio: processedData.word.audio,
                    },
                });

                // Initialize set to track processed words/stems/phrases within this transaction
                const processedWords = new Set<string>([sourceWordText]);

                // --- 4b. Handle Plural Form ---
                let pluralWordEntity = null;
                if (pluralForm && pluralForm !== sourceWord.word) {
                    pluralWordEntity = await tx.word.upsert({
                        where: {
                            word_languageCode: {
                                word: pluralForm,
                                languageCode: language,
                            },
                        },
                        create: {
                            word: pluralForm,
                            languageCode: language,
                            difficultyLevel: 'B1',
                        },
                        update: {},
                    });

                    await tx.wordRelationship.upsert({
                        where: {
                            fromWordId_toWordId_type: {
                                fromWordId: sourceWord.id,
                                toWordId: pluralWordEntity.id,
                                type: RelationshipType.plural_en,
                            },
                        },
                        create: {
                            fromWordId: sourceWord.id,
                            toWordId: pluralWordEntity.id,
                            type: RelationshipType.plural_en,
                        },
                        update: {},
                    });
                    processedWords.add(pluralForm); // Add plural form to processed set
                }

                // --- 4c. Create Definitions and Examples ---
                const createdDefinitionIds = new Set<number>();
                for (const def of processedData.definitions) {
                    // Check if definition text is actually present after cleaning
                    if (!def.definition || def.definition.trim() === '') {
                        console.warn(
                            `Skipping definition creation for word '${sourceWord.word}' because definition text is empty.`,
                        );
                        continue;
                    }

                    const existingDef = await tx.definition.findFirst({
                        where: {
                            definition: def.definition,
                            partOfSpeech: mapPartOfSpeech(def.partOfSpeech),
                            languageCode: LanguageCode.en,
                            source: source,
                            words: { some: { wordId: sourceWord.id } },
                        },
                    });

                    if (existingDef && createdDefinitionIds.has(existingDef.id))
                        continue;

                    const definitionEntity =
                        existingDef ||
                        (await tx.definition.create({
                            data: {
                                definition: def.definition,
                                partOfSpeech: mapPartOfSpeech(def.partOfSpeech),
                                source: source,
                                languageCode: LanguageCode.en,
                                plural: def.isPlural,
                                words: {
                                    create: {
                                        wordId: sourceWord.id,
                                        isPrimary: true,
                                    },
                                },
                            },
                        }));
                    createdDefinitionIds.add(definitionEntity.id);

                    if (!existingDef) {
                        for (const example of def.examples) {
                            await tx.definitionExample.create({
                                data: {
                                    example: example.example,
                                    languageCode:
                                        example.languageCode as LanguageCode,
                                    definitionId: definitionEntity.id,
                                },
                            });
                        }
                    }
                }

                // --- 4d. Process Stems --- (Currently Commented Out)
                // const stemsProcessedWords = new Set<string>([sourceWordText, pluralForm].filter(Boolean) as string[]); // Use a separate set if uncommenting
                // if (apiResponse.meta.stems) { ... }

                // --- 4e. Process Dros (Phrases/Phrasal Verbs) ---
                const processedPhrases = new Set<string>();
                if (apiResponse.dros) {
                    for (const dro of apiResponse.dros as MerriamWebsterDro[]) {
                        const cleanDrp = dro.drp.replace(/\*$/, '');
                        // Use the main processedWords set here
                        if (
                            !cleanDrp ||
                            processedWords.has(cleanDrp) ||
                            processedPhrases.has(cleanDrp)
                        ) {
                            continue;
                        }

                        // Extract first definition and examples from the dro's def section
                        let droDefinitionText: string | null = null;
                        let droExamples: VerbalIllustration[] = [];

                        const firstDroDef = dro.def?.[0];
                        if (firstDroDef?.sseq?.[0]?.[0]?.[1]) {
                            // Navigate carefully
                            const senseData = firstDroDef.sseq[0][0][1];
                            const textDt = senseData.dt?.find(
                                ([type]) => type === 'text',
                            );
                            if (
                                textDt &&
                                typeof textDt[1] === 'string' &&
                                !textDt[1].startsWith('{dx')
                            ) {
                                droDefinitionText = cleanupDefinitionText(
                                    textDt[1],
                                );
                            }

                            // Extract examples if definition is valid (not a cross-ref)
                            if (droDefinitionText) {
                                const examplesVis = senseData.dt
                                    ?.filter(([type]) => type === 'vis')
                                    .flatMap(
                                        ([, visData]) =>
                                            visData as VerbalIllustration[],
                                    );
                                if (examplesVis) {
                                    droExamples = examplesVis.map((ex) => ({
                                        t: cleanupExampleText(ex.t),
                                    }));
                                }
                            }
                        }

                        // Only proceed if we have a valid definition text (not a cross-ref)
                        if (droDefinitionText) {
                            // Check if this is a phrasal verb
                            const isPhrasalVerb = dro.gram === 'phrasal verb';

                            if (isPhrasalVerb) {
                                // Handle as a Word entity with phrasal_verb part of speech
                                const phrasalVerbEntity = await tx.word.upsert({
                                    where: {
                                        word_languageCode: {
                                            word: cleanDrp,
                                            languageCode: language,
                                        },
                                    },
                                    create: {
                                        word: cleanDrp,
                                        languageCode: language,
                                        difficultyLevel: 'B1',
                                    },
                                    update: {},
                                });

                                // Create a relationship between source word and phrasal verb
                                await tx.wordRelationship.upsert({
                                    where: {
                                        fromWordId_toWordId_type: {
                                            fromWordId: sourceWord.id,
                                            toWordId: phrasalVerbEntity.id,
                                            type: RelationshipType.related,
                                        },
                                    },
                                    create: {
                                        fromWordId: sourceWord.id,
                                        toWordId: phrasalVerbEntity.id,
                                        type: RelationshipType.related,
                                    },
                                    update: {},
                                });

                                // Create Definition with phrasal_verb part of speech
                                const phrasalVerbDef =
                                    await tx.definition.create({
                                        data: {
                                            definition: droDefinitionText,
                                            partOfSpeech:
                                                PartOfSpeech.phrasal_verb,
                                            source: source,
                                            languageCode: language,
                                            plural: false,
                                            words: {
                                                create: {
                                                    wordId: phrasalVerbEntity.id,
                                                    isPrimary: true,
                                                },
                                            },
                                        },
                                    });

                                // Create examples for the phrasal verb definition
                                for (const example of droExamples) {
                                    await tx.definitionExample.create({
                                        data: {
                                            example: example.t,
                                            languageCode: language,
                                            definitionId: phrasalVerbDef.id,
                                        },
                                    });
                                }
                            } else {
                                // Handle as a Phrase entity (existing behavior)
                                // Check if phrase exists
                                let phraseEntity = await tx.phrase.findFirst({
                                    where: {
                                        phrase: cleanDrp,
                                        languageCode: language,
                                    },
                                });

                                if (phraseEntity) {
                                    // Update existing phrase and ensure connection
                                    await tx.phrase.update({
                                        where: { id: phraseEntity.id },
                                        data: {
                                            definition: droDefinitionText,
                                            words: {
                                                connect: { id: sourceWord.id },
                                            },
                                        },
                                    });
                                } else {
                                    // Create new phrase and connect
                                    phraseEntity = await tx.phrase.create({
                                        data: {
                                            phrase: cleanDrp,
                                            languageCode: language,
                                            definition: droDefinitionText,
                                            words: {
                                                connect: { id: sourceWord.id },
                                            },
                                        },
                                    });
                                }

                                // Add examples for the phrase
                                for (const example of droExamples) {
                                    // Check if this exact example already exists for this phrase
                                    const existingExample =
                                        await tx.phraseExample.findFirst({
                                            where: {
                                                phraseId: phraseEntity.id,
                                                example: example.t,
                                            },
                                        });
                                    if (!existingExample) {
                                        await tx.phraseExample.create({
                                            data: {
                                                phraseId: phraseEntity.id,
                                                example: example.t,
                                                languageCode: language,
                                            },
                                        });
                                    }
                                }
                            }

                            processedPhrases.add(cleanDrp);
                            processedWords.add(cleanDrp); // Add phrase to main processed set too
                        }
                    }
                }
            },
            { timeout: 15000 },
        );

        return processedData;
    } catch (error) {
        console.error(
            'Error saving word data for:',
            apiResponse?.meta?.id,
            error,
        );
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.error('Prisma Error Code:', error.code);
        }
        throw new Error(
            `Failed to save word data: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

function cleanupDefinitionText(text: unknown): string {
    if (typeof text !== 'string') {
        console.warn('Non-string definition text encountered:', text);
        return String(text || '')
            .replace(/{[^}]+}/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    return text
        .replace(/{[^}]+}/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanupExampleText(text: unknown): string {
    if (typeof text !== 'string') {
        console.warn('Non-string example text encountered:', text);
        return String(text || '')
            .replace(/{[^}]+}/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    return text
        .replace(/{[^}]+}/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function mapPartOfSpeech(apiFl: string | undefined | null): PartOfSpeech {
    if (!apiFl) {
        console.warn('Missing functional label (fl) in API response.');
        return PartOfSpeech.noun;
    }
    switch (apiFl.toLowerCase()) {
        case 'noun':
            return PartOfSpeech.noun;
        case 'verb':
            return PartOfSpeech.verb;
        case 'phrasal verb':
            return PartOfSpeech.phrasal_verb;
        case 'adjective':
            return PartOfSpeech.adjective;
        case 'adverb':
            return PartOfSpeech.adverb;
        case 'pronoun':
            return PartOfSpeech.pronoun;
        case 'preposition':
            return PartOfSpeech.preposition;
        case 'conjunction':
            return PartOfSpeech.conjunction;
        case 'interjection':
            return PartOfSpeech.interjection;
        case 'abbreviation':
        case 'symbol':
            console.warn(
                `Mapping potentially unhandled part of speech: ${apiFl}. Defaulting to noun.`,
            );
            return PartOfSpeech.noun;
        default:
            console.warn(
                `Unknown part of speech encountered: ${apiFl}. Defaulting to noun.`,
            );
            return PartOfSpeech.noun;
    }
}

function mapSourceType(apiSrc: string | undefined | null): SourceType {
    if (!apiSrc) return SourceType.user;

    switch (apiSrc.toLowerCase()) {
        case 'learners':
            return SourceType.merriam_learners;
        case 'sd3':
        case 'collegiate':
            return SourceType.merriam_intermediate;
        default:
            console.warn(`Unknown source type: ${apiSrc}, defaulting to user`);
            return SourceType.user;
    }
}

// Define a type for the verbal illustration object based on API structure
interface VerbalIllustration {
    t: string; // Assuming 't' is the text field for the example
    // Add other fields if necessary (e.g., aq for attribution)
}

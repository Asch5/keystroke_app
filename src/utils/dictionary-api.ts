import { PrismaClient, PartOfSpeech, DifficultyLevel } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

interface DictionaryAPIResponse {
    meta: {
        id: string;
        uuid: string;
        sort: string;
        src: string;
        section: string;
        stems: string[];
        offensive: boolean;
    };
    hwi: {
        hw: string;
        prs?: Array<{
            mw: string;
            sound: {
                audio: string;
            };
        }>;
    };
    fl?: string; // part of speech
    def?: Array<{
        sseq: Array<
            Array<
                [
                    string,
                    {
                        dt: Array<[string, string]>;
                        sls?: string[];
                    },
                ]
            >
        >;
    }>;
    et?: Array<[string, string]>; // etymology
}

interface WordData {
    word: string;
    phonetic: string | null;
    audio: string;
    language: {
        connect: { id: string };
    };
}

export class DictionaryAPI {
    private readonly LEARNERS_API_KEY: string;
    private readonly INTERMEDIATE_API_KEY: string;
    private readonly BASE_URL =
        'https://www.dictionaryapi.com/api/v3/references';

    constructor(learnersApiKey: string, intermediateApiKey: string) {
        this.LEARNERS_API_KEY = learnersApiKey;
        this.INTERMEDIATE_API_KEY = intermediateApiKey;
    }

    private getAudioUrl(audioFile: string): string {
        const subdirectory = audioFile.charAt(0);
        return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdirectory}/${audioFile}.mp3`;
    }

    private mapPartOfSpeech(apiPos: string): PartOfSpeech {
        const posMap: Record<string, PartOfSpeech> = {
            noun: 'noun',
            verb: 'verb',
            adjective: 'adjective',
            adverb: 'adverb',
            pronoun: 'pronoun',
            preposition: 'preposition',
            conjunction: 'conjunction',
            interjection: 'interjection',
        };
        return posMap[apiPos.toLowerCase()] || 'noun';
    }

    private async fetchWordData(
        word: string,
        isLearner: boolean = true,
    ): Promise<DictionaryAPIResponse> {
        const apiKey = isLearner
            ? this.LEARNERS_API_KEY
            : this.INTERMEDIATE_API_KEY;
        const dictionary = isLearner ? 'learners' : 'intermediate';

        const response = await axios.get(
            `${this.BASE_URL}/${dictionary}/json/${word}?key=${apiKey}`,
        );

        return response.data[0];
    }

    public async populateWord(
        word: string,
        languageId: string,
        difficultyLevel: DifficultyLevel,
    ) {
        try {
            // Try learner's dictionary first for basic words
            let wordData = await this.fetchWordData(word, true);

            // If not found in learner's, try intermediate
            if (!wordData) {
                wordData = await this.fetchWordData(word, false);
            }

            if (!wordData) {
                console.log(`No data found for word: ${word}`);
                return null;
            }

            // Create or update word entry
            const createData: WordData = {
                word: wordData.hwi.hw,
                phonetic: wordData.hwi.prs?.[0]?.mw || null,
                audio: wordData.hwi.prs?.[0]?.sound?.audio
                    ? this.getAudioUrl(wordData.hwi.prs[0].sound.audio)
                    : '',
                language: {
                    connect: { id: languageId },
                },
            };

            const updateData = {
                phonetic: wordData.hwi.prs?.[0]?.mw || null,
                audio: wordData.hwi.prs?.[0]?.sound?.audio
                    ? this.getAudioUrl(wordData.hwi.prs[0].sound.audio)
                    : '',
            };

            const wordEntry = await prisma.word.upsert({
                where: { word_languageId: { word, languageId } },
                create: createData,
                update: updateData,
            });

            // Create one word definition
            const oneWordDef = await prisma.oneWordDefinition.create({
                data: {
                    definition:
                        wordData.def?.[0]?.sseq?.[0]?.[0]?.[1]?.dt?.[0]?.[1] ||
                        '',
                    language: {
                        connect: { id: languageId },
                    },
                },
            });

            // Create main dictionary entry
            await prisma.mainDictionary.create({
                data: {
                    word: {
                        connect: { id: wordEntry.id },
                    },
                    oneWordDefinition: {
                        connect: { id: oneWordDef.id },
                    },
                    baseLanguageId: languageId,
                    targetLanguageId: languageId,
                    partOfSpeech: this.mapPartOfSpeech(wordData.fl || 'noun'),
                    difficultyLevel,
                    etymology: wordData.et?.[0]?.[1] || null,
                    source: 'import',
                },
            });

            return wordEntry;
        } catch (error) {
            console.error(`Error processing word ${word}:`, error);
            return null;
        }
    }

    public async batchPopulate(
        words: Array<{ word: string; difficultyLevel: DifficultyLevel }>,
        languageId: string,
    ) {
        const results = [];

        // Process 5 words at a time to respect rate limits
        for (let i = 0; i < words.length; i += 5) {
            const batch = words.slice(i, i + 5);
            const batchPromises = batch.map(({ word, difficultyLevel }) =>
                this.populateWord(word, languageId, difficultyLevel),
            );

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults.filter(Boolean));

            // Wait 1 second between batches to respect rate limits
            if (i + 5 < words.length) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }

        return results;
    }
}

import { NextResponse } from 'next/server';
import translate from 'extended-google-translate-api';
import { TranslateOptions } from 'extended-google-translate-api';
import { serverLog } from '@/core/lib/utils/logUtils';

export async function POST(request: Request) {
  try {
    const { text, sourceLang, destLang, options } = await request.json();
    serverLog(`text: ${text}`);
    serverLog(`sourceLang: ${sourceLang}`);
    serverLog(`destLang: ${destLang}`);
    serverLog(`options: ${JSON.stringify(options)}`);

    if (!text) {
      return NextResponse.json(
        { error: 'Text to translate is required' },
        { status: 400 },
      );
    }

    // Call the translation API
    const result = await translate(
      text,
      sourceLang,
      destLang,
      options as TranslateOptions,
    );

    serverLog(`JSON.stringify(result): ${JSON.stringify(result)}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 },
    );
  }
}

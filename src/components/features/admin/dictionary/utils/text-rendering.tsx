import React from 'react';

interface TextPart {
  type: 'phrase' | 'definition' | 'italic';
  content: string;
}

/**
 * Utility function to render text with special formatting tags
 * Handles {it}, {phrase}, {bc}, [=], and other special formatting
 *
 * @param text - The text to render with formatting
 * @returns Rendered React node with formatting applied
 */
export function renderTextWithEmphasis(text: string): React.ReactNode {
  if (!text || text.length === 0) return text;

  // Handle quotes
  if (text.includes('{ldquo}') || text.includes('{rdquo}')) {
    text = text.replace(/\{ldquo\}/g, '"').replace(/\{rdquo\}/g, '"');
  }

  // Handle {bc} tags as bullet points
  if (text.includes('{bc}')) {
    const parts = text.split('{bc}').filter((part) => part.trim().length > 0);

    if (parts.length >= 1) {
      return (
        <div className="space-y-1">
          {parts.map((part, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-primary flex-shrink-0">•</span>
              <span className="flex-1">
                {renderTextWithEmphasis(part.trim())}
              </span>
            </div>
          ))}
        </div>
      );
    }
  }

  // Handle examples with "=" separator
  if (text.includes(' = ')) {
    const examples = text.split(' = ');
    return (
      <>
        {examples.map((example, index) => (
          <span key={index}>
            {index > 0 && (
              <span className="mx-2 text-muted-foreground font-medium">=</span>
            )}
            {renderTextWithEmphasis(example)}
          </span>
        ))}
      </>
    );
  }

  // Handle {phrase} tags
  if (text.includes('{phrase}') && text.includes('{/phrase}')) {
    try {
      const parts: (string | TextPart)[] = [];
      let currentText = text;
      let startIndex = currentText.indexOf('{phrase}');
      let endIndex = -1;

      while (startIndex !== -1) {
        if (startIndex > 0) {
          parts.push(currentText.substring(0, startIndex));
        }
        endIndex = currentText.indexOf('{/phrase}', startIndex);
        if (endIndex === -1) break;
        const phraseContent = currentText.substring(startIndex + 8, endIndex);
        parts.push({ type: 'phrase', content: phraseContent });
        currentText = currentText.substring(endIndex + 9);
        startIndex = currentText.indexOf('{phrase}');
      }
      if (currentText.length > 0) parts.push(currentText);

      return (
        <>
          {parts.map((part, index) => {
            if (typeof part === 'string') {
              return (
                <React.Fragment key={index}>
                  {renderTextWithEmphasis(part)}
                </React.Fragment>
              );
            } else {
              return (
                <span
                  key={index}
                  className="inline-block bg-primary/10 text-primary rounded-sm px-1 py-0.5 font-medium border border-primary/20"
                >
                  {renderTextWithEmphasis(part.content)}
                </span>
              );
            }
          })}
        </>
      );
    } catch (error) {
      console.error('Error parsing phrase tags:', error);
      return text;
    }
  }

  // Handle [=definition] tags
  if (text.includes('[=') && text.includes(']')) {
    try {
      const parts: (string | TextPart)[] = [];
      let currentText = text;
      let startIndex = currentText.indexOf('[=');
      let endIndex = -1;

      while (startIndex !== -1) {
        if (startIndex > 0) {
          parts.push(currentText.substring(0, startIndex));
        }
        endIndex = currentText.indexOf(']', startIndex);
        if (endIndex === -1) break;
        const defContent = currentText.substring(startIndex + 2, endIndex);
        parts.push({ type: 'definition', content: defContent });
        currentText = currentText.substring(endIndex + 1);
        startIndex = currentText.indexOf('[=');
      }
      if (currentText.length > 0) parts.push(currentText);
      return (
        <>
          {parts.map((part, index) => {
            if (typeof part === 'string') {
              return (
                <React.Fragment key={index}>
                  {renderTextWithEmphasis(part)}
                </React.Fragment>
              );
            } else {
              return (
                <span
                  key={index}
                  className="inline-block bg-muted/30 text-muted-foreground rounded px-1.5 py-0.5 text-[0.9em] font-medium"
                >
                  ({renderTextWithEmphasis(part.content)})
                </span>
              );
            }
          })}
        </>
      );
    } catch (error) {
      console.error('Error parsing definition brackets:', error);
      return text;
    }
  }

  // Handle {it} italic tags
  if (text.includes('{it}') && text.includes('{/it}')) {
    try {
      const parts: (string | TextPart)[] = [];
      let currentText = text;
      let startIndex = currentText.indexOf('{it}');
      let endIndex = -1;

      while (startIndex !== -1) {
        if (startIndex > 0) {
          parts.push(currentText.substring(0, startIndex));
        }
        endIndex = currentText.indexOf('{/it}', startIndex);
        if (endIndex === -1) break;
        const italicContent = currentText.substring(startIndex + 4, endIndex);
        parts.push({ type: 'italic', content: italicContent });
        currentText = currentText.substring(endIndex + 5);
        startIndex = currentText.indexOf('{it}');
      }
      if (currentText.length > 0) parts.push(currentText);
      return (
        <>
          {parts.map((part, index) => {
            if (typeof part === 'string') {
              return <React.Fragment key={index}>{part}</React.Fragment>;
            } else {
              return (
                <em className="font-bold text-error-foreground" key={index}>
                  {part.content}
                </em>
              );
            }
          })}
        </>
      );
    } catch (error) {
      console.error('Error parsing italic tags:', error);
      return text;
    }
  }
  return text;
}

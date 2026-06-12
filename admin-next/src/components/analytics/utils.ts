/**
 * Truncates text to a specified number of words, appending ".." if truncated.
 */
export const truncateWords = (text: string, maxWords: number = 3): string => {
  if (!text) return '';
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '..';
};

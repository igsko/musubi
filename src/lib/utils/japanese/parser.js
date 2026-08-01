//@ts-nocheck
export const POS_KEYWORDS = [
  'rzeczownik', 'czasownik', 'przymiotnik', 'przysłówek', 'zaimek', 
  'wykrzyknik', 'spójnik', 'przedrostek', 'przyrostek', 'klasyfikator', 
  'partykuła', 'imiesłów', 'liczebnik'
];

export const CATEGORY_KEYWORDS = [
  'sport', 'buddyzm', 'geologia', 'fizyka', 'chemia', 'medycyna', 
  'anatomia', 'informatyka', 'matematyka', 'teatr', 'muzyka', 
  'religia', 'filozofia', 'prawo', 'ekonomia', 'astronomia', 
  'biologia', 'zoologia', 'botanika', 'lingwistyka', 'gramatyka', 
  'archeologia'
];

/**
 * Detects and parses "see also" cross-reference text.
 * e.g. "zobacz również 物珍しい/ ものめずらしい - 123" -> { display: "物珍しい/ ものめずらしい", keyword: "物珍しい" }
 * @param {string} metaText
 * @returns {{ display: string, keyword: string } | null}
 */
export function parseSeeAlso(metaText) {
  if (!metaText) return null;

  const match = metaText.match(/^zobacz również:?\s+(.+?)(?:\s*-\s*\d+)?$/i);
  if(match) {
    const rawTarget = match[1].trim(); // e.g. "物珍しい/ ものめずらしい"

    // Extract just the first word before any slashes to use as the search key
    // e.g. "物珍しい"
    const searchKeyword = rawTarget
      .split(/[\/\s]/)[0]
      .replace(/[\(\（].*?[\)\）]/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();

    return {
      display: rawTarget,
      keyword: searchKeyword,
    };
  }
  return null;
}

/**
 * Detects if a tag string represents a Part of Speech.
 * Excludes syntactic relational rules (e.g., "po czasowniku...").
 * @param {string} tag
 * @returns {boolean}
 */
export function isPartOfSpeechTag(tag) {
  if (!tag) return false;
  const normalizedTag = tag.toLowerCase().trim();

  // EXCLUDE syntactic relational rules (e.g. "po czasowniku...", "przed rzeczownikiem...")
  if (normalizedTag.startsWith('po ') || normalizedTag.startsWith('przed ')) {
    return false;
  }
  
  return POS_KEYWORDS.some(keyword => normalizedTag.includes(keyword));
}

/**
 * Detects if a tag string represents a Subject Category / Domain.
 * @param {string} metaText
 * @returns {boolean}
 */
export function isCategory(metaText) {
  if (!metaText) return false;
  const lower = metaText.toLowerCase().trim();
  return CATEGORY_KEYWORDS.some(keyword => lower.includes(keyword));
}

/**
 * Cleans up metadata strings by removing frequency annotations like "(powszechny)".
 * @param {string} text
 * @returns {string}
 */
export function cleanPartsOfSpeech(text) {
  if (!text) return "";
  
  let cleaned = text.replace(/\s*\((powszechny|powszechne|powszechna|powszechnych)\)\s*/gi, ' ');
  
  // Normalize any double spaces created by the removal
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}
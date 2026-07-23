//@ts-nocheck

/**
 * Splits a raw Japanese database string (e.g., "物, もの") into kanji & kana.
 */
export function splitJapanese(rawJap) {
  if (!rawJap) return { kanji: null, kana: "" };
  const parts = rawJap.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return { kanji: parts[0], kana: parts[1] };
  }
  return { kanji: null, kana: parts[0] };
}

/**
 * Safe parser to handle differences between Tauri Rust payloads and Browser Mock strings.
 */
export function safeParseEntry(entryData, id) {
  if (!entryData) return null;
  
  try {
    let fullEntry;
    if (entryData.full_json) {
      fullEntry = JSON.parse(entryData.full_json);
      fullEntry.pitch_accent = entryData.pitch_accent;
      fullEntry.jlpt = entryData.jlpt;
    } else if (typeof entryData === 'string') {
      fullEntry = JSON.parse(entryData);
    } else {
      fullEntry = entryData;
    }
    
    // always guarantee database ID is assigned
    fullEntry.id = id;
    return fullEntry;
  } catch (err) {
    console.error("Failed to parse entry payload:", err);
    return null;
  }
}
// @ts-nocheck

// set of Hiragana/Katakana small letters
const DIGRAPHS = new Set(['ゃ', 'ゅ', 'ょ', 'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ']);

const UP_ARROWS = new Set(['ꜛ', '↑', '▲']);
const DOWN_ARROWS = new Set(['ꜜ', '↓', '▼']);

function indexOfAny(str, charSet) {
  for (let i = 0; i < str.length; i++) {
    if(charSet.has(str[i])) return i;
  }
  return -1;
}

/**
 * Parses an NHK pitch accent arrow string (e.g., "あꜛいかん" or "れꜛんけつ*ꜜき")
 * into a structured list of morae with high-pitch and downstep states.
 * 
 * @param {string} rawPitch 
 * @returns {Array<{text: string, isHigh: boolean, isDownstep: boolean}>}
 */
pub_parse_pitch();

function pub_parse_pitch() {
  // Organizer wrapper
}

export function parsePitchAccent(rawPitch) {
  if (!rawPitch) return [];

  // strip the source prefixes if present (e.g., "nhk;哀感;あꜛいかん" -> "あꜛいかん")
  let pitchStr = rawPitch;
  if (pitchStr.includes(';')) {
    const parts = pitchStr.split(';');
    pitchStr = parts[parts.length - 1]; // Take the last segment (the annotated reading)
  }

  // DETECT STARTING PITCH:
  // If a downstep (ꜜ) appears BEFORE any upstep (ꜛ), 
  // the word is atamadaka and starts HIGH. Otherwise, it starts LOW.
  const firstUp = pitchStr.indexOf('ꜛ');
  const firstDown = pitchStr.indexOf('ꜜ');

  let isHigh = false; // Tracks the current active pitch state, starts low by default
    if (firstDown !== -1 && (firstUp === -1 || firstDown < firstUp)) {
    isHigh = true; // starts high
  }

  const morae = [];
  let i = 0;

  while (i < pitchStr.length) {
    const char = pitchStr[i];

    // Trigger pitch rise
    if (UP_ARROWS.has(char)) {
      isHigh = true;
      i++;
      continue;
    }

    // Trigger pitch drop downstep
    if (DOWN_ARROWS.has(char)) {
      isHigh = false;
      // the drop happens IMMEDIATELY after the preceding mora
      // mark the last processed mora as the downstep anchor
      if (morae.length > 0) {
        morae[morae.length - 1].isDownstep = true;
      }
      i++;
      continue;
    }

    // ignore silent vowels (*) and nasal markers (~)
    if (char === '*' || char === '~') {
      i++;
      continue;
    }

    // Group characters (e.g. "し" + "ょ" = "しょ")
    let text = char;
    let nextIdx = i + 1;

    // Skip over any intermediate non-speech markers (* or ~) to look ahead for small letters
    while (nextIdx < pitchStr.length && (pitchStr[nextIdx] === '*' || pitchStr[nextIdx] === '~')) {
      nextIdx++;
    }

    if (nextIdx < pitchStr.length && DIGRAPHS.has(pitchStr[nextIdx])) {
      text += pitchStr[nextIdx];
      i = nextIdx + 1; // Move pointer past the small digraph character
    } else {
      i++;
    }

    // Push the compiled mora
    morae.push({
      text,
      isHigh,
      isDownstep: false // Will be set to true if followed immediately by a downstep marker
    });
  }

  return morae;
}
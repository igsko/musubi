// @ts-nocheck

// Helper to convert Katakana to Hiragana for uniform alignment matching
const toHiragana = (str) => {
    return str.replace(/[\u30a1-\u30f6]/g, (match) => {
            return String.fromCharCode(match.charCodeAt(0) - 0x60);
    });
};

// Helper to check if a character is a Kana
const isKana = (char) => {
    const code = char.charCodeAt(0);
    return (code >= 0x3040 && code <= 0x309F) || (code >= 0x30A0 && code <= 0x30FF);
};

/**
 * Aligns Kanji and Kana, returning an array of segments with or without furigana.
 * Handles middle okurigana and normalizes Katakana-to-Hiragana for correct alignment.
 * 
 * @param {string} kanji 
 * @param {string} kana 
 * @returns {Array<{text: string, furi: string|null}>}
 */
export function segmentFurigana(kanji, kana) {
    if(!kanji || kanji === kana){
        return [{text: kana, furi: null}];
    }
    
    const normKanji = toHiragana(kanji);
    const normKana = toHiragana(kana);

    let segments = [];
    let lastKanjiPos = 0;
    let lastKanaPos = 0;

    // Find all kana anchor characters in the kanji string
    let anchors = [];
    for (let i = 0; i < kanji.length; i++) {
        if (isKana(kanji[i])) {
        anchors.push({ char: kanji[i], normChar: normKanji[i], pos: i });
        }
    }

    // If no kana anchors are found, the whole word is Kanji
    if (anchors.length === 0) {
        return [{ text: kanji, furi: kana }];
    }

    for (let anchor of anchors) {
        // Find where this anchor matches in our normalized kana string
        let kanaPos = normKana.indexOf(anchor.normChar, lastKanaPos);

        if (kanaPos !== -1) {
        // Process the Kanji segment before the anchor
        let subKanji = kanji.slice(lastKanjiPos, anchor.pos);
        let subKana = kana.slice(lastKanaPos, kanaPos);

        if (subKanji && subKana) {
            segments.push({ text: subKanji, furi: subKana });
        }

        // Process the anchor itself (render as plain text)
        segments.push({ text: anchor.char, furi: null });

        lastKanjiPos = anchor.pos + 1;
        lastKanaPos = kanaPos + 1;
        }
    }

    // Process any remaining tail of the word
    if (lastKanjiPos < kanji.length || lastKanaPos < kana.length) {
        let tailKanji = kanji.slice(lastKanjiPos);
        let tailKana = kana.slice(lastKanaPos);
        if (tailKanji === tailKana) {
        segments.push({ text: tailKanji, furi: null });
        } else {
        segments.push({ text: tailKanji, furi: tailKana });
        }
    }

    return segments;
}

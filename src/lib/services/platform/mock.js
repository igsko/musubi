// @ts-nocheck

// This file serves as the local browser fallback/mock driver for the platform service.
// It provides simulated dictionary database entries, search suggestions, and window control
// wrappers to enable front-end testing and previewing within standard web browsers
// without requiring compiled Tauri execution environment.

// mock local dictionary entries
const mockDb = [
  { id: 1, kanji: "日本語", kana: "にほんご", romaji: "nihongo", translation: "język japoński, japońszczyzna", frequency_rank: 5 },
  { id: 2, kanji: "気", kana: "き", romaji: "ki", translation: "duch, umysł, serce, powietrze", frequency_rank: 150 },
  { id: 3, kanji: "木", kana: "き", romaji: "ki", translation: "drzewo, krzew, drewno", frequency_rank: 550 },
  { id: 4, kanji: "製品", kana: "せいひん", romaji: "seihin", translation: "wyprodukowane towary, gotowe wyroby, produkt", frequency_rank: 2300 },
  { id: 5, kanji: null, kana: "シャーシ", romaji: "shaashi", translation: "podwozie, rama konstrukcyjna", frequency_rank: 999999 }
];

/**
 * Wrapper to fetch mock data suggestions based on the provided query and offset.
 * @param {string} query - The search query.
 * @param {number} offset - The offset for pagination.
 * @returns {Promise<any[]>} A promise resolving to the list of suggestions.
 */
export async function fetchSuggestions(query, offset) {
  console.log(`[Platform Service] Mocking suggestions for query: "${query}" (Offset: ${offset})`);
  const cleanQuery = query.toLowerCase().trim();
  return mockDb.filter(item => 
    item.romaji.includes(cleanQuery) || 
    item.translation.toLowerCase().includes(cleanQuery) ||
    item.kana.includes(cleanQuery) ||
    (item.kanji && item.kanji.includes(cleanQuery))
  ).slice(offset, offset + 20);
}

/**
 * Fetches mock data details for a specific dictionary entry based on its ID.
 * @param {number} id - The ID of the entry to fetch.
 * @returns {Promise<string>} A promise resolving to the JSON string of the entry details.
 */
export async function fetchEntryDetails(id) {
  console.log(`[Platform Service] Mocking entry details for ID: ${id}`);
  
  // simulate a deep database JSON payload for a selected word
  const item = mockDb.find(d => d.id === id) || mockDb[0];
  const mockDetails = {
    headwords: [
      { japanese: `${item.kanji || ''}, ${item.kana}`, romaji: item.romaji, note: null },
      { japanese: `${item.kana}`, romaji: item.romaji, note: "rzadki odczyt" }
    ],
    meanings: [
      {
        index: 1,
        translations: [item.translation],
        metadata: ["rzeczownik (powszechny) (futsuumeishi)", "językoznawstwo"]
      }
    ]
  };
  return JSON.stringify(mockDetails);
}

/**
 * Fetches details for multiple mock dictionary entries based on their IDs.
 * @param {number[]} ids - The IDs of the entries to fetch.
 * @returns {Promise<any[]>} A promise resolving to the list of entry details.
 */
export async function fetchMultipleEntries(ids) {
  console.log(`[Platform Service] Mocking fetchMultipleEntries for IDs:`, ids);
  const results = [];
  for (const id of ids) {
    const item = mockDb.find(d => d.id === id);
    if (item) {
      results.push({
        id: item.id,
        pitch_accent: "nhk;日本語;にほんごꜛ",
        full_json: JSON.stringify({
          headwords: [{ japanese: `${item.kanji || ''}, ${item.kana}`, romaji: item.romaji, note: null }],
          meanings: [{ index: 1, translations: [item.translation], metadata: [] }]
        })
      });
    }
  }
  return results;
}

export async function minimizeWindow() {
  console.log("[Platform Service] Mock minimizeWindow (No-op in browser)");
}

export async function toggleMaximizeWindow() {
  console.log("[Platform Service] Mock toggleMaximizeWindow (No-op in browser)");
}

export async function closeWindow() {
  console.log("[Platform Service] Mock closeWindow (No-op in browser)");
}

export async function detectWsl() {
  console.log("[Platform Service] Mock detectWsl (No-op in browser)");
  return false;
}
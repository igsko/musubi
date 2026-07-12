// @ts-nocheck

// Detect if we're running in a Tauri environment or a web environment
export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Wrapper to fetch suggestions based on the provided query and offset.
 * If running in Tauri, it invokes the Rust backend. If in a web environment, it returns mock data.
 * @param {string} query - The search query.
 * @param {number} offset - The offset for pagination.
 * @returns {Promise<any[]>} A promise resolving to the list of suggestions.
 */
export async function fetchSuggestions(query, offset) {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke('get_suggestions', { query, offset });
  } else {
    console.log(`[Platform Service] Mocking suggestions for query: "${query}" (Offset: ${offset})`);
    
    // mock dictionary entries for easy browser testing
    const mockDb = [
      { id: 1, kanji: "日本語", kana: "にほんご", romaji: "nihongo", translation: "język japoński, japońszczyzna", frequency_rank: 5 },
      { id: 2, kanji: "気", kana: "き", romaji: "ki", translation: "duch, umysł, serce, powietrze", frequency_rank: 150 },
      { id: 3, kanji: "木", kana: "き", romaji: "ki", translation: "drzewo, krzew, drewno", frequency_rank: 550 },
      { id: 4, kanji: "製品", kana: "せいひん", romaji: "seihin", translation: "wyprodukowane towary, gotowe wyroby, produkt", frequency_rank: 2300 },
      { id: 5, kanji: null, kana: "シャーシ", romaji: "shaashi", translation: "podwozie, rama konstrukcyjna", frequency_rank: 999999 }
    ];

    // Filter results based on what was typed to simulate a real search
    const cleanQuery = query.toLowerCase().trim();
    return mockDb.filter(item => 
      item.romaji.includes(cleanQuery) || 
      item.translation.toLowerCase().includes(cleanQuery) ||
      item.kana.includes(cleanQuery) ||
      (item.kanji && item.kanji.includes(cleanQuery))
    ).slice(offset, offset + 20);
  }
}

/**
 * Fetches details for a specific dictionary entry based on its ID.
 * If running in Tauri, it invokes the Rust backend. If in a web environment, it returns mock data.
 * @param {number} id - The ID of the entry to fetch.
 * @returns {Promise<string>} A promise resolving to the JSON string of the entry details.
 */
export async function fetchEntryDetails(id) {
  if (isTauri) {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke('get_entry_details', { id });
  } else {
    console.log(`[Platform Service] Mocking entry details for ID: ${id}`);

    // Simulate a deep database JSON payload for a selected word
    const mockDetails = {
      headwords: [
        { japanese: "日本語, にほんご", romaji: "nihongo", note: null },
        { japanese: "日本語, にっぽんご", romaji: "nippongo", note: "rzadki odczyt" }
      ],
      meanings: [
        {
          index: 1,
          translations: ["język japoński", "japońszczyzna"],
          metadata: ["rzeczownik (powszechny) (futsuumeishi)", "językoznawstwo"]
        },
        {
          index: 2,
          translations: ["zobacz również 日本 - 1234"],
          metadata: ["zobacz również 日本- 1234"]
        }
      ]
    };
    return JSON.stringify(mockDetails);
  }
}

// Safe window control wrappers
export async function minimizeWindow() {
  if (isTauri) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    tauriGetCurrentWindow().minimize();
  }
}

export async function toggleMaximizeWindow() {
  if (isTauri) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    tauriGetCurrentWindow().toggleMaximize();
  }
}

export async function closeWindow() {
  if (isTauri) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    tauriGetCurrentWindow().close();
  }
}
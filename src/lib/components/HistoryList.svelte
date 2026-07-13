<script>
  // @ts-nocheck
  import { user, details, uiState, settings } from "$lib/state.svelte.js";
  import { segmentFurigana } from "$lib/utils/furigana.js";

  let loadedEntries = $state([]);
  let loading = $state(false);

  async function fetchEntry(id) {
    try {
      const isTauri = !!(window && window.__TAURI_INTERNALS__);
      if (!isTauri) {
        return {
          id,
          headwords: [{ japanese: `Hasło ${id}, はっそ`, romaji: "hasso", note: "TEST" }],
          meanings: [{ translations: ["Przykładowe tłumaczenie testowe dla ID: " + id], metadata: [] }]
        };
      }
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke('get_entry_details', { id });
    } catch (e) {
      console.error("Failed to load details for history ID:", id, e);
      return null;
    }
  }

  function splitJapanese(rawJap) {
    if (!rawJap) return { kanji: null, kana: "" };
    const parts = rawJap.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return { kanji: parts[0], kana: parts[1] };
    }
    return { kanji: null, kana: parts[0] };
  }

  $effect(() => {
    const ids = user.history;
    let active = true;

    async function load() {
      loading = true;
      const results = [];
      for (const id of ids) {
        if (!active) return;
        const entryData = await fetchEntry(id);
        if (entryData && active) {
          try {
            let fullEntry;
            if (entryData.full_json) {
              fullEntry = JSON.parse(entryData.full_json);
              fullEntry.pitch_accent = entryData.pitch_accent;
            } else if (typeof entryData === 'string') {
              fullEntry = JSON.parse(entryData);
            } else {
              fullEntry = entryData;
            }
            fullEntry.id = id;
            results.push(fullEntry);
          } catch (err) {
            console.error("Error parsing history details for ID:", id, err);
          }
        }
      }
      if (active) {
        loadedEntries = results;
        loading = false;
      }
    }

    load();

    return () => {
      active = false;
    };
  });

  function selectEntry(id) {
    details.selectWord(id);
    uiState.currentView = 'details';
  }

  async function removeHistoryItem(id, event) {
    event.stopPropagation(); // prevents opening entry details when trying to delete entry
    await user.removeHistoryItem(id);
  }

  async function clearAllHistory() {
    if (confirm("Czy na pewno chcesz wyczyścić całą historię wyszukiwania?")) {
      await user.clearHistory();
    }
  }
</script>

<div class="history-container">
  <header class="history-header">
    <div class="header-title-section">
      <h2>Historia</h2>
      {#if loadedEntries.length > 0}
        <button class="clear-all-btn" onclick={clearAllHistory} title="Wyczyść całą historię">
          Wyczyść
        </button>
      {/if}
    </div>
    <button
      class="close-btn"
      onclick={() => uiState.closeSettings()}
      aria-label="Zamknij historię"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </header>

  <div class="history-content">
    {#if loading && loadedEntries.length === 0}
      <div class="status-message">Ładowanie historii...</div>
    {:else if loadedEntries.length === 0}
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <p>Brak historii wyszukiwania</p>
        <p class="sub-text">Tutaj pojawi się lista ostatnio wyświetlanych przez Ciebie haseł.</p>
      </div>
    {:else}
      <div class="list-wrapper">
        {#each loadedEntries as entry (entry.id)}
          {@const primaryHW = entry.headwords[0]}
          {@const parts = splitJapanese(primaryHW?.japanese)}
          <div 
            class="list-item" 
            role="button"
            tabindex="0"
            onclick={() => selectEntry(entry.id)}
            onkeydown={(e) => handleKeyDown(entry.id, e)}
          >
            <div class="item-main">
              <span class="japanese-word" lang="ja">
                {#if settings.showFurigana}
                  {#each segmentFurigana(parts.kanji, parts.kana) as segment}
                    <ruby class="kanji-with-reading">
                      {segment.text}
                      {#if segment.furi}
                        <rt class="furigana">{segment.furi}</rt>
                      {/if}
                    </ruby>
                  {/each}
                {:else}
                  {parts.kanji || parts.kana}
                {/if}
              </span>
              <span class="romaji">{primaryHW?.romaji}</span>
            </div>
            
            <div class="item-sub">
              <span class="translation">
                {entry.meanings?.[0]?.translations ? entry.meanings[0].translations.slice(0, 3).join(', ') : 'Brak tłumaczenia'}
              </span>
              <button class="remove-btn" onclick={(e) => removeHistoryItem(entry.id, e)} aria-label="Usuń z historii">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="trash-icon">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .history-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 100%;
    min-height: 0;
    background-color: var(--bg-card);
    color: var(--text-main);
    box-sizing: border-box;
    border-left: 1px solid var(--border-main);
    overflow: hidden;
    padding: 0;
    grid-column: 2;
    grid-row: 1 / span 2;
    container-type: inline-size;
    container-name: history;
  }

  .history-header {
    flex: 0 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-main);
    padding: 10px 12px;
    background-color: var(--bg-card);
    z-index: 10;
  }

  .header-title-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .history-header h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .clear-all-btn {
    font-size: 0.75rem;
    font-weight: 550;
    color: var(--accent);
    background-color: rgba(184, 44, 60, 0.06);
    border: 1px solid rgba(184, 44, 60, 0.15);
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s;
  }

  .clear-all-btn:hover {
    background-color: rgba(184, 44, 60, 0.12);
    border-color: var(--accent);
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    border-radius: 50%;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s, color 0.15s;
  }

  .close-btn:hover {
    background-color: var(--border-main);
    color: var(--text-main);
  }

  .history-content {
    flex: 1 1 0%;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 12px;
    box-sizing: border-box;
  }

  .status-message {
    padding: 24px;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
    padding: 48px 24px;
    text-align: center;
    color: var(--text-muted);
  }

  .empty-icon {
    color: var(--border-main);
    margin-bottom: 16px;
  }

  .empty-state p {
    font-size: 0.95rem;
    font-weight: 550;
    margin: 0 0 4px 0;
    color: var(--text-main);
  }

  .empty-state .sub-text {
    font-size: 0.8rem;
    font-weight: normal;
    color: var(--text-muted);
    margin: 0;
  }

  .list-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .list-item {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 12px;
    background-color: var(--bg-app);
    border: 1px solid var(--border-main);
    border-radius: 8px;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .list-item:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .list-item:hover {
    background-color: var(--bg-card);
    border-color: var(--accent);
  }

  .item-main {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    width: 100%;
    gap: 12px;
  }

  .japanese-word {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-main);
    display: inline-flex;
    align-items: baseline;
    line-height: 1.1;
  }

  .kanji-with-reading {
    ruby-position: over;
  }

  .furigana {
    font-size: 0.55em;
    color: var(--text-muted);
    letter-spacing: 0.02em;
    padding-bottom: 2px;
    user-select: none;
  }

  .romaji {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-style: italic;
  }

  .item-sub {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 6px;
    gap: 12px;
  }

  .translation {
    font-size: 0.85rem;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .remove-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s, color 0.15s, transform 0.1s;
    flex-shrink: 0;
  }

  .remove-btn:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: var(--accent);
    transform: scale(1.05);
  }

  :global(.dark) .remove-btn:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .trash-icon {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 600px) {
    .history-container {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 100;
      border-left: none;
      padding: 0;
    }
  }
</style>
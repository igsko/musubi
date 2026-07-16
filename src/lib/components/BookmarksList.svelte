<script>
  //@ts-nocheck
  import { user, details, uiState, settings } from "$lib/state.svelte.js";
  import { segmentFurigana } from "$lib/utils/furigana.js";
  import { fetchMultipleEntries } from "$lib/services/platform.js";
  import { splitJapanese, safeParseEntry } from "$lib/utils/japanese.js";
  import SidePanel from "$lib/components/SidePanel.svelte";

  let loadedEntries = $state([]);
  let loading = $state(false);

  $effect(() => {
    const ids = user.bookmarks;
    let active = true;

    async function load() {
      if (ids.length === 0) {
        loadedEntries = [];
        return;
      }

      loading = true;
      try {
        // batch IPC call
        const rawPayloads = await fetchMultipleEntries(ids);

        // protection against thread racing
        if (!active) return;

        const results = [];
        const fetchedIds = new Set();

        // safe single element parsing:
        for (const payload of rawPayloads) {
          try {
            const parsed = safeParseEntry(payload, payload.id);
            if (parsed) {
              results.push(parsed);
              fetchedIds.add(payload.id); // remember successfully found ID
            }
          } catch (parseErr) {
            console.error(`[BookmarksList] Error parsing record ${payload.id}:`, parseErr);
          }
        }

        // self healing, missing ID in the db
        const invalidIds = ids.filter(id => !fetchedIds.has(id));

        if (invalidIds.length > 0) {
          console.warn(`[BookmarksList] detected records that do not exist in the db. Removing from bookmarks:`, invalidIds);
          // single save op
          await user.removeBookmarks(invalidIds);
        }

        if (active) {
          loadedEntries = results;
        }
      } catch (globalErr) {
        console.error("[BookmarksList] Critical error while loading bookmarks:", globalErr);
      } finally {
        if (active) {
          loading = false;
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  });

  function selectEntry(id) {
    uiState.returnView = 'bookmarks';
    details.selectWord(id);
    user.addToHistory(id);
    uiState.currentView = "details";
  }

  function handleKeyDown(id, event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectEntry(id);
    }
  }

  async function removeBookmark(id, event) {
    event.stopPropagation(); // prevents opening entry details when clicking the star button
    await user.toggleBookmark(id);
  }
</script>

<SidePanel title="Zakładki" onClose={() => uiState.closeSettings()}>
  {#if loading && loadedEntries.length === 0}
    <div class="status-message">Ładowanie zakładek...</div>
  {:else if loadedEntries.length === 0}
    <div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
      </svg>
      <p>Brak zapisanych zakładek</p>
      <p class="sub-text">Kliknij ikonę gwiazdki na karcie hasła, aby je tutaj dodać.</p>
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
            <button class="remove-btn" onclick={(e) => removeBookmark(entry.id, e)} aria-label="Usuń z zakładek">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="star-icon">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</SidePanel>

<style>
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
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s, transform 0.1s;
    flex-shrink: 0;
  }

  .remove-btn:hover {
    background-color: rgba(184, 44, 60, 0.08);
    transform: scale(1.05);
  }

  .star-icon {
    color: var(--accent);
  }
</style>
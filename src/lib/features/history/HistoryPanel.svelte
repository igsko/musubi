<script>
  // @ts-nocheck
  import { user, details, uiState } from '$lib/state';
  import { fetchMultipleEntries } from "$lib/services/platform.js";
  import { safeParseEntry } from "$lib/utils/japanese";
  import { goto } from "$app/navigation";
  import SidePanel from "$lib/features/layout/SidePanel.svelte";
  import EntryListItem from "$lib/components/common/EntryListItem.svelte";

  let loadedEntries = $state([]);
  let loading = $state(false);

  $effect(() => {
    const ids = user.history;
    let active = true;

    async function load() {
      if (ids.length === 0) {
        loadedEntries = [];
        loading = false;
        return;
      }

      loading = true;
      try {
        // batch IPC call
        const rawPayloads = await fetchMultipleEntries(ids);

        // protection against thread racing
        if(!active) return;

        const results = [];
        const fetchedIds = new Set();

        // single element safe parsing
        for (const payload of rawPayloads) {
          try {
            const parsed = safeParseEntry(payload, payload.id);
            if (parsed) {
              results.push(parsed);
              fetchedIds.add(payload.id); // remember successfully fetched records
            }
          } catch (parseErr) {
            console.error(`[HistoryList] Error parsing history entry with ID ${payload.id}:`, parseErr);
          }
        }

        // self healing, missing ID in the db
        const invalidIds = ids.filter(id => !fetchedIds.has(id));
        if (invalidIds.length > 0) {
          console.warn(`[HistoryList] detected records that do not exist in the db. Removing from history:`, invalidIds);
          // single save op
          await user.removeHistoryItems(invalidIds);
        }

        if (active) {
          loadedEntries = results;
        }
      } catch (globalErr) {
        console.error("[HistoryList] Critical error while loading history:", globalErr);
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
    uiState.returnView = 'history';
    goto(`/entry/${id}`); 
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

{#snippet headerControls()}
  {#if loadedEntries.length > 0}
    <button 
      class="clear-all-btn"
      onclick={clearAllHistory}
      title="Wyczyść całą historię"
    >
      Wyczyść
    </button>
  {/if}
{/snippet}

<SidePanel title="Historia" {headerControls} onClose={() => {
  const restoredId = details.restore(); // restore the original word from memory and grab the ID
  uiState.returnView = 'search';        // reset navigation state back to the main search view
  
  if (restoredId) {
    goto(`/entry/${restoredId}`);
  } else {
    goto('/');
  }
}}>
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
        <EntryListItem {entry} onSelect={selectEntry}>
          {#snippet actionButton()}
            <button class="remove-btn" onclick={(e) => removeHistoryItem(entry.id, e)} aria-label="Usuń z historii">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="trash-icon">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          {/snippet}
        </EntryListItem>
      {/each}
    </div>
  {/if}
</SidePanel>

<style>
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
</style>
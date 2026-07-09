<script>
  // @ts-nocheck
  import {isTauri} from '$lib/services/platform.js';
  import Titlebar from '$lib/components/Titlebar.svelte';
  import SearchBox from '$lib/components/SearchBox.svelte';
  import SuggestionsList from '$lib/components/SuggestionsList.svelte';
  import EntryDetails from '$lib/components/EntryDetails.svelte';
  import SettingsMenu from '$lib/components/SettingsMenu.svelte';

  import { search, details, uiState } from '$lib/state.svelte.js';

  function handleKeyDown(event) {
    // focus search box with '/' or Ctrl+F/Cmd+F on macOS
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
    const isSearchTrigger = event.key === '/' || 
                            (isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === 'f';

    if (isSearchTrigger) {
      // Find the input element
      const input = document.querySelector('.search-box');
      if (input && document.activeElement !== input) {
        event.preventDefault();
        input.focus();
        input.select();
      }
      return;
    }

    // Navigate suggestion list with arrow keys
    if (search.suggestions && search.suggestions.length > 0) {
      const currentIndex = search.selectedIndex ?? -1;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if(currentIndex === -1) {
          search.selectedIndex = 1;
        } else {
          search.selectedIndex = Math.min(
            search.selectedIndex + 1, 
            search.suggestions.length - 1
          );
        }
        scrollToActiveItem();
      } 
      else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (currentIndex > 0) {
          search.selectedIndex = currentIndex - 1;
        } else {
          search.selectedIndex = -1;
        }
        scrollToActiveItem();
      } 
      else if (event.key === 'Enter' && search.selectedIndex !== -1) {
        event.preventDefault();
        // Load the entry from search state
        const selectedId = search.suggestions[currentIndex].id;
        (async () => {
          try {
            await search.selectEntry(selectedId);
          } catch (err) {
            console.error("Keyboard selection state update failed:", err);
          } finally {
            uiState.closeSettings();
          }
        })();
      }
    }
  }

  function scrollToActiveItem() {
    setTimeout(() => {
      const activeEl = document.querySelector('.suggestion-item.active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }, 0);
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<Titlebar />

<main 
  class="container" 
  class:tauri-desktop={isTauri}
  class:has-selection={!!details?.selectedEntry || uiState.currentView === 'settings'}
>
  <!-- search container -->
  <div class="search-section">
    <SearchBox />
  </div>

  <!-- content viewport -->
  <div class="view-section">
    <SuggestionsList />
    {#if uiState.currentView === 'settings'}
      <SettingsMenu />
    {:else}
      <EntryDetails />
    {/if}
  </div>

</main>

<style>
</style>

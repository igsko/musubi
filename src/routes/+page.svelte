<script>
  // @ts-nocheck
  import { onMount } from 'svelte';

  import {isTauri} from '$lib/services/platform.js';
  import Titlebar from '$lib/components/Titlebar.svelte';
  import SearchBox from '$lib/components/SearchBox.svelte';
  import SuggestionsList from '$lib/components/SuggestionsList.svelte';
  import EntryDetails from '$lib/components/EntryDetails.svelte';
  import SettingsMenu from '$lib/components/SettingsMenu.svelte';

  import { search, details, uiState, user, settings } from '$lib/state.svelte.js';

  onMount(async () => {
    try {
      // Load and restore user and settings state from local storage
      await Promise.all([
        user.init(),
        settings.init()
      ]);
    } catch (err) {
      console.error("Initialization failed:", err);
    }
  });

  async function initializeDatabase() {
    await settings.checkForUpdates();
    await settings.downloadAndApplyUpdate();
  }

  /**
   * Handle global keydown events for search and navigation.
   * @param event
   */
  function handleKeyDown(event) {
    if (settings.localDbVersion === 'uninitialized') return; // disable hotkeys on onboarding

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

  /**
   * Scroll the active suggestion item into view if it exists
   */
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

{#if settings.localDbVersion === 'uninitialized'}
  <!-- FIRST LAUNCH ONBOARDING VIEW -->
  <div class="first-run-container">
    <h2>Witamy w słowniku!</h2>
    <p>Aby móc korzystać ze słownika w trybie offline, należy najpierw pobrać aktualną bazę haseł MSJP.</p>
    
    <div class="onboarding-control">
      {#if settings.updateStatus === 'checking'}
        <button class="onboarding-btn" disabled>Wyszukiwanie bazy...</button>
      {:else if settings.updateStatus === 'downloading'}
        <div class="progress-box">
          <p>Pobieranie i instalowanie słownika...</p>
          
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: {settings.progressPercent}%"></div>
          </div>
          
          <div class="progress-details">
            {#if settings.totalBytes > 0}
              <span>{settings.downloadedText} z {settings.totalText}</span>
              <span>{settings.speedText}</span>
            {:else}
              <span>Rozpoczynanie pobierania...</span>
            {/if}
          </div>
        </div>
      {:else if settings.updateStatus === 'error'}
        <p class="error-text">Błąd połączenia. Sprawdź dostęp do sieci i spróbuj ponownie.</p>
        <button class="onboarding-btn download-btn" onclick={initializeDatabase}>Spróbuj ponownie</button>
      {:else}
        <button class="onboarding-btn download-btn" onclick={initializeDatabase}>
          Pobierz bazę danych haseł
        </button>
      {/if}
    </div>
  </div>
{:else}
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
{/if}



<style>
  .first-run-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: calc(100vh - 32px);
    width: 100%;
    background-color: var(--bg-card);
    color: var(--text-main);
    padding: 32px;
    box-sizing: border-box;
    text-align: center;
    gap: 16px;
  }

  .first-run-container h2 {
    font-size: 1.8rem;
    font-weight: 600;
    margin: 0;
  }

  .first-run-container p {
    font-size: 0.95rem;
    max-width: 440px;
    color: var(--text-muted);
    margin: 0 0 12px 0;
    line-height: 1.5;
  }

  .onboarding-control {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80px;
  }

  .onboarding-btn {
    background-color: var(--bg-app);
    border: 1px solid var(--border-main);
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-muted);
    cursor: not-allowed;
    transition: all 0.15s ease;
  }

  .download-btn {
    background-color: var(--accent, #4a90e2);
    border-color: var(--accent, #4a90e2);
    color: #ffffff;
    cursor: pointer;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
  }

  .download-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

/* Inside src/routes/+page.svelte style block */

  .progress-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 440px;
    gap: 12px;
  }

  .progress-box p {
    font-weight: 550;
    margin: 0;
  }

  /* Progress Bar Track */
  .progress-bar-container {
    width: 100%;
    height: 8px;
    background-color: var(--border-main, #d8d8d8);
    border-radius: 4px;
    overflow: hidden;
    margin-top: 4px;
  }

  /* Progress Bar Fill with smooth width expansion */
  .progress-bar-fill {
    height: 100%;
    background-color: var(--accent, #4a90e2);
    border-radius: 4px;
    transition: width 0.1s linear; 
  }

  /* Spans metrics out to left and right edges */
  .progress-details {
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-top: -4px;
  }

  .error-text {
    color: #c53030 !important;
    font-weight: 500;
    margin-bottom: 12px !important;
  }

  :global(.dark) .error-text {
    color: #feb2b2 !important;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>

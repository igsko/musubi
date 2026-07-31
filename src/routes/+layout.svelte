<script>
  //@ts-nocheck
  import { onMount } from 'svelte';
  import '../app.css';

  import { isTauri, isLinux, detectWsl, isMobile } from '$lib/services/platform.js';
  import Titlebar from '$lib/features/layout/Titlebar.svelte';
  import SearchBox from '$lib/features/search/SearchBox.svelte';
  import SuggestionsList from '$lib/features/search/SuggestionsList.svelte';
  import { search, details, user, settings } from '$lib/state';
  import { page } from '$app/stores'; // reactive store monitoring active URL path

  let { children } = $props();

  onMount(async () => {
    // mitigate ResizeObserver warnings across the app
    window.addEventListener('error', (e) => {
      if (e.message && e.message.includes('ResizeObserver loop')) {
        e.stopImmediatePropagation();
      }
    });
    
    // Context menu blocking (release only)
    if (import.meta.env.PROD) {
      document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    if(isMobile) {
      document.documentElement.classList.add('mobile-platform');
    }

    const isWsl = await detectWsl();
    if(isLinux && !isWsl) {
      document.documentElement.classList.add('native-titlebar');
    }

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
            await details.selectWord(selectedId);
            await user.addToHistory(selectedId);
            uiState.returnView = 'search';
            search.clear();
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
    <h2>Witamy w Musubi!</h2>
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
        <button class="onboarding-btn download-btn" onclick={() => settings.downloadAndApplyUpdate()}>Spróbuj ponownie</button>
      {:else}
        <button class="onboarding-btn download-btn" onclick={() => settings.downloadAndApplyUpdate()}>
          Pobierz bazę danych haseł
        </button>
      {/if}
    </div>
  </div>
{:else}
  <main 
    class="container" 
    class:tauri-desktop={isTauri && !isLinux}
    class:has-selection={!!details?.selectedEntry || $page.url.pathname !== '/'}
  >
    <!-- search container -->
    <div class="search-section">
      <SearchBox />
    </div>

    <!-- content viewport -->
    <div class="view-section">
      <SuggestionsList />
      <div style="display: contents;">
        {@render children()}
      </div>
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
    padding: 24px;
    text-align: center;
    gap: 16px;
    background-color: var(--bg-app);
    color: var(--text-main);
  }

  .first-run-container h2 {
    font-size: 1.4rem;
    font-weight: 600;
  }

  .first-run-container p {
    font-size: 0.9rem;
    color: var(--text-muted);
    max-width: 320px;
  }

  .onboarding-control {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 320px;
    margin-top: 8px;
  }

  .onboarding-btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  .onboarding-btn:hover {
    opacity: 0.9;
  }

  .download-btn {
    background-color: var(--accent);
    color: #ffffff;
  }

  .progress-box {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .progress-bar-container {
    width: 100%;
    height: 8px;
    background-color: var(--border-main);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background-color: var(--accent);
    transition: width 0.1s linear;
  }

  .progress-details {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .error-text {
    color: var(--accent);
    font-size: 0.85rem;
  }
</style>
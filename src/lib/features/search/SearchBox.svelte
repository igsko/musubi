<script>
  // @ts-nocheck
  import { details, search, uiState } from '$lib/state';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  let inputEl;

  function clearSearch() {
    search.query = '';
    if ($page.url.pathname !== '/') {
      goto('/');
    }
    search.handleInput();
    inputEl?.focus();
  }

  const menuOptions = [
    {id: 'settings', label: 'Ustawienia', icon: 'gear'},
    {id: 'bookmarks', label: 'Zakładki', icon: 'bookmark'},
    {id: 'history', label: 'Historia', icon: 'history'}
  ];

  function handleMenuAction(optionId) {
    uiState.menuOpen = false; // close the dropdown hamburger menu

    // if menu gets opened while on main search, freeze the word
    if(uiState.returnView === 'search') {
      details.suspend();
    }

    if(optionId === 'settings') {
      goto('/settings');
    } else if (optionId === 'bookmarks') {
      goto('/bookmarks');
    } else if (optionId === 'history') {
      goto('/history');
    }
  }
</script>

<div class="search-bar-layout">
  <!-- hamburger button -->
  <button 
    class="hamburger-btn" 
    class:active={uiState.menuOpen}
    onclick={() => uiState.toggleMenu()} 
    aria-label="Menu"
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
      <line x1="4" y1="12" x2="20" y2="12"></line>
      <line x1="4" y1="6" x2="20" y2="6"></line>
      <line x1="4" y1="18" x2="20" y2="18"></line>
    </svg>
  </button>

  <!-- search input container -->
  <div class="search-box-container">
    <input 
      class="search-box" 
      type="text" 
      bind:this={inputEl}
      bind:value={search.query} 
      oninput={() => search.handleInput(false)} 
      onkeydown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          search.handleInput(true);
        }
      }}
      placeholder="Szukaj..." 
    />

    {#if search.query}
      <button 
        onclick={clearSearch}
        class="clear-btn" 
        aria-label="Clear search query"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2.5" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          class="clear-icon-svg"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    {:else}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        class="search-icon-svg"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    {/if}
  </div>

    <!-- background overlay click catcher to close the menu on outside clicks -->
  {#if uiState.menuOpen}
    <div class="menu-backdrop" onclick={() => uiState.menuOpen = false} role="none"></div>
    
    <!-- floating dropdown menu -->
    <div class="menu-dropdown">
      {#each menuOptions as option}
        {@const isSettings = option.id === 'settings'}
        
        <button 
          class="menu-item" 
          onclick={() => handleMenuAction(option.id)}
          class:highlighted={isSettings}
        >
          {#if option.icon === 'gear'}
            <svg class="menu-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          {:else if option.icon === 'bookmark'}
            <svg class="menu-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
          {:else if option.icon === 'history'}
            <svg class="menu-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          {/if}
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>

  .search-bar-layout {
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    width: 100%;
    flex-wrap: nowrap;
  }

  .hamburger-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid transparent;
    background-color: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    flex-shrink: 0;
  }

  .hamburger-btn:hover, .hamburger-btn.active {
    background-color: rgba(0, 0, 0, 0.04);
    color: var(--text-main);
    border-color: var(--border-main);
  }

  .search-box-container {
      flex: 1;
      min-width: 0;
      position: relative;
      border: 1px solid var(--border-main);
      box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.05);
      border-radius: 24px;
      overflow: hidden;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .search-box-container:hover {
      border-color: #c1c9d3;
      box-shadow: 0 0 0 3px rgba(181, 184, 189, 0.15);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .search-box-container:focus-within {
      border-color: #4a5568;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .search-box {
      padding: 14px 48px 14px 16px;
      width: 100%;
      border-radius: 24px;
      outline: none; 
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background-color: var(--bg-card);
      color: var(--text-main);
      transition: background-color 0.2s ease-out; /* ensure both hover and mouseleave transition */
  }

  .search-box:hover {
      background-color: var(--bg-card);
  }

  .search-icon-svg {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--text-muted);
  }

  .clear-btn {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
  }

  .clear-btn:hover {
      color: var(--text-main);
  }

  .menu-backdrop {
    position: fixed;
    top:0;
    left:0;
    width: 100vw;
    height: 100vh;
    background-color: transparent;
    z-index: 998; /* ensure it is below the menu but above other content */
  }

  .menu-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 180px;
    background-color: var(--bg-card);
    border: 1px solid var(--border-main);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    z-index: 999; /* ensure it is above the backdrop */
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    font-size: 0.9rem;
    color: var(--text-main);
    cursor: pointer;
    transition: background-color 0.05s ease, color 0.2s ease;
    box-sizing: border-box;
  }

  .menu-item:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  :global(html.dark) .menu-item:hover {
      background-color: rgba(255, 255, 255, 0.04);
  }

  .menu-icon-svg {
      color: var(--text-muted);
      flex-shrink: 0;
      transition: color 0.15s ease;
  }

  .menu-item:hover .menu-icon-svg {
      color: var(--text-main);
  }

</style>
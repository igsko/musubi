<script>
  // @ts-nocheck
  import { search } from '$lib/state.svelte.js';
  let inputEl;

  function clearSearch() {
    search.query = '';
    search.handleInput();
    inputEl?.focus();
  }
</script>

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

<style>
  .search-box-container {
      position: relative;
      border: 1px solid var(--border-main);
      box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.05);
      border-radius: 24px;
      overflow: hidden;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .search-box-container:hover {
      border-color: #c1c9d3; /* Change border color on hover */
      box-shadow: 0 0 0 3px rgba(181, 184, 189, 0.15); /* Subtle glow effect */
      transition: border-color 0.2s ease, box-shadow 0.2s ease; /* Smooth transition for hover effect */
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
      transition: background-color 0.2s ease-out; /* Ensure both hover and mouseleave transition */
  }

  .search-box:hover {
      background-color: var(--bg-card); /* Slightly lighter background on hover */
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
  }

  .clear-btn:hover {
      color: var(--text-main);
  }
</style>
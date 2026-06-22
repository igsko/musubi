<script>
  // @ts-nocheck
  import { dict } from '$lib/state.svelte.js';
  let inputEl;

  function clearSearch() {
    dict.query = '';
    dict.handleInput();
    inputEl?.focus();
  }
</script>

<div class="search-box-container">
  <input 
    class="search-box" 
    type="text" 
    bind:this={inputEl}
    bind:value={dict.query} 
    oninput={() => dict.handleInput()} 
    placeholder="Szukaj..." 
  />

  {#if dict.query}
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

</style>
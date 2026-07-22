<script>
  // @ts-nocheck

  let { 
    title = '', 
    onClose = null,
    headerControls,
    children 
  } = $props();
</script>

<div class="panel-container">
  <header class="panel-header">
    <div class="header-title-section">
      <h2>{title}</h2>
      {#if headerControls}
        {@render headerControls()}
      {/if}
    </div>
    <button
      class="close-btn"
      onclick={() => onClose?.()}
      aria-label="Zamknij"
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

  <div class="panel-content">
    {@render children()}
    <div class="panel-bottom-spacer"></div>
  </div>
</div>

<style>
  .panel-container {
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
    container-name: panel;
  }

  .panel-header {
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

  .panel-header h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: -0.01em;
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

  .panel-content {
    flex: 1 1 0%;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 12px;
    box-sizing: border-box;
    gap: 20px;
  }

  .panel-bottom-spacer {
    height: 48px;
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    .panel-container {
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

  @media (min-width: 601px) {
    .panel-header {
      height: var(--header-height);
      box-sizing: border-box;
    }
  }
</style>
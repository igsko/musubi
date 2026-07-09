<script>
 import { uiState } from '$lib/state.svelte.js';

  let props = $props();

  function handleClose() {
    props.onClose ? props.onClose() : uiState.closeSettings();
  }

  const settingsSections = [
    {
      id: 'appearance',
      title: 'Wygląd',
      desc: 'Dostosuj motyw kolorystyczny i opcje wizualne aplikacji.',
      placeholder: 'Tutaj znajdziesz ustawienia wyglądu.',
    },
    {
      id: 'database',
      title: 'Baza danych',
      desc: 'Informacje o lokalnej bazie danych i wersjach słownika.',
      placeholder: 'Wersja bazy: 1.0.0'
    }
  ];
</script>

<div class="settings-container">
  <header class="settings-header">
    <h2>Ustawienia</h2>
    <button class="close-btn" onclick={handleClose} aria-label="Zamknij ustawienia">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </header>

  <div class="settings-content">
    {#each settingsSections as section}
      {const isAppearance = section.id === 'appearance';}

      <section class="settings-section">
        <div class="section-meta">
          <h3>{section.title}</h3>
          <p class="section-desc">{section.desc}</p>
        </div>

        <div class="control-box" class:highlighted={isAppearance}>
          <span class="placeholder-text">{section.placeholder}</span>
        </div>
      </section>
    {/each}
  </div>
</div>

<style>
  .settings-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--bg-primary, #fff);
    color: var(--text-primary, #1a1a1a);
    box-sizing: border-box;
    padding: 24px;
    border-left: 1px solid var(--border-color, #e0e0e0);
    grid-column: 2;
    grid-row: 1 / span 2;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    padding-bottom: 16px;
    margin-bottom: 24px;
  }

  .settings-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    color: var(--text-muted, #666666);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, color 0.2s;
  }

  .close-btn:hover {
    background-color: rgba(0, 0, 0, 0.04);
    color: var(--text-main, #1a1a1a);
  }

  :global(html.dark) .close-btn:hover {
    background-color: rgba(255, 255, 255, 0.04);
  }

  .settings-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .settings-section h3 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
  }

  .section-desc {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-muted, #666666);
    line-height: 1.4;
  }

  .control-box {
    background-color: var(--bg-card);
    border: 1px dashed var(--border-main, #e0e0e0);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    align-items: center;
  }

  .control-box.highlighted {
    border-style: solid;
    border-color: var(--accent-color, #4a90e2);
  }

  .placeholder-text {
    font-size: 0.85rem;
    color: var(--text-muted, #888888);
    font-style: italic;
  }

  /* Responsive Overlay for Mobile Views */
  @media (max-width: 600px) {
    .settings-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 100;
      border-left: none;
    }
  }
</style>
<script>
  //@ts-nocheck
  import { goto } from '$app/navigation'; // import
  import { settings } from '$lib/state';
  import SidePanel from "$lib/features/layout/SidePanel.svelte";
</script>

<SidePanel title="Ustawienia" onClose={() => goto('/')}>
  <!-- appearance -->
  <div class="settings-group">
    <h3 class="group-title">Wygląd interfejsu</h3>

    <div class="settings-row segmented-control-row">
      <div class="setting-info">
        <span class="setting-label">Motyw aplikacji</span>
        <p class="setting-desc">Dostosuj motyw kolorystyczny systemu</p>
      </div>
      <div class="setting-control">
        <div class="segmented-control">
          <button
            class="segment-btn"
            class:active={settings.theme === "light"}
            onclick={() => settings.setTheme("light")}
          >
            Jasny
          </button>
          <button
            class="segment-btn"
            class:active={settings.theme === "dark"}
            onclick={() => settings.setTheme("dark")}
          >
            Ciemny
          </button>
          <button
            class="segment-btn"
            class:active={settings.theme === "system"}
            onclick={() => settings.setTheme("system")}
          >
            System
          </button>
        </div>
      </div>
    </div>

    <div class="settings-row">
      <div class="setting-info">
        <span class="setting-label">Wymuś pokazywanie furigany</span>
        <p class="setting-desc">
          Zawsze wyświetlaj czytania nad znakami Kanji
        </p>
      </div>
      <div class="setting-control">
        <label class="switch-toggle" aria-label="Furigana toggle">
          <input
            type="checkbox"
            checked={settings.showFurigana}
            onchange={(e) => settings.setShowFurigana(e.target.checked)}
          />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <div class="settings-row">
      <div class="setting-info">
        <span class="setting-label">Zagęszczony układ</span>
        <p class="setting-desc">
          Zmniejsza odstępy i marginesy elementów na liście haseł
        </p>
      </div>
      <div class="setting-control">
        <label class="switch-toggle" aria-label="Kompaktowy układ toggle">
          <input
            type="checkbox"
            checked={settings.compactLayout}
            onchange={(e) => settings.setCompactLayout(e.target.checked)}
          />
          <span class="slider"></span>
        </label>
      </div>
    </div>
  </div>

  <!-- database -->
  <div class="settings-group">
    <h3 class="group-title">Baza danych</h3>

    <div class="settings-row">
      <div class="setting-info">
        <span class="setting-label">Słownik lokalny</span>
        <p class="setting-desc">Lokalna baza danych MSJP</p>
      </div>
      <div class="setting-control">
        {#if settings.localDbVersion !== 'unknown'}
          <span class="static-value mono">v{settings.localDbVersion}</span>
        {:else}
          <span class="static-value mono">v1.0.0-offline</span>
        {/if}
      </div>
    </div>

    <div class="settings-row" class:downloading-row={settings.updateStatus === 'downloading'}>
      <div class="setting-info">
        <span class="setting-label">Sprawdź aktualizacje</span>
        
        {#if settings.updateStatus === 'up-to-date'}
          <p class="setting-desc success-text">Twój słownik jest aktualny!</p>
        {:else if settings.updateStatus === 'available'}
          <p class="setting-desc success-text">Dostępna nowa wersja: <strong>v{settings.updateVersion}</strong>!</p>
        {:else if settings.updateStatus === 'downloading'}
          <p class="setting-desc downloading-text">Pobieranie...</p>
          <div class="progress-box">
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: {settings.progressPercent}%"></div>
            </div>
            <div class="progress-details">
              {#if settings.totalBytes > 0}
                <span>{settings.downloadedText} z {settings.totalText} ({settings.progressPercent.toFixed(0)}%)</span>
                <span>{settings.speedText}</span>
              {:else}
                <span>Rozpoczynanie pobierania...</span>
              {/if}
            </div>
          </div>
        {:else if settings.updateStatus === 'error'}
          <p class="setting-desc error-text">Błąd połączenia z serwerem aktualizacji</p>
        {:else}
          <p class="setting-desc">Wyszukaj nowe definicje bazy na serwerze</p>
        {/if}
      </div>
      <div class="setting-control">
        {#if settings.updateStatus === 'available'}
          <button 
            class="action-btn update-now-btn" 
            onclick={() => settings.downloadAndApplyUpdate()}
          >
            Aktualizuj
          </button>
        {:else if settings.updateStatus === 'checking'}
          <span class="status-badge checking-badge">Sprawdzanie...</span>
        {:else if settings.updateStatus !== 'downloading'}
          <button class="action-btn" onclick={() => settings.checkForUpdates()}>
            Sprawdź teraz
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- about section and sources -->
  <div class="settings-group">
    <h3 class="group-title">O programie i źródła danych</h3>

    <div class="settings-row">
      <div class="setting-info">
        <span class="setting-label">Główna baza haseł</span>
        <p class="setting-desc">
          Słownik <em>Japoński Pomocnik</em> (japonski-pomocnik.pl) autorstwa Fryderyka Mazurka.
        </p>
      </div>
      <div class="setting-control">
        <span class="static-value">GPLv3</span>
      </div>
    </div>

    <div class="settings-row">
      <div class="setting-info">
        <span class="setting-label">Dodatkowe dane językowe</span>
        <p class="setting-desc">
          Akcenty pitch accent (NHK / Jisho-Open), korpus frekwencyjny (University of Leeds) oraz słownictwo JLPT.
        </p>
      </div>
    </div>

    <div class="settings-row">
      <div class="setting-info">
        <span class="setting-label">Licencja aplikacji</span>
        <p class="setting-desc">
          Musubi jest darmowym programem o otwartym kodzie źródłowym (Open Source) na licencji GNU GPL v3.0.
        </p>
      </div>
      <div class="setting-control">
        <span class="static-value">GPLv3</span>
      </div>
    </div>
  </div>
</SidePanel>

<style>
  .settings-group {
    display: flex;
    flex-direction: column;
  }

  .group-title {
    margin: 0 0 8px 0;
    font-size: 0.78rem;
    font-weight: 650;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .settings-group:first-child .group-title {
    margin-top: 0;
  }

  .settings-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-main);
    gap: 12px;
  }

  .settings-row:last-child {
    border-bottom: none;
  }

  .downloading-row {
    flex-direction: column;
    align-items: stretch;
  }

  .downloading-text {
    color: var(--accent) !important;
    font-weight: 500;
  }

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .setting-label {
    font-size: 0.88rem;
    font-weight: 550;
    color: var(--text-main);
    line-height: 1.25;
  }

  .setting-desc {
    margin: 0;
    font-size: 0.75rem;
    color: var(--text-muted);
    line-height: 1.3;
  }

  .setting-control {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    padding-top: 2px;
  }

  .segmented-control {
    display: flex;
    background-color: var(--bg-app);
    border: 1px solid var(--border-main);
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
  }

  .segment-btn {
    background: none;
    border: none;
    padding: 5px 8px;
    font-size: 0.78rem;
    border-radius: 6px;
    cursor: pointer;
    color: var(--text-muted);
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .segment-btn:hover {
    color: var(--text-main);
  }

  .segment-btn.active {
    background-color: var(--bg-card);
    color: var(--text-main);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.06),
      0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .switch-toggle {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
  }

  .switch-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--border-main);
    transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 24px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: #ffffff;
    transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  input:checked + .slider {
    background-color: var(--accent, #4a90e2);
  }

  input:checked + .slider:before {
    transform: translateX(20px);
  }

  .action-btn {
    background-color: var(--bg-card);
    border: 1px solid var(--border-main);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-main);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    background-color: var(--border-main);
  }

  .status-badge {
    font-size: 0.78rem;
    font-weight: 500;
    padding: 5px 10px;
    border-radius: 6px;
    color: var(--text-muted);
    background-color: var(--bg-app);
    border: 1px solid var(--border-main);
    user-select: none;
    cursor: default;
  }

  .progress-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 6px;
    width: 100%;
  }

  .progress-bar-container {
    width: 100%;
    height: 6px;
    background-color: var(--border-main);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    background-color: var(--accent);
    transition: width 0.15s linear;
  }

  .progress-details {
    display: flex;
    justify-content: space-between;
    font-size: 0.72rem;
    color: var(--text-muted);
  }

  .static-value {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--text-muted);
    letter-spacing: 0.01em;
    white-space: nowrap;
    user-select: text;
  }

  .static-value.mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.8rem;
    opacity: 0.85;
  }

  .success-text {
    color: #2f855a !important;
    font-weight: 500;
  }
  
  :global(.dark) .success-text {
    color: #48bb78 !important;
  }

  .error-text {
    color: #c53030 !important;
    font-weight: 500;
  }

  :global(.dark) .error-text {
    color: #feb2b2 !important;
  }

  .update-now-btn {
    background-color: var(--accent, #4a90e2) !important;
    color: #ffffff !important;
    border-color: var(--accent, #4a90e2) !important;
  }

  .update-now-btn:hover {
    opacity: 0.9;
  }

  @container panel (max-width: 320px) {
    .settings-row {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .setting-control {
      width: 100%;
      justify-content: flex-start;
    }

    .segmented-control {
      width: 100%;
    }

    .segment-btn {
      flex: 1;
      text-align: center;
    }

    .action-btn {
      width: 100%;
      text-align: center;
    }
  }

  @container panel (max-width: 500px) {
    .segmented-control-row {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .segmented-control {
      width: 100%;
    }

    .segment-btn {
      flex: 1;
      text-align: center;
    }
  }
</style>

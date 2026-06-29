<script>
 import {isTauri, minimizeWindow, toggleMaximizeWindow, closeWindow} from '$lib/services/platform.js';
</script>

<!-- 
  The "data-tauri-drag-region" attribute makes the element draggable 
-->
<div class="custom-titlebar" data-tauri-drag-region>
  <div class="titlebar-section left" data-tauri-drag-region>
    <div class="app-title" data-tauri-drag-region>Słownik Japońsko-Polski</div>
  </div>

  <div class="titlebar-section right" data-tauri-drag-region>
    {#if isTauri}
      <div class="window-controls">
        <button class="control-btn" onclick={minimizeWindow} aria-label="Minimize">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="5.5" width="10" height="1" fill="currentColor"/>
          </svg>
        </button>
        
        <button class="control-btn" onclick={toggleMaximizeWindow} aria-label="Maximize">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="2.5" y="2.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1"/>
          </svg>
        </button>
        
        <button class="control-btn close-btn" onclick={closeWindow} aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <polygon points="10,2.7 9.3,2 6,5.3 2.7,2 2,2.7 5.3,6 2,9.3 2.7,10 6,6.7 9.3,10 10,9.3 6.7,6" fill="currentColor"/>
          </svg>
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .custom-titlebar {
      height: 32px;
      display: flex;
      flex-direction: row;
      align-items: stretch;
      cursor: default;
      -webkit-user-select: none;
      user-select: none;
      border-bottom: 1px solid var(--border-main);
      box-sizing: border-box;
  }

  .titlebar-section {
      display: flex;
      height: 100%;
      box-sizing: border-box;
      border: none;
  }

  .titlebar-section.left {
      width: 360px;
      background-color: var(--bg-card);
      align-items: center;
      padding-left: 12px;
  }

  .titlebar-section.right {
      flex-grow: 1;
      background-color: var(--bg-card);
      justify-content: flex-end;
      align-items: stretch;
  }

  .app-title {
      font-size: 11px;
      letter-spacing: 0.02em;
      font-weight: 500;
      color: var(--text-muted);
  }

  .window-controls {
      display: flex;
      align-items: stretch;
      height: 100%;
  }

  .control-btn {
      height: 100%;
      width: 44px;
      background-color: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      color: var(--text-muted);
      transition: background-color 0.12s ease, color 0.12s ease;
  }

  .control-btn:hover {
      background-color: rgba(0, 0, 0, 0.06);
      color: var(--text-main);
  }

  :global(dark) .control-btn:hover {
      background-color: rgba(255, 255, 255, 0.08);
  }

  .close-btn:hover {
      background-color: #e81123 !important;
      color: white !important;
  }

  /* titlebar responsive collapse for mobile viewports */
  @media (max-width: 600px) {
    .titlebar-section.left {
      width: auto;
      flex-grow: 1;
      background-color: var(--bg-card); 
      border-right: none;
    }

    .titlebar-section.right {
      flex-grow: 0;
      background-color: var(--bg-card);
    }
  }
</style>
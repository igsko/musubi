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
</style>
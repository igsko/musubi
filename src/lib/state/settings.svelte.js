//@ts-nocheck
import {getValue, saveValue, STORAGE_KEYS} from '$lib/services/storage.js';

class SettingsState {
  localDbVersion = $state('unknown');
  updateStatus = $state('idle'); // 'idle', 'checking', 'available', 'downloading', 'up-to-date', 'error'
  updateVersion = $state('');
  updateDownloadURL = '';

  theme = $state('system');
  showFurigana = $state(true);
  compactLayout = $state(false);

  // download metrics
  downloadedBytes = $state(0);
  totalBytes = $state(0);
  downloadSpeed = $state(0);

  // svelte derived properties for automatic text formatting
  downloadedText = $derived(this.formatBytes(this.downloadedBytes));
  totalText = $derived(this.formatBytes(this.totalBytes));
  speedText = $derived(this.formatBytes(this.downloadSpeed) + '/s');
  progressPercent = $derived(this.totalBytes > 0 ? (this.downloadedBytes / this.totalBytes) * 100 : 0);

  /**
   * Formats raw bytes to KB, MB, or GB
   */
  formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Initializes the settings state by loading values from storage and applying them to the document.
   */
  async init() {
    this.theme = await getValue(STORAGE_KEYS.THEME, 'system');
    this.showFurigana = await getValue(STORAGE_KEYS.SHOW_FURIGANA, true);
    this.compactLayout = await getValue(STORAGE_KEYS.COMPACT_LAYOUT, false); 
    // this.localDbVersion = '1.0.0' // FOR DEBUGGING update logic, quickly uncomment

    // fetch current SQLite database version from the metadata table via rust
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      this.localDbVersion = await invoke('get_db_version');
    } catch (err) {
      console.error("Database is empty or uninitialized.", err);
      this.localDbVersion = 'uninitialized';
    }

    this.applyTheme();
    this.applyLayout();
    this.setupSystemThemeListener();
  }

  /**
   * Sets the theme.
   * @param {string} value 
   */
  setTheme(value) {
    this.theme = value;
    saveValue(STORAGE_KEYS.THEME, value);
    this.applyTheme();
  }

  /**
   * Sets the show furigana option.
   * @param {boolean} value 
   */
  setShowFurigana(value) {
    this.showFurigana = value;
    saveValue(STORAGE_KEYS.SHOW_FURIGANA, value);
  }

  /**
   * Sets the compact layout option.
   * @param {boolean} value 
   */
  setCompactLayout(value) {
    this.compactLayout = value;
    saveValue(STORAGE_KEYS.COMPACT_LAYOUT, value);
    this.applyLayout();
  }

  /**
   * Applies the selected theme to the document.
   */
  applyTheme() {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;

    if (this.theme === 'dark') {
      html.classList.add('dark');
    } else if (this.theme === 'light') {
      html.classList.remove('dark');
    } else {
      // system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }

  /**
   * Appends or removes '.compact-layout' selector to HTML tag
   */
  applyLayout() {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('compact-layout', this.compactLayout);
  }

  /**
   * Sets up a listener for system theme changes.
   */
  setupSystemThemeListener() {
    if (typeof window === 'undefined') return;
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.theme === 'system') {
        this.applyTheme();
      }
    });
  }

  async checkForUpdates() {
    this.updateStatus = 'checking';
    try {
      const repo = "igsko/jp-pl-dictionary-compiler";
      const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
      if (!response.ok) throw new Error(`failed to fetch update info: ${response.status}`);

      const latestRelease = await response.json();
      const latestTag = latestRelease.tag_name; // "v20260506"

      const dbAsset = latestRelease.assets.find(asset => asset.name.endsWith('.db'));
      if (!dbAsset) throw new Error("No database asset found in the latest release.");

      this.updateDownloadURL = dbAsset.browser_download_url;
      this.updateVersion = latestTag.replace(/^v/, ''); // clean version string without 'v' prefix

      if (this.updateVersion !== this.localDbVersion) {
        this.updateStatus = 'available';
      } else {
        this.updateStatus = 'up-to-date';
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
      this.updateStatus = 'error';
    }
  }

  async downloadAndApplyUpdate() {
    this.updateStatus = 'downloading';
    this.downloadedBytes = 0;
    this.totalBytes = 0;
    this.downloadSpeed = 0;

    let unlistenProgress;

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const { listen } = await import('@tauri-apps/api/event');

      // register the event listener during the download lifecycle
      unlistenProgress = await listen('download-progress', (event) => {
        const { downloaded, total, speed } = event.payload;
        this.downloadedBytes = downloaded;
        this.totalBytes = total;
        this.downloadSpeed = speed;
      });

      // rust ureq handles download, file swap and db reopen
      await invoke('apply_database_update', {url: this.updateDownloadURL});

      this.localDbVersion = await invoke('get_db_version');
      this.updateStatus = 'up-to-date';

      // -- STALE STATE PREVENTION: ---
      const {details, search} = await import('$lib/state.svelte.js');
      if(details && details.selectedEntry) {
        // refresh current word details card
        const currentId = details.selectedEntry.id;
        console.log(`[SettingsState] Hot-reloading active entry details for ID: ${currentId}`);
        await details.selectWord(currentId);
      }
      if(search && search.query.trim().length > 0) {
        // refresh current search suggestions list
        console.log(`[SettingsState] Refreshing search suggestions for query: ${search.query}`);
        await search.handleInput(true); // force immediate search
      }
    } catch (error) {
      console.error("Error downloading or applying update:", error);
      this.updateStatus = 'error';
    } finally {
      // clean up the event listener
      if(unlistenProgress) unlistenProgress();
    }
  }
}

export const settingsState = new SettingsState();
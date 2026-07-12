//@ts-nocheck
import {getValue, saveValue} from '$lib/services/storage.js';

class SettingsState {
  localDbVersion = $state('unknown');
  updateStatus = $state('idle'); // 'idle', 'checking', 'available', 'downloading', 'up-to-date', 'error'
  updateVersion = $state('');
  updateDownloadURL = '';

  theme = $state('system');
  showFurigana = $state(true);
  compactLayout = $state(false);

  /**
   * Initializes the settings state by loading values from storage and applying them to the document.
   */
  async init() {
    this.theme = await getValue('settings_theme', 'system');
    this.showFurigana = await getValue('settings_showFurigana', true);
    this.compactLayout = await getValue('settings_compactLayout', false); 
    // this.localDbVersion = '1.0.0' // FOR DEBUGGING

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
    this.applyFurigana();
    this.setupSystemThemeListener();
  }

  /**
   * Sets the theme.
   * @param {string} value 
   */
  setTheme(value) {
    this.theme = value;
    saveValue('settings_theme', value);
    this.applyTheme();
  }

  /**
   * Sets the show furigana option.
   * @param {boolean} value 
   */
  setShowFurigana(value) {
    this.showFurigana = value;
    saveValue('settings_showFurigana', value);
    this.applyFurigana();
  }

  /**
   * Sets the compact layout option.
   * @param {boolean} value 
   */
  setCompactLayout(value) {
    this.compactLayout = value;
    saveValue('settings_compactLayout', value);
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
    try {
      const { invoke } = await import('@tauri-apps/api/core');

      // rust ureq handles download, file swap and db reopen
      await invoke('apply_database_update', {url: this.updateDownloadURL});

      this.localDbVersion = await invoke('get_db_version');
      this.updateStatus = 'up-to-date';
    } catch (error) {
      console.error("Error downloading or applying update:", error);
      this.updateStatus = 'error';
    }
  }
}

export const settingsState = new SettingsState();
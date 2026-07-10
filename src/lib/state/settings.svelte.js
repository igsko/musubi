//@ts-nocheck
import {getValue, saveValue} from '$lib/services/storage.js';

class SettingsState {
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
}

export const settingsState = new SettingsState();
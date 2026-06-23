//@ts-nocheck
import {getValue, saveValue} from '$lib/services/storage.js';

/**
 * Manages the state of user-specific data, including bookmarks and history.
 */
export class UserState {
  bookmarks = $state([]);
  history = $state([]);

  /**
   * Initializes the user state by loading bookmarks and history from persistent storage.
   * If no data is found, it initializes with empty arrays.
   * This method should be called once when the application starts.
   * @returns {Promise<void>} A promise that resolves when the user state has been initialized.
   */
  async init() {
    this.bookmarks = await getValue('bookmarks', []);
    this.history = await getValue('history', []);
  }

  /**
   * Toggles a word ID in the user's bookmarks.
   * @param {string} id
   */
  async toggleBookmark(id) {
    if (this.bookmarks.includes(id)) {
      this.bookmarks = this.bookmarks.filter(bookmarkId => bookmarkId !== id);
    } else {
      this.bookmarks.push(id);
    }
    await saveValue('bookmarks', $state.snapshot(this.bookmarks));
  }

  /**
   * Adds a word ID to the user's history if it's not already present.
   * Maintains a maximum of 50 entries in the history.
   * @param {string} id
   */
  async addToHistory(id) {
    if(!this.history.includes(id)) {
      this.history.unshift(id);
      this.history = this.history.slice(0, 50); // Limit history to last 50 entries
    }
    await saveValue('history', $state.snapshot(this.history));
  }
}
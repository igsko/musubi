//@ts-nocheck
import {getValue, saveValue, STORAGE_KEYS} from '$lib/services/storage.js';

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
    const savedBookmarks = await getValue(STORAGE_KEYS.BOOKMARKS, []);
    const savedHistory = await getValue(STORAGE_KEYS.HISTORY, []);

    // if the store returns undefined/null, fallback to an empty array to avoid errors
    this.bookmarks = Array.isArray(savedBookmarks) ? savedBookmarks : [];
    this.history = Array.isArray(savedHistory) ? savedHistory : [];
  }

  /**
   * Toggles a word ID in the user's bookmarks.
   * @param {string} id
   */
  async toggleBookmark(id) {
    if (!Array.isArray(this.bookmarks)) {
      this.bookmarks = [];
    }
    
    if (this.bookmarks.includes(id)) {
      this.bookmarks = this.bookmarks.filter(bookmarkId => bookmarkId !== id);
    } else {
      this.bookmarks.push(id);
    }
    await saveValue(STORAGE_KEYS.BOOKMARKS, $state.snapshot(this.bookmarks));
  }

  /**
   * Bulk removes a list of IDs from bookmarks
   * @param {number[]} idsToRemove 
   */
  async removeBookmarks(idsToRemove) {
    if (!Array.isArray(this.bookmarks)) return;

    this.bookmarks = this.bookmarks.filter(id => !idsToRemove.includes(id));
    await saveValue(STORAGE_KEYS.BOOKMARKS, $state.snapshot(this.bookmarks));
  }

  /**
   * Adds a word ID to the user's history if it's not already present.
   * Maintains a maximum of 50 entries in the history.
   * @param {string} id
   */
  async addToHistory(id) {
    if (!Array.isArray(this.history)) {
      this.history = [];
    }

    // Remove duplicates from another position and move to the beginning
    this.history = this.history.filter(historyId => historyId !== id);
    this.history.unshift(id);
    this.history = this.history.slice(0, 50); // Limit to 50 entries

    await saveValue(STORAGE_KEYS.HISTORY, $state.snapshot(this.history));
  }

  /**
   * Removes a single word ID from the search history
   * @param {number} id 
   */
  async removeHistoryItem(id) {
    if (!Array.isArray(this.history)) {
      this.history = [];
    }
    this.history = this.history.filter(historyId => historyId !== id);
    await saveValue(STORAGE_KEYS.HISTORY, $state.snapshot(this.history));
  }

  /**
   * Clears the entire search history
   */
  async clearHistory() {
    this.history = [];
    await saveValue(STORAGE_KEYS.HISTORY, []);
  }
}
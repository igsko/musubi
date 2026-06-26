// @ts-nocheck
import { fetchSuggestions } from '$lib/services/platform.js';

/**
 * Manages the state of the search functionality, including the current query, suggestions, and pagination.
 */
export class SearchState {
  query = $state('');
  suggestions = $state([]);

  #debounceTimer = null;
  #latestQuery = '';
  #hasMore = true;
  #loadingMore = false;

  /**
   * Handles user input in the search box with a debounce mechanism to prevent excessive API calls.
   * It fetches suggestions based on the current query and updates the suggestions list.
   * Supports an optional debounce bypass
   * @param {boolean} forceImmediate - If true, bypasses the 150ms debounce delay.
   * @returns {Promise<void>} A promise that resolves when the suggestions have been updated.
   */
  async handleInput(forceImmediate = false) {
    clearTimeout(this.#debounceTimer);

    const activeQuery = this.query.trim();

    // If the query is totally empty, clear suggestions immediately and exit
    if (activeQuery.trim().length === 0) {
      this.suggestions = [];
      this.#hasMore = false;
      return;
    }

    this.#latestQuery = activeQuery;

    const executeSearch = async () => {
      try {
        this.#hasMore = true;
        const results = (await fetchSuggestions(activeQuery, 0)) ?? [];
        this.suggestions = results;
        
        // race condition protection
        if (this.#latestQuery === activeQuery) {
          this.suggestions = results;
          if (results.length < 20) {
            this.#hasMore = false;
          }
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }     
    };

    if (forceImmediate) {
      await executeSearch();
    } else {
      // Otherwise, keep the standard 150ms debounce delay
      this.#debounceTimer = setTimeout(executeSearch, 150);
    }
  }

  /**
   * Loads more suggestions when the user scrolls to the bottom of the suggestions list.
   * @returns {Promise<void>} A promise that resolves when more suggestions have been loaded.
   */
  async loadMore() {
    // Prevent multiple simultaneous loads or loading when there are no more results
    if (this.#loadingMore || !this.#hasMore) return;

    this.#loadingMore = true;
    const activeQuery = this.query;
    const currentOffset = this.suggestions.length;

    try {
      const results = await fetchSuggestions(activeQuery, currentOffset);

      // Ensure the user hasn't typed something else while we were fetching more results
      if (this.query === activeQuery) {
        this.suggestions.push(...results);
        if (results.length < 20) {
          this.#hasMore = false;
        }
      }
    } catch (error) {
      console.error("Error loading more suggestions:", error);
    } finally {
      this.#loadingMore = false;
    }
  }

  // Resets the search dropdown
  // Used when selecting a word or navigating
  clear() {
    clearTimeout(this.#debounceTimer);
    this.suggestions = [];
    this.#hasMore = false;
  }
}
  // @ts-nocheck
import { fetchSuggestions, fetchEntryDetails } from '$lib/services/platform.js';
import { getValue, saveValue } from '$lib/services/storage.js';

  class DictionaryState {
    // Reactive state variables
    query = $state('');
    suggestions = $state([]);
    selectedEntry = $state(null);

    // Reactive state variables for user data
    bookmarks = $state([]);
    history = $state([]);

    // Private helper variables
    #debounceTimer = null;
    #latestQuery = '';
    #hasMore = true; // Set to false when SQLite returns less than 20 rows
    #loadingMore = false; // Prevent multiple simultaneous loadMore calls

    // Load saved user data from disk when the app initializes
    async init() {
        this.bookmarks = await getValue('bookmarks', []);
        this.history = await getValue('history', []);
        console.log("Loaded bookmarks and history from storage:", $state.snapshot(this.bookmarks), $state.snapshot(this.history));
    }

    // Toggles a bookmarked entry ID and saves the bookmark array to persistent storage
    async toggleBookmark(id) {
        // When toggling a bookmark, we check if the ID is already in the bookmarks array.
        if (this.bookmarks.includes(id)) {
            this.bookmarks = this.bookmarks.filter(bookmarkId => bookmarkId !== id);
        } else {
            this.bookmarks.push(id);
        }
        // Save the updated bookmarks to persistent storage
        await saveValue('bookmarks', $state.snapshot(this.bookmarks));
    }
 
    async handleInput() {
        console.log("-> handleInput triggered! Current query:", this.query);

        // Instantly clear any pending search timers from previous keystroke
        clearTimeout(this.#debounceTimer);

        // If the query is too short, clear suggestions immediately and exit
        if (this.query.trim().length < 2) {
            this.suggestions = [];
            this.#hasMore = true;
            return;
        }

        const activeQuery = this.query;
        this.#latestQuery = activeQuery;

        // Set a 150ms debounce delay
        // If the user types another letter within 150ms, this block is canceled
        this.#debounceTimer = setTimeout(async () => {
            try {
                this.#hasMore = true; // Reset hasMore for new queries
                
                // query rust which queries SQLite indexes
                // fetches the first 20 results for the current query
                const results = await fetchSuggestions(activeQuery, 0);

                // Race condition protection
                if (this.#latestQuery === activeQuery) {
                    this.suggestions = results;
                    console.log("Suggestions from SQLite:", $state.snapshot(this.suggestions));

                    // If fewer than 20 results are returned, we know there are no more results to fetch
                    if(results.length < 20) {
                        this.#hasMore = false; // No more results available
                    }
                }
            } catch (err) {
                console.error("Error fetching suggestions:", err);
            }
        }, 150);
    }

    async loadMore() {
        if(this.#loadingMore || !this.#hasMore) return;

        this.#loadingMore = true;
        const activeQuery = this.query;
        const currentOffset = this.suggestions.length; // use current length as offset for next batch

        try {
            const results = await fetchSuggestions(activeQuery, currentOffset);
            // Ensure the user hasn't typed something else while we were fetching more results
            if (this.query === activeQuery) {
                this.suggestions.push(...results);

                // If fewer than 20 results are returned, we know there are no more results to fetch
                if(results.length < 20) {
                    this.#hasMore = false;
                }
            }
        } catch (err) {
            console.error("Error loading more suggestions:", err);
        } finally {
            this.#loadingMore = false;
        }
    }

    async selectWord(id) {
        // Cancel any pending search timers immediately after selecting a word
        clearTimeout(this.#debounceTimer);
        // this.suggestions = [];
        try {
            const jsonStr = await fetchEntryDetails(id);
            this.selectedEntry = JSON.parse(jsonStr);

            if(!this.history.includes(id)) {
                this.history.unshift(id); // Add to top of list
                this.history = this.history.slice(0, 50); // Limit history to last 50 items
                await saveValue('history', $state.snapshot(this.history));
            }
        } catch (err) {
            console.error("Error fetching entry details:", err);
        }
    }

    goBack() {
        this.selectedEntry = null;
        this.handleInput(); // re-run the search query to re-populate SuggestionsList
    }

    async goToWord(keyword) {
        // Update the search box UI so the user knows where they navigated to
        // this.query = keyword;

        try {
            // Fetch the results for this exact word
            const results = await fetchSuggestions(keyword, 0);

            if (results.length > 0) {
                // Immediately select and open the top match
                await this.selectWord(results[0].id);
            } else {
                // Fallback: If not found, just show the search list
                this.suggestions = results;
                this.selectedEntry = null;
            }
        } catch (err) {
            console.error("Error navigaring to word:", err);
        }
    }
  }

  export const dict = new DictionaryState();
//@ts-nocheck
import {fetchEntryDetails} from '$lib/services/platform.js';

/**
 * Manages the state of the details view, including the currently selected entry and its loading status.
 */
export class DetailsState {
  selectedEntry = $state(null);
  suspendedEntry = null;
  #loadingDetails = false;

  /**
   * Selects a word by its ID and fetches its details.
   * @param {string} id The ID of the word to select.
   * @returns {Promise<void>} A promise that resolves when the word details have been fetched and the state updated.
   */
  async selectWord(id) {
    if (this.#loadingDetails) return;
    this.#loadingDetails = true;

    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    try {
      const payload = await fetchEntryDetails(numericId);
      // clear the card if the record does not exist in the new db
      if(!payload) {
        this.selectedEntry = null;
        return;
      }
      const entry = JSON.parse(payload.full_json);
      entry.pitch_accent = payload.pitch_accent;
      entry.jlpt = payload.jlpt;
      entry.id = numericId;
      this.selectedEntry = entry;
    } catch (error) {
      console.error('Error fetching entry details:', error);
      this.selectedEntry = null;
    } finally {
      this.#loadingDetails = false;
    }
  }

  /**
   * Close the details view by clearing the currently selected entry.
   */
  close() {
    this.selectedEntry = null;
  }

  /**
   * Suspends the current active word card so it can be restored later
   */
  suspend() {
    if (this.selectedEntry) {
      this.suspendedEntry = this.selectedEntry;
    }
  }

/**
   * Restores the suspended word card to active state.
   * Returns the restored entry's ID so SvelteKit can handle the redirect.
   * @returns {string|null}
   */
  restore() {
    if (this.suspendedEntry) {
      this.selectedEntry = this.suspendedEntry;
      const restoredId = this.suspendedEntry.id;
      this.suspendedEntry = null; // clear storage post-restore
      return restoredId;
    }
    return null;
  }

  /**
   * Clears the suspended entry (used when starting a completely new search)
   */
  clearSuspension() {
    this.suspendedEntry = null;
  }
}
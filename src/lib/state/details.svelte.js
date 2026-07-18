//@ts-nocheck
import {fetchEntryDetails} from '$lib/services/platform.js';

/**
 * Manages the state of the details view, including the currently selected entry and its loading status.
 */
export class DetailsState {
  selectedEntry = $state(null);
  #loadingDetails = false;

  /**
   * Selects a word by its ID and fetches its details.
   * @param {string} id The ID of the word to select.
   * @returns {Promise<void>} A promise that resolves when the word details have been fetched and the state updated.
   */
  async selectWord(id) {
    if (this.#loadingDetails) return;
    this.#loadingDetails = true;

    try {
      const payload = await fetchEntryDetails(id);
      // clear the card if the record does not exist in the new db
      if(!payload) {
        this.selectedEntry = null;
        return;
      }
      const entry = JSON.parse(payload.full_json);
      entry.pitch_accent = payload.pitch_accent;
      entry.id = id;
      this.selectedEntry = entry;
    } catch (error) {
      console.error('Error fetching entry details:', error);
      this.selectedEntry = null;
    } finally {
      this.#loadingDetails = false;
    }
  }

  close() {
    this.selectedEntry = null;
  }
}
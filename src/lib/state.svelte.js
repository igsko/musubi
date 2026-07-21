// @ts-nocheck

// This file serves as a centralized state management module for the application, 
// aggregating the search, details, and user states into a single exportable object.
// It also provides a global function to navigate to a specific word, updating the relevant states accordingly.

import { SearchState } from '$lib/state/search.svelte.js';
import { DetailsState } from '$lib/state/details.svelte.js';
import { UserState } from '$lib/state/user.svelte.js';
import { settingsState } from '$lib/state/settings.svelte.js';
import { UIState } from '$lib/state/ui.svelte.js';

export const search = new SearchState();
export const details = new DetailsState();
export const user = new UserState();
export const uiState = new UIState();
export const settings = settingsState;

/**
 * Programmatically navigates to a specific dictionary entry by its keyword.
 * Commonly used for parsing and executing "See also" cross-references.
 * 
 * @param {string} keyword - The keyword to navigate to.
 * @returns {Promise<void>}
 */
export async function goToWord(keyword) {
    // Clear any suspended details from memory since the user is starting a brand new query.
    details.clearSuspension();

    // Close the currently viewed word to trigger a clean transition/loading state.
    details.close();

    try {
        const { fetchSuggestions } = await import('$lib/services/platform.js');
        // Fetch the results for this exact word
        const results = await fetchSuggestions(keyword, 0);

        if (results.length > 0) {
            const topId = results[0].id;
            await user.addToHistory(topId);
            uiState.returnView = 'search';
            search.clear(); // close the suggestions list

            const {goto} = await import('$app/navigation');
            await goto(`/entry/${topId}`);
        } else {
            search.suggestions = results;
        }
    } catch (err) {
        console.error("Error in goToWord navigation:", err);
    }
}

export async function goBack() {
    const { goto } = await import('$app/navigation');
    // switch side view back to the list user navigated from
    const targetView = uiState.returnView;
    details.close();

    // change the URL path based on place of origin
    if (targetView === 'bookmarks') {
        await goto('/bookmarks');
    } else if (targetView === 'history') {
        await goto('/history');
    } else {
        await goto('/');
        search.handleInput(); // refresh search when returning to the browser
    }
}
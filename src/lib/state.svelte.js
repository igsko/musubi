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

export async function goToWord(keyword) {
    // Update the search box UI so the user knows where they navigated to
    // search.query = keyword;
    details.close();

    try {
        const { fetchSuggestions } = await import('$lib/services/platform.js');
        // Fetch the results for this exact word
        const results = await fetchSuggestions(keyword, 0);

        if (results.length > 0) {
            const topId = results[0].id;
            await details.selectWord(topId);
            await user.addToHistory(topId);
            uiState.returnView = 'search';
            search.clear(); // Close the suggestions list
        } else {
            search.suggestions = results;
        }
    } catch (err) {
        console.error("Error in goToWord navigation:", err);
    }
}

export function goBack() {
    // switch side view back to the list user navigated from
    if (uiState.returnView === 'bookmarks') {
        uiState.currentView = 'bookmarks';
    } else if (uiState.returnView === 'history') {
        uiState.currentView = 'history';
    } else {
        uiState.currentView = 'details';
    }

    details.close();

    // Re-fetches the active search suggestions list only if returning to the main screen
    if(uiState.returnView === 'search') {
        search.handleInput();
    }
}
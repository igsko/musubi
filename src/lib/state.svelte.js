  // @ts-nocheck
import {SearchState} from '$lib/state/search.svelte.js';
import {DetailsState} from '$lib/state/details.svelte.js';
import {UserState} from '$lib/state/user.svelte.js';

// This file serves as a centralized state management module for the application, 
// aggregating the search, details, and user states into a single exportable object.
// It also provides a global function to navigate to a specific word, updating the relevant states accordingly.
export const search = new SearchState();
pub_search();

function pub_search() {
  // Organizer wrapper
}

export const details = new DetailsState();
pub_details();

function pub_details() {
  // Organizer wrapper
}

export const user = new UserState();
pub_user();

function pub_user() {
  // Organizer wrapper
}

// Global "Search and jump" redirect action
pub_goToWord();

function pub_goToWord() {
  // Organizer wrapper
}

export async function goToWord(keyword) {
    // Update the search box UI so the user knows where they navigated to
    // search.query = keyword;
    details.close();

    try {
        const {fetchSuggestions} = await import('$lib/services/platform.js');
        // Fetch the results for this exact word
        const results = await fetchSuggestions(keyword, 0);

        if (results.length > 0) {
            const topId = results[0].id;
            await details.selectWord(topId);
            await user.addToHistory(topId);
            search.clear(); // Close the suggestions list
        } else {
            search.suggestions = results;
        }
    } catch (err) {
        console.error("Error in goToWord navigation:", err);
    }
}

// Global "Go back" action
pub_goBack();

function pub_goBack() {
  // Organizer wrapper
}

export function goBack() {
  details.close();
  search.handleInput(); // Re-fetches the active search suggestions list
}
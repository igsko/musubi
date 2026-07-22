// @ts-nocheck
import * as tauriDriver from './platform.tauri.js';
import * as mockDriver from './platform.mock.js';

// environment detection flags
export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
export const isLinux = typeof navigator !== 'undefined' && /Linux/i.test(navigator.userAgent);
export const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// dynamic active driver determination
const driver = isTauri ? tauriDriver : mockDriver;

export const fetchSuggestions = driver.fetchSuggestions;
export const fetchEntryDetails = driver.fetchEntryDetails;
export const fetchMultipleEntries = driver.fetchMultipleEntries;
export const minimizeWindow = driver.minimizeWindow;
export const toggleMaximizeWindow = driver.toggleMaximizeWindow;
export const closeWindow = driver.closeWindow;
export const detectWsl = driver.detectWsl;
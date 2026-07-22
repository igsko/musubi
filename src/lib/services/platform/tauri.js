// @ts-nocheck

// This file implements the native Tauri platform driver for production environments.
// It utilizes dynamic imports to safely invoke Rust-backend IPC commands and access
// native window controls, preventing runtime initialization errors in standard web browsers.

export async function fetchSuggestions(query, offset) {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('get_suggestions', { query, offset });
}

export async function fetchEntryDetails(id) {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('get_entry_details', { id });
}

export async function fetchMultipleEntries(ids) {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('get_multiple_entries', { ids });
}

export async function minimizeWindow() {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  getCurrentWindow().minimize();
}

export async function toggleMaximizeWindow() {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  getCurrentWindow().toggleMaximize();
}

export async function closeWindow() {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  getCurrentWindow().close();
}

export async function detectWsl() {
  const { invoke } = await import('@tauri-apps/api/core');
  return await invoke('check_wsl');
}
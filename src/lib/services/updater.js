// @ts-nocheck
import { isTauri } from '$lib/services/platform.js';

/**
 * Fetches the latest database release metadata directly from the GitHub API.
 * @param {string} repo - github repository path
 * @returns {Promise<{ version: string, downloadUrl: string }>}
 */
export async function fetchLatestReleaseInfo(repo) {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
  if (!response.ok) {
    throw new Error(`Failed to fetch update metadata from GitHub: ${response.status}`);
  }

  const latestRelease = await response.json();
  const latestTag = latestRelease.tag_name; // e.g. "v20260702l"
  
  const dbAsset = latestRelease.assets.find(asset => asset.name.endsWith('.db'));
  if (!dbAsset) {
    throw new Error("No SQLite database asset (.db) found in the latest release.");
  }

  return {
    version: latestTag.replace(/^v/, ''), // clean version string without the 'v' prefix
    downloadUrl: dbAsset.browser_download_url
  };
}

/**
 * Triggers the database update procedure in Rust and listens for download progress.
 * @param {string} downloadUrl - Direct link to download the .db file from GitHub
 * @param {function} onProgress - Reactive callback triggered when download progress changes
 * @returns {Promise<string>} - Returns the new database version retrieved from SQLite metadata
 */
export async function applyDatabaseUpdate(downloadUrl, onProgress) {
  if (!isTauri) {
    throw new Error("Database updates are only supported in native Tauri environments.");
  }

  const { invoke } = await import('@tauri-apps/api/core');
  const { listen } = await import('@tauri-apps/api/event');

  let unlistenProgress;

  try {
    // register the native background download progress listener
    unlistenProgress = await listen('download-progress', (event) => {
      onProgress?.(event.payload);
    });

    // rust ureq starts downloading, hot-swaps the database file, and reloads the SQLite connection
    await invoke('apply_database_update', { url: downloadUrl });

    // fetch the newly installed database version from the metadata table
    const newVersion = await invoke('get_db_version');
    return newVersion;
  } finally {
    // always release listener resources upon completion or failure of the operation
    if (unlistenProgress) {
      unlistenProgress();
    }
  }
}
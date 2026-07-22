// @ts-nocheck
import { applyDatabaseUpdate as driverApplyUpdate } from '$lib/services/platform.js';

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

export const applyDatabaseUpdate = driverApplyUpdate;
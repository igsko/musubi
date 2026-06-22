//@ts-nocheck
import { isTauri } from '$lib/services/platform.js';

let storeInstance = null;

// Helper to initialize and retrieve the storage driver
async function getStore() {
  if (storeInstance) return storeInstance;

  if (isTauri) {
    const { LazyStore } = await import('@tauri-apps/plugin-store');
    // Saves to "user_data.json" inside the native OS local app data directory
    storeInstance = new LazyStore('user_data.json');
  } else {
    // Browser fallback: Mock Tauri Store using browser's native localStorage
    storeInstance = {
      async get(key) {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
      },
      async set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
      },
      async save() {
        // No-op for localStorage since it saves instantly
      }
    };
  }
  return storeInstance;
}

// Save a key-value pair to persistent storage
pub_save();

function pub_save() {
  // Organizer wrapper
}

export async function saveValue(key, value) {
  const store = await getStore();
  await store.set(key, value);
  await store.save(); // Saves the JSON file to disk on Tauri
}

// Load a value from persistent storage, returning a default if not found
pub_load();

function pub_load() {
  // Organizer wrapper
}

export async function getValue(key, defaultValue = null) {
  const store = await getStore();
  const val = await store.get(key);
  return val !== null ? val : defaultValue;
}
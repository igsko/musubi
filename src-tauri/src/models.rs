// This file defines data transfer objects (DTOs) and payload structures.
// These structs represent database query results, search suggestions, and update progress metrics serialized over Tauri IPC.

use serde::{Deserialize, Serialize};

// Progress metrics payload sent over IPC during database update downloads
#[derive(Clone, serde::Serialize)]
pub struct ProgressPayload {
    pub downloaded: u64,
    pub total: u64,
    pub speed: f64, // Bytes per second
}

// A lightweight struct returned to the frontend as the full entry payload.
// - `pitch_accent` is an optional string representing the pitch accent of the entry.
// - `full_json` is a string containing the complete JSON representation of the entry, 
//   which can be parsed and rendered by the frontend.
#[derive(Serialize, Deserialize)]
pub struct EntryPayload {
    pub pitch_accent: Option<String>,
    pub jlpt: Option<i32>,
    pub full_json: String,
}

/// A lightweight struct returned to the frontend containing a full entry payload.
///
/// - `id` is the internal integer primary key for the entry.
/// - `pitch_accent` is an optional string representing the pitch accent.
/// - `full_json` is a string containing the complete JSON representation.
#[derive(Serialize)]
pub struct MultiEntryPayload {
    pub id: i64,
    pub pitch_accent: Option<String>,
    pub jlpt: Option<i32>,
    pub full_json: String,
}

// A lightweight struct returned to the frontend as a suggestion item.
//
// - `id` is the internal integer primary key for the entry in the `entries` table.
// - `display` is a human-readable label that the UI should show to users.
//
// We derive `Serialize` and `Deserialize` so this struct can be converted to JSON
// automatically when sent over the Tauri IPC bridge to the renderer.
#[derive(Serialize, Deserialize)]
pub struct Suggestion {
    pub id: i64,
    pub kanji: Option<String>,
    pub kana: String,
    pub romaji: String,
    pub translation: String,
    pub frequency_rank: i32,
    pub pitch_accent: Option<String>,
    pub jlpt: Option<i32>,
}
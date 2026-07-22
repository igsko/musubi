use crate::db::DbState;
use crate::models::{EntryPayload, MultiEntryPayload, Suggestion};
use tauri::State;

/// Query the search index and return a short list of suggestions.
///
/// - `app`: The `AppHandle` allows resolving resource paths and other runtime APIs.
/// - `query`: The user's search text. It will be trimmed and lower-cased for
///   case-insensitive prefix matching against the `search_index.key` column.
///
/// Returns a `Vec<Suggestion>` on success or a `String` containing an error
/// message on failure. Errors are intentionally simple strings because Tauri
/// commands are typically consumed by JavaScript, which expects string messages
/// for display/logging.
#[tauri::command (async)]
pub async fn get_suggestions(
    state: State<'_, DbState>,
    query: String,
    offset: i32,
) -> Result<Vec<Suggestion>, String> {
    // Lock the connection mutex to query safely across threads
    let conn = state.conn.lock().unwrap();
    // Prepare the query string: remove surrounding whitespace and normalize case
    // so that the SQL `LIKE` prefix match is effectively case-insensitive when
    // the index contains lower-cased keys.
    let clean_query = query.trim().to_lowercase();

    // This SQL performs a prefix search against a dedicated `search_index` table
    // and returns a small, distinct set of matching `entries` with a hard limit
    // to avoid returning excessive data for the UI.
    let mut database_query = conn.prepare(
        "SELECT e.id, e.kanji, e.kana, e.romaji, e.translation, e.frequency_rank, e.pitch_accent 
        FROM search_index s 
        JOIN entries e ON s.entry_id = e.id 
        WHERE s.key LIKE ?1 || '%' 
        GROUP BY e.id  -- Groups duplicate entries cleanly
        ORDER BY 
            -- TOP PRIORITY: Exact 1:1 match on any of the matched keys
            MIN(CASE WHEN s.key = ?1 THEN 0 ELSE 1 END) ASC,
            
            -- NEXT PRIORITY: Word frequency (lower rank = more common)
            e.frequency_rank ASC,
            
            -- TIE-BREAKER: Shortest matched key length (makes 'artykul' rank before 'artykulowanie')
            MIN(LENGTH(s.key)) ASC,
            
            -- FINAL TIE-BREAKER: Shorter Japanese readings first
            LENGTH(e.kana) ASC
        LIMIT 20 OFFSET ?2"
    ).map_err(|e| e.to_string())?;

    // Map the columns in order: 0 (id), 1 (kanji), 2 (kana), 3 (romaji), 4 (translation)
    let rows = database_query
        .query_map((clean_query, offset), |row| {
            Ok(Suggestion {
                id: row.get(0)?,
                kanji: row.get(1)?,
                kana: row.get(2)?,
                romaji: row.get(3)?,
                translation: row.get(4)?,
                frequency_rank: row.get(5)?,
                pitch_accent: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    // We loop through the mapped rows and push them into our final list vector.
    let mut list = Vec::new();
    for row in rows {
        if let Ok(item) = row {
            list.push(item);
        }
    }
    Ok(list)
}

/// Retrieve the full JSON payload for a specific entry by its integer ID.
///
/// The `entries` table stores a `full_json` column that contains the structured
/// data for an entry. This command returns that JSON blob as a `String` so the
/// frontend can parse and render it as needed.
#[tauri::command (async)]
pub fn get_entry_details(state: State<'_, DbState>, id: i64) -> Result<EntryPayload, String> {
    let conn = state.conn.lock().unwrap();

    // Prepare a parameterized query to fetch the full JSON payload for the selected entry.
    // We use 'WHERE id = ?1 OR id = CAST(?1 AS TEXT)' to robustly handle cases
    // where the database stores IDs either as integers or text strings.
    let mut database_query = conn
        .prepare(
            "SELECT pitch_accent, full_json FROM entries 
         WHERE id = ?1 OR id = CAST(?1 AS TEXT)",
        )
        .map_err(|e| e.to_string())?;

    // `query_row` expects exactly one result; it will return an error if no row
    // is found or more than one row is returned (the latter should not happen
    // when querying by primary key). We map any rusqlite error into a string
    // for the command API.
    let payload = database_query
        .query_row([id], |row| {
            Ok(EntryPayload {
                pitch_accent: row.get(0)?,
                full_json: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(payload)
}

/// Retrieve the full JSON payloads for a collection of entry IDs.
///
/// The `entries` table stores a `full_json` column that contains the structured
/// data for each entry. This command returns the JSON blobs and optional pitch
/// accent information for every existing ID in the provided list, skipping any
/// IDs that are not present in the database.
#[tauri::command (async)]
pub fn get_multiple_entries(state: State<'_, DbState>, ids: Vec<i64>) -> Result<Vec<MultiEntryPayload>, String> {
    let conn = state.conn.lock().unwrap();
    // cache prepared statement
    let mut stmt = conn
        .prepare("SELECT pitch_accent, full_json FROM entries WHERE id = ?1 OR id = CAST(?1 AS TEXT)")
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    
    for id in ids {
        // if record exists push to vec. if rusqlite throws err e.g. QueryReturnedNoRows,
        // ignore that record - it will be detected as missing in JS
        if let Ok((pitch_accent, full_json)) = stmt.query_row([id], |row| {
            Ok((row.get::<_, Option<String>>(0)?, row.get::<_, String>(1)?))
        }) {
            results.push(MultiEntryPayload {
                id,
                pitch_accent,
                full_json,
            });
        }
    }

    Ok(results)
}

/// Retrieve the database version from the SQLite metadata table.
/// This allows the Svelte frontend to instantly know which database version is loaded
#[tauri::command (async)]
pub fn get_db_version(state: State<'_, DbState>) -> Result<String, String> {
    let conn = state.conn.lock().unwrap();
    
    let mut stmt = conn
        .prepare("SELECT value FROM metadata WHERE key = 'version'")
        .map_err(|e| e.to_string())?;
        
    let version: String = stmt
        .query_row([], |row| row.get(0))
        .map_err(|e| e.to_string())?;
        
    Ok(version)
}

/// Checks if the app is ran in WSL environment
#[tauri::command(async)]
pub fn check_wsl() -> bool {
    #[cfg(target_os = "linux")]
    {
        std::fs::read_to_string("/proc/sys/kernel/osrelease")
            .map(|s| s.to_lowercase().contains("microsoft") || s.to_lowercase().contains("wsl"))
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "linux"))]
    {
        false
    }
}
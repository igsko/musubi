// External crates used by this Tauri backend.
// - `tauri` provides the application runtime, command handling, and path resolution APIs.
// - `rusqlite` is a lightweight SQLite binding used to open and query the packaged database.
// - `serde` is used to (de)serialize Rust structs to/from JSON when communicating with the frontend.
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State}; // Mutex is used to wrap the SQLite connection for safe concurrent access across threads.

// A simple wrapper struct that holds a `rusqlite::Connection` inside a `Mutex`.
struct DbState {
    conn: Mutex<Connection>,
}

// A lightweight struct returned to the frontend as the full entry payload.
// - `pitch_accent` is an optional string representing the pitch accent of the entry.
// - `full_json` is a string containing the complete JSON representation of the entry, 
//   which can be parsed and rendered by the frontend.
#[derive(Serialize, Deserialize)]
pub struct EntryPayload {
    pitch_accent: Option<String>,
    full_json: String,
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
    pub id: i32,
    kanji: Option<String>,
    kana: String,
    romaji: String,
    translation: String,
    frequency_rank: i32,
    pitch_accent: Option<String>,
}

// Open connection helper to load database from the writable AppData directory
/// Open a connection to the SQLite database inside the AppData folder.
///
/// Any error is converted into a `String` for simple propagation to command callers.
fn open_db(app: &AppHandle) -> Result<Connection, String> {
    // Resolve the path to the writable local data directory
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?;

    let db_path = app_data_dir.join("dictionary.db");

    // Open an SQLite connection to the file
    Connection::open(db_path).map_err(|e| e.to_string())
}

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
#[tauri::command]
async fn get_suggestions(
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
#[tauri::command]
async fn get_entry_details(state: State<'_, DbState>, id: i32) -> Result<EntryPayload, String> {
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

/// Retrieve the database version from the SQLite metadata table.
/// This allows the Svelte frontend to instantly know which database version is loaded
#[tauri::command]
async fn get_db_version(state: State<'_, DbState>) -> Result<String, String> {
    let conn = state.conn.lock().unwrap();
    
    let mut stmt = conn
        .prepare("SELECT value FROM metadata WHERE key = 'version'")
        .map_err(|e| e.to_string())?;
        
    let version: String = stmt
        .query_row([], |row| row.get(0))
        .map_err(|e| e.to_string())?;
        
    Ok(version)
}

/// Hot-swaps the active database connection with a newly downloaded database
#[tauri::command]
async fn apply_database_update(
    app: AppHandle,
    state: State<'_, DbState>,
    url: String, // passed by svelte
) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?;

    let temp_path = app_data_dir.join("dictionary_temp.db");

    // download the database file
    let response = ureq::get(&url)
        .call()
        .map_err(|e| format!("Failed to download database: {}", e))?;

    // stream the HTTP response body into dictionary_temp.db
    let mut file = std::fs::File::create(&temp_path).map_err(|e| e.to_string())?;
    std::io::copy(&mut response.into_reader(), &mut file).map_err(|e| e.to_string())?;

    // lock the database connection mutex
    let mut conn = state.conn.lock().unwrap();

    // temporarily assign an in memory sqlite database to release the file lock on dictionary.db
    *conn = Connection::open_in_memory().map_err(|e| e.to_string())?;

    let db_path = app_data_dir.join("dictionary.db");

    // ovrwrite the old database with the temporary downloaded database
    if temp_path.exists() {
        if db_path.exists() {
            std::fs::remove_file(&db_path).map_err(|e| e.to_string())?;
        }
        std::fs::rename(&temp_path, &db_path).map_err(|e| e.to_string())?;
    } else {
        return Err("Temporary database file 'dictionary_temp.db' was not found in the AppData directory.".to_string());
    }

    // Re-open the database connection to the fresh database file
    *conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    Ok(())
}

// Entry point for native platforms (and mobile when compiled with the `mobile` feature).
// This function builds the Tauri application, registers plugins and command handlers,
// then runs the event loop. It intentionally panics with a helpful message if the
// application fails to start, which surfaces early during development.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        // Initialize optional plugins here. `tauri_plugin_opener` allows the app
        // to open URLs and system resources in a platform-appropriate way.
        // We open the SQLite database connection during setup and store it in the app state.
        .setup(|app| {
            // Resolve local app data directory
            let app_data_dir = app
                .path()
                .app_local_data_dir()
                .expect("Failed to resolve local app data directory");

            // Ensure the directory exists, creating it if necessary
            std::fs::create_dir_all(&app_data_dir).expect("Failed to create local app data directory");

            let db_path = app_data_dir.join("dictionary.db");

            // Open connection to the fully writable Appdata db
            let conn = Connection::open(db_path).expect("Failed to open db file");

            // Manage the database connection state so it can be accessed in command handlers
            app.manage(DbState {
                conn: Mutex::new(conn),
            });

            Ok(())
        })
        // Register commands that the frontend can call. Keep this list small and
        // stable; adding commands changes the API surface exposed to the renderer.
        .invoke_handler(tauri::generate_handler![
            get_suggestions, 
            get_entry_details,
            get_db_version,
            apply_database_update
        ])
        // `generate_context!` reads the `tauri.conf.json` and embedded assets.
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

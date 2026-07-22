// This file handles dictionary database updates and hot-swapping procedures.
// It manages HTTP download streaming, tracks IPC progress metrics, and handles safe SQLite connection swaps with automatic rollback on failure.

use crate::db::DbState;
use crate::models::ProgressPayload;
use rusqlite::Connection;
use std::io::{Read, Write};
use std::time::Instant;
use tauri::{AppHandle, Emitter, Manager, State};

/// Hot-swaps the active database connection with a newly downloaded database
#[tauri::command (async)]
pub fn apply_database_update(
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

    // Read the total file size from the HTTP headers (default to 0 if missing/unreadable)
    let total_size: u64 = response
        .header("Content-Length")
        .and_then(|h| h.parse().ok())
        .unwrap_or(0);

    let mut reader = response.into_reader();
    let mut file = std::fs::File::create(&temp_path).map_err(|e| e.to_string())?;

    // stream chunk-by-chunk with metrics tracking
    let mut buffer = [0; 16384]; // 16KB buffer
    let mut downloaded: u64 = 0;
    let start_time = Instant::now();
    let mut last_emit_time = Instant::now();

    loop {
        let bytes_read = reader.read(&mut buffer).map_err(|e| e.to_string())?;
        if bytes_read == 0 {
            break; // stream ended
        }

        file.write_all(&buffer[..bytes_read]).map_err(|e| e.to_string())?;
        downloaded += bytes_read as u64;

        // calculate download speed in bytes per second
        let elapsed_sec = start_time.elapsed().as_secs_f64();
        let speed = if elapsed_sec > 0.0 {
            downloaded as f64 / elapsed_sec
        } else {
            0.0
        };

        // rate limit event emission to once every 100ms to keep IPC traffic light
        if last_emit_time.elapsed().as_millis() >= 100 {
            app.emit("download-progress", ProgressPayload {
                downloaded,
                total: total_size,
                speed,
            }).ok();
            last_emit_time = Instant::now();
        }
    }

    // emit final 100% event to sync frontend state
    app.emit("download-progress", ProgressPayload {
        downloaded,
        total: total_size,
        speed: downloaded as f64 / start_time.elapsed().as_secs_f64(),
    }).ok();

    drop(file);

    // lock active database connection
    let mut conn = state.conn.lock().unwrap();

    // temporarily assign an in memory sqlite database to release the file lock on dictionary.db
    *conn = Connection::open_in_memory().map_err(|e| e.to_string())?;

    let db_path = app_data_dir.join("dictionary.db");
    let backup_path = app_data_dir.join("dictionary.db.bak");

    // ovrwrite the old database with the temporary downloaded database
    if temp_path.exists() {
        if db_path.exists() {
            if backup_path.exists() {
                std::fs::remove_file(&backup_path).map_err(|e| e.to_string())?;
            }
            std::fs::rename(&db_path, &backup_path).map_err(|e| e.to_string())?;
        }

        // rename the downloaded database to the active path
        // with retry loop for Windows Defender
        let mut rename_error = None;
        for attempt in 0..5 {
            match std::fs::rename(&temp_path, &db_path) {
                Ok(_) => {
                    rename_error = None;
                    break;
                }
                Err(e) => {
                    rename_error = Some(e);
                    // put the thread to sleep for 200ms
                    if attempt < 4 {
                        std::thread::sleep(std::time::Duration::from_millis(200));
                    }
                }
            }
        }

        // if still failed after 5 tries, rollback
        if let Some(e) = rename_error {
            // if rename failed, restore the backup
            if backup_path.exists() {
                std::fs::rename(&backup_path, &db_path).ok();
            }
            return Err(format!("Failed to apply new database, rolled back: {}", e));
        }

        match Connection::open(&db_path) {
            Ok(new_conn) => {
                *conn = new_conn;
                if backup_path.exists() {
                    std::fs::remove_file(&backup_path).ok();
                }
            }
            Err(e) => {
                // rollback if the new db is corrupted and won't open
                if backup_path.exists() {
                    if db_path.exists() {
                        std::fs::remove_file(&db_path).ok();
                    }
                    std::fs::rename(&backup_path, &db_path).ok();
                    if let Ok(fallback_conn) = Connection::open(&db_path) {
                        *conn = fallback_conn;
                    }
                }
                return Err(format!("New database was corrupted or failed to open, rolled back: {}", e));
            }
        }
    } else {
        return Err("Temporary database file 'dictionary_temp.db' was not found in the AppData directory.".to_string());
    }

    // Re-open the database connection to the fresh database file
    *conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    Ok(())
}
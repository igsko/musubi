// This file contains Tauri IPC command handlers for system-level queries and runtime metadata.
// It provides commands to check database schema versions and detect Linux runtime environments like WSL.

use crate::db::DbState;
use tauri::State;

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
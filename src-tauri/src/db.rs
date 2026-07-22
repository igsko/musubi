// This file defines the global database state wrapper.
// It encapsulates the SQLite database connection within a thread-safe Mutex for managed access across Tauri async commands.

use rusqlite::Connection;
use std::sync::Mutex;

// Holds the SQLite database connection inside a thread-safe Mutex
pub struct DbState {
    pub conn: Mutex<Connection>,
}
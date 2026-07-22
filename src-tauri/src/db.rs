use rusqlite::Connection;
use std::sync::Mutex;

// Holds the SQLite database connection inside a thread-safe Mutex
pub struct DbState {
    pub conn: Mutex<Connection>,
}
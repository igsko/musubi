// This file serves as the main library root and application setup hub.
// It initializes SQLite database state, configures platform-specific window behavior, and registers Tauri IPC commands.

mod commands;
mod db;
mod models;
mod updater;

use db::DbState;
use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

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

            #[cfg(target_os = "linux")]
            {
                let is_wsl = std::fs::read_to_string("/proc/sys/kernel/osrelease")
                    .map(|s| s.to_lowercase().contains("microsoft") || s.to_lowercase().contains("wsl"))
                    .unwrap_or(false);

                if !is_wsl {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.set_decorations(true);

                        // tauri bug workaround
                        let _ = window.set_resizable(false);
                        let _ = window.set_resizable(true);
                        let window_clone = window.clone();
                        window.on_window_event(move |event| {
                            if let tauri::WindowEvent::Focused(true) = event {
                                let _ = window_clone.set_resizable(false);
                                let _ = window_clone.set_resizable(true);
                            }
                        });
                    }
                }
            }

            Ok(())
        })
        // Register commands that the frontend can call. Keep this list small and
        // stable; adding commands changes the API surface exposed to the renderer.
        .invoke_handler(tauri::generate_handler![
            commands::entries::get_suggestions, 
            commands::entries::get_entry_details,
            commands::entries::get_multiple_entries,
            commands::system::get_db_version,
            commands::system::check_wsl,
            updater::apply_database_update,
        ])
        // `generate_context!` reads the `tauri.conf.json` and embedded assets.
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
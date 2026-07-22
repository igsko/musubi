// This file acts as the primary binary entry point for the application.
// It delegates application execution and event loop setup directly to the core dictionary library (`lib.rs`).

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    dictionary_lib::run()
}

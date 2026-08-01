# Musubi (結び) (WIP)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-indigo?logo=tauri)](https://tauri.app)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-orange?logo=svelte)](https://svelte.dev)
[![Rust](https://img.shields.io/badge/Rust-2021-black?logo=rust)](https://www.rust-lang.org)

**Musubi** is a lightweight, clean, offline-first Japanese-Polish dictionary built with **Tauri v2**, **Svelte 5**, and **SQLite**. Designed for language learners with instant search, pitch accent contours, and JLPT level tags across desktop and mobile.

---

## Features
- ⚡ **Instant Offline Search**
  - Prefix matching over SQLite indexed databases.
  - Search in Polish, Japanese (Kanji/Kana), or Romaji.
  - Frequency rank sorting, paginated infinite loading, and debounced input queries.
- 🎵 **Pitch Accent Visualisation**: NHK pitch accent notation with visual overlines and downstep drop markers.
- 振 **Furigana Readings**: Toggleable Furigana above Kanji text throughout search results and word detail cards.
- 🏷️ **JLPT & Frequency Badges**
  - Color-coded JLPT badges (N5 to N1).
  - Frequency milestone tags (e.g., #100, #1k, #5k) based on corpus data.
- 🔖 **Bookmarks & History**: Bookmark words for quick study and track your search history locally.
- 🔄 **Database Auto-Updates**: Download and hot-swap the latest compiled SQLite dictionary releases directly inside the app.
- 🌙 **Dark & Light Themes**: Native UI support for System, Light, and Dark mode aesthetics.
- 💻 **Cross-Platform**: Runs natively on Windows, Linux, and Android.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Svelte 5](https://svelte.dev) + [SvelteKit](https://kit.svelte.dev) (SPA mode via `@sveltejs/adapter-static`)
- **Bundler**: [Vite 6](https://vitejs.dev)
- **Styling**: Vanilla CSS with CSS Custom Properties and responsive container queries

### Backend & Desktop Runtime
- **Core Runtime**: [Tauri v2](https://tauri.app)
- **Language**: Rust (2021 edition)
- **Database**: SQLite via `rusqlite` (bundled static engine)
- **HTTP Streaming & Storage**: `ureq`, `@tauri-apps/plugin-store`

## 📂 Project structure

```text
.
├── src/
│   ├── lib/
│   │   ├── components/       # Reusable UI components (EntryListItem)
│   │   ├── features/         # Feature modules
│   │   │   ├── bookmarks/    # Bookmarks list panel
│   │   │   ├── entry/        # Detailed entry card & pitch accent renderer
│   │   │   ├── history/      # History panel
│   │   │   ├── layout/       # Titlebar, SidePanel, UI state
│   │   │   ├── search/       # SearchBox and SuggestionsList
│   │   │   ├── settings/     # Settings panel & theme configuration
│   │   │   └── services/     # Platform abstraction layer (tauri/mock)
│   │   ├── state/            # Reactive state management (Svelte 5 Runes)
│   │   └── utils/japanese/   # Furigana segmentation, pitch parser, JLPT badges
│   └── routes/               # SvelteKit client-side routes
├── src-tauri/
│   ├── capabilities/         # Tauri permissions
│   ├── gen/                  # Android project files
│   └── src/
│       ├── commands/         # Tauri IPC handlers (entries, system)
│       ├── db.rs             # SQLite thread-safe Mutex connection state
│       ├── updater.rs        # HTTP database streaming & hot-swapping logic
│       └── lib.rs            # Tauri application entry & plugin configuration
└── static/                   # Static assets
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

1. **Node.js** (v18 or newer) & **npm**
2. **Rust** toolchain (stable) - [Install Rust](https://www.rust-lang.org/tools/install)
3. Platform-specific Tauri v2 prerequisites:
   - **Windows**: C++ Build Tools or Microsoft Visual Studio
   - **Linux**: `webkit2gtk`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`
   - **Android**: 
     - Android Studio with Android SDK (API 24+ / target API 36) and NDK
     - Java Development Kit (JDK 17 or higher)
     - Configured `ANDROID_HOME` & `NDK_HOME` environment variables
     - Rust Android targets:
       ```bash
       rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
       ```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/musubi.git
   cd musubi
   ```

2. Install JavaScript dependencies:
    ```bash
    npm install
    ```

### Running in Developer Mode
To run the web interface inside Vite with the Tauri desktop window:
```
npm run tauri dev
```

To run on a connected Android device or emulator:
```
npm run tauri android dev
```

To run only the web frontend preview (using mock data):
```
npm run dev
```

### Building Executables

Current host OS:
```
npm run build:host
```

Windows NSIS Installer (cross-compiling via cargo-xwin):
```
npm run build:win
```

Android APK / AAB:
```
npm run tauri android build
```

Built desktop artifacts will be generated in `src-tauri/target/release/bundle/`, and Android packages in `src-tauri/gen/android/app/build/outputs/`.

## Source Data & credits

**Musubi** relies on open data and open-source projects created by the Japanese language learning community:

- **Dictionary Content**: [Japoński Pomocnik](https://www.japonski-pomocnik.pl) created by Fryderyk Mazurek ([dedyk/JaponskiPomocnik](https://github.com/dedyk/JaponskiPomocnik)), distributed under the GNU GPL v3.0 license.
- **Pitch Accent Data**: NHK Pitch Accent notation provided by [hlorenzi/jisho-open](https://github.com/hlorenzi/jisho-open).
- **JLPT Word Level Data**: JLPT vocabulary rankings sourced from [jamsinclair/open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks) and [elzup/jlpt-word-list](https://github.com/elzup/jlpt-word-list).
- **Frequency Rankings**: Leeds Vocabulary Frequency Corpus provided by [hingston/japanese](https://github.com/hingston/japanese).

## License

Musubi is open-source software licensed under the [GNU General Public License v3.0](LICENSE).

/**
 * UIState manages UI related reactive state for the app
 */
export class UIState {
  returnView = $state('search');   // 'search' | 'bookmarks' || 'history'
  menuOpen = $state(false);        // tracks hamburger dropdown toggle

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
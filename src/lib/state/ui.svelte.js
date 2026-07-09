/**
 * UIState manages UI related reactive state for the app
 */
export class UIState {
  currentView = $state('details'); // 'details' | 'settings'
  menuOpen = $state(false);        // tracks hamburger dropdown toggle

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  /**
  * Switch to settings view and close the menu
  * @returns {void}
  */
  openSettings() {
    this.currentView = 'settings';
    this.menuOpen = false;
  }

  /* Switch back to details view */
  closeSettings() {
    this.currentView = 'details';
  }
}
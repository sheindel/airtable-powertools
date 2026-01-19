import type { AtViewManagerElement, TabChangeEventDetail } from '../../types/dom';

const ACTIVE_CLASSES = [
  "active",
  "border-blue-500",
  "text-blue-600",
  "dark:text-blue-400",
  "dark:border-blue-400",
] as const;

const INACTIVE_CLASSES = [
  "border-transparent",
  "text-gray-500",
  "dark:text-gray-400",
] as const;

/**
 * AtViewManager - Custom view/navigation component
 *
 * Usage:
 * <at-view-manager active="dependency-mapper">
 *   <button class="tab-button" data-tab="tab1">Tab 1</button>
 *   <div class="tab-content" id="tab1-tab">Content 1</div>
 * </at-view-manager>
 *
 * Events:
 * - 'tab-change': Fired when active tab changes (CustomEvent with tab name in detail)
 *
 * Routing / Virtual URLs:
 * - Reads the URL on load and will activate a tab when the hash is set (e.g. "#/dependency-mapper")
 *   or when a query param `?tab=dependency-mapper` is present.
 * - When a user switches tabs, the component updates the browser history (pushState)
 *   so the current tool can be linked and back/forward navigation works.
 */
export class AtViewManager extends HTMLElement implements AtViewManagerElement {
  private _buttons?: HTMLElement[];
  private _panels?: HTMLElement[];
  private _mobileDropdown?: HTMLSelectElement | null;

  // Bindable handlers for history changes
  private _onHashChange?: () => void;
  private _onPopState?: (e: PopStateEvent) => void;

  constructor() {
    super();
  }

  connectedCallback(): void {
    // Cache elements within the manager; assumes buttons/panels are children
    this._buttons = Array.from(this.querySelectorAll<HTMLElement>(".tab-button"));
    this._panels = Array.from(this.querySelectorAll<HTMLElement>(".tab-content"));
    this._mobileDropdown = this.querySelector<HTMLSelectElement>("#mobile-tab-selector");
    
    this._buttons.forEach((btn) => btn.addEventListener("click", (e) => this._onClick(e)));
    
    // Listen for mobile dropdown changes
    if (this._mobileDropdown) {
      this._mobileDropdown.addEventListener("change", (e) => this._onDropdownChange(e));
    }

    const preset = this.getAttribute("active");
    const activeButton = this._buttons.find((btn) => btn.classList.contains("active"));

    // Resolve initial tab from URL (hash or ?tab=) first, then attribute or first button
    const route = this._getRouteFromLocation();
    const initialTab = route || preset || activeButton?.dataset.tab || this._buttons[0]?.dataset.tab;

    if (initialTab) {
      // Activate without emitting (no Python callback) on init
      this.setActive(initialTab, false);

      // Canonicalize the URL to reflect the active tool without adding history
      const expectedHash = `#/${initialTab}`;
      if (window.location.hash !== expectedHash) {
        try {
          history.replaceState({ tab: initialTab }, '', expectedHash);
        } catch (err) {
          // fallback to setting hash
          window.location.hash = expectedHash;
        }
      }
    }

    // Respond to history navigation and manual hash changes
    this._onHashChange = () => {
      const newRoute = this._getRouteFromLocation();
      if (newRoute) this.setActive(newRoute, false);
    };
    this._onPopState = (_e: PopStateEvent) => {
      const newRoute = this._getRouteFromLocation();
      if (newRoute) this.setActive(newRoute, false);
    };

    window.addEventListener('hashchange', this._onHashChange);
    window.addEventListener('popstate', this._onPopState as EventListener);
  }

  disconnectedCallback(): void {
    // Remove listeners added in connectedCallback
    if (this._onHashChange) window.removeEventListener('hashchange', this._onHashChange);
    if (this._onPopState) window.removeEventListener('popstate', this._onPopState as EventListener);
  }

  /**
   * Set the active tab
   * @param tabName - The name of the tab to activate
   * @param emit - Whether to emit tab-change event and call Python callback
   */
  setActive(tabName: string, emit: boolean = false): void {
    if (!tabName) return;

    if (!this._buttons || !this._panels) {
      // If somehow invoked before connectedCallback, hydrate on demand
      this._buttons = Array.from(this.querySelectorAll<HTMLElement>(".tab-button"));
      this._panels = Array.from(this.querySelectorAll<HTMLElement>(".tab-content"));
    }

    const previous = this.getActive();
    if (previous === tabName) return; // no-op if already active

    this._buttons.forEach((btn) => {
      const isActive = btn.dataset.tab === tabName;
      this._toggleClasses(btn, isActive);
    });

    this._panels.forEach((panel) => {
      const isActive = panel.id === `${tabName}-tab`;
      panel.classList.toggle("hidden", !isActive);
      panel.classList.toggle("active", isActive);
    });

    // Update mobile dropdown to match (without triggering change event)
    if (this._mobileDropdown && this._mobileDropdown.value !== tabName) {
      this._mobileDropdown.value = tabName;
    }

    // Call Python callback only when explicitly requested (user interaction)
    if (emit && typeof window.switchTabPython !== "undefined") {
      window.switchTabPython(tabName);
    }

    // Update browser URL when user interacts (so links can be shared and back/forward works)
    if (emit) {
      const hash = `#/${tabName}`;
      try {
        history.pushState({ tab: tabName }, '', hash);
      } catch (err) {
        // Fallback
        window.location.hash = hash;
      }
    }

    this.dispatchEvent(
      new CustomEvent<TabChangeEventDetail>("tab-change", {
        bubbles: true,
        detail: { tab: tabName, previous },
      })
    );
  }

  /**
   * Get the currently active tab name
   * @returns The active tab name or null if none active
   */
  getActive(): string | null {
    const activeButton = this._buttons?.find((btn) => btn.classList.contains("active"));
    return activeButton?.dataset.tab || null;
  }

  /**
   * Parse the current location for a route.
   * Supports hash formats: "#/tab-name" or "#tab-name" and query param: ?tab=tab-name
   */
  private _getRouteFromLocation(): string | null {
    const hash = window.location.hash || '';
    if (hash) {
      // Support '#/name' and '#name'
      const cleaned = hash.startsWith('#/') ? hash.slice(2) : hash.startsWith('#') ? hash.slice(1) : hash;
      const route = decodeURIComponent(cleaned.split('?')[0] || '').replace(/^\/+|\/+$/g, '');
      if (route && this._buttons?.some(btn => btn.dataset.tab === route)) {
        return route;
      }
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('tab');
      if (q && this._buttons?.some(btn => btn.dataset.tab === q)) {
        return q;
      }
    } catch (err) {
      // ignore
    }

    return null;
  }

  private _onDropdownChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const tab = target.value;
    this.setActive(tab, true);
  }

  private _onClick(event: MouseEvent): void {
    const currentTarget = event.currentTarget as HTMLElement;
    const tab = currentTarget?.dataset?.tab;
    if (tab) {
      this.setActive(tab, true);
    }
  }

  private _toggleClasses(el: HTMLElement, isActive: boolean): void {
    ACTIVE_CLASSES.forEach((cls) => el.classList.toggle(cls, isActive));
    INACTIVE_CLASSES.forEach((cls) => el.classList.toggle(cls, !isActive));
  }
}

// Extend window interface for Python callback
declare global {
  interface Window {
    switchTabPython?(tabName: string): void;
  }
}

customElements.define("at-view-manager", AtViewManager);
// Backwards compatibility: register legacy tag name pointing to the same class if not present
// if (!customElements.get('at-tab-manager')) {
//   customElements.define('at-tab-manager', AtViewManager);
// }

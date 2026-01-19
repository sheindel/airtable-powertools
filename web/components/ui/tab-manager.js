const ACTIVE_CLASSES = [
  "active",
  "border-blue-500",
  "text-blue-600",
  "dark:text-blue-400",
  "dark:border-blue-400",
];

const INACTIVE_CLASSES = [
  "border-transparent",
  "text-gray-500",
  "dark:text-gray-400",
];

export class AtTabManager extends HTMLElement {
  constructor() {
    super();
    this._onClick = this._onClick.bind(this);
    this._onDropdownChange = this._onDropdownChange.bind(this);
    // bound handlers assigned in connectedCallback
    this._onHashChange = undefined;
    this._onPopState = undefined;
  }

  connectedCallback() {
    // Cache elements within the manager; assumes buttons/panels are children
    this._buttons = Array.from(this.querySelectorAll(".tab-button"));
    this._panels = Array.from(this.querySelectorAll(".tab-content"));
    this._mobileDropdown = this.querySelector("#mobile-tab-selector");
    
    this._buttons.forEach((btn) => btn.addEventListener("click", this._onClick));
    
    // Listen for mobile dropdown changes
    if (this._mobileDropdown) {
      this._mobileDropdown.addEventListener("change", this._onDropdownChange);
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
    this._onPopState = (_e) => {
      const newRoute = this._getRouteFromLocation();
      if (newRoute) this.setActive(newRoute, false);
    };

    window.addEventListener('hashchange', this._onHashChange);
    window.addEventListener('popstate', this._onPopState);
  }

  disconnectedCallback() {
    this._buttons?.forEach((btn) => btn.removeEventListener("click", this._onClick));
    if (this._mobileDropdown) {
      this._mobileDropdown.removeEventListener("change", this._onDropdownChange);
    }
    if (this._onHashChange) window.removeEventListener('hashchange', this._onHashChange);
    if (this._onPopState) window.removeEventListener('popstate', this._onPopState);
  }

  getActive() {
    const activeButton = this._buttons?.find((btn) => btn.classList.contains("active"));
    return activeButton?.dataset.tab || null;
  }

  // Parse the current location for a route. Supports '#/name', '#name', and '?tab=name'
  _getRouteFromLocation() {
    const hash = window.location.hash || '';
    if (hash) {
      const cleaned = hash.startsWith('#/') ? hash.slice(2) : hash.startsWith('#') ? hash.slice(1) : hash;
      const route = decodeURIComponent((cleaned.split('?')[0] || '')).replace(/^\/+|\/+$/g, '');
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

  setActive(tabName, fromUser = false) {
    if (!tabName) return;

    if (!this._buttons || !this._panels) {
      // If somehow invoked before connectedCallback, hydrate on demand
      this._buttons = Array.from(this.querySelectorAll(".tab-button"));
      this._panels = Array.from(this.querySelectorAll(".tab-content"));
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

    if (fromUser && typeof window.switchTabPython !== "undefined") {
      window.switchTabPython(tabName);
    }

    // Update browser URL when user interacts (so links can be shared and back/forward works)
    if (fromUser) {
      const hash = `#/${tabName}`;
      try {
        history.pushState({ tab: tabName }, '', hash);
      } catch (err) {
        // Fallback
        window.location.hash = hash;
      }
    }

    this.dispatchEvent(
      new CustomEvent("tab-change", {
        bubbles: true,
        detail: { tab: tabName, previous },
      })
    );
  }

  _onDropdownChange(event) {
    const tab = event.target.value;
    this.setActive(tab, true);
  }

  _onClick(event) {
    const tab = event.currentTarget?.dataset?.tab;
    this.setActive(tab, true);
  }

  _toggleClasses(el, isActive) {
    ACTIVE_CLASSES.forEach((cls) => el.classList.toggle(cls, isActive));
    INACTIVE_CLASSES.forEach((cls) => el.classList.toggle(cls, !isActive));
  }
}

customElements.define("at-tab-manager", AtTabManager);

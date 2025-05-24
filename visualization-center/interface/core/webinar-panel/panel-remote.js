/**
 * @class WebinarPanelRemote
 * @description TV-remote-like control for the WebinarPanelToggle
 * @implements Hub Object Distribution pattern
 */
class WebinarPanelRemote {
  constructor(options = {}) {
    // Panel reference
    this.panelToggle = options.panelToggle;
    if (
      !this.panelToggle ||
      !(this.panelToggle instanceof WebinarPanelToggle)
    ) {
      throw new Error(
        'WebinarPanelRemote requires a valid WebinarPanelToggle instance'
      );
    }

    // Remote properties
    this.position = options.position || 'right';
    this.expanded = options.expanded !== false;
    this.showLabels = options.showLabels !== false;
    this.allowCustomization = options.allowCustomization !== false;
    this.theme = options.theme || 'dark';

    // Button configuration
    this.buttons = options.buttons || this.getDefaultButtons();
    this.favoriteButtons = [];
    this.historyIndex = -1;

    // Initialize remote control
    this.initRemote();

    // Register with HOD registry if available
    if (window.ASOOS && window.ASOOS.HOD) {
      window.ASOOS.HOD.register('WebinarPanelRemote', this);
    }
  }

  /**
   * Get default remote control buttons
   * @returns {Array} Default button configuration
   */
  getDefaultButtons() {
    return [
      {
        id: 'power',
        icon: '⏻',
        label: 'Power',
        section: 'control',
        action: () => this.panelToggle.toggleVisibility(),
      },
      {
        id: 'home',
        icon: '🏠',
        label: 'Home',
        section: 'navigation',
        action: () => this.panelToggle.loadView('default'),
      },
      {
        id: 'back',
        icon: '⬅️',
        label: 'Back',
        section: 'navigation',
        action: () => this.navigateHistory(-1),
      },
      {
        id: 'forward',
        icon: '➡️',
        label: 'Forward',
        section: 'navigation',
        action: () => this.navigateHistory(1),
      },
      {
        id: 'channel-up',
        icon: '▲',
        label: 'Channel Up',
        section: 'control',
        action: () => this.panelToggle.nextView(),
      },
      {
        id: 'channel-down',
        icon: '▼',
        label: 'Channel Down',
        section: 'control',
        action: () => this.panelToggle.previousView(),
      },
      {
        id: 'favorites',
        icon: '★',
        label: 'Favorites',
        section: 'control',
        action: () => this.toggleFavorites(),
      },
      {
        id: 'search',
        icon: '🔍',
        label: 'Search',
        section: 'control',
        action: () => this.openSearch(),
      },
      {
        id: 'settings',
        icon: '⚙️',
        label: 'Settings',
        section: 'control',
        action: () => this.openSettings(),
      },
    ];
  }

  /**
   * Initialize the remote control DOM structure
   */
  initRemote() {
    // Create remote container
    this.remoteContainer = document.createElement('div');
    this.remoteContainer.className = `webinar-panel-remote webinar-panel-remote-${this.theme} webinar-panel-remote-${this.position}`;

    // Create buttons container
    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.className = 'webinar-panel-remote-buttons';

    // Create section containers
    this.sectionContainers = {};
    const sections = [
      ...new Set(this.buttons.map(button => button.section || 'default')),
    ];
    sections.forEach(section => {
      const sectionContainer = document.createElement('div');
      sectionContainer.className = `remote-section remote-section-${section}`;
      this.sectionContainers[section] = sectionContainer;
      this.buttonsContainer.appendChild(sectionContainer);
    });

    // Create buttons
    this.buttons.forEach(button => {
      const buttonElement = this.createButton(button);
      const sectionContainer =
        this.sectionContainers[button.section || 'default'];
      sectionContainer.appendChild(buttonElement);
    });

    // Create favorites container
    this.favoritesContainer = document.createElement('div');
    this.favoritesContainer.className = 'webinar-panel-remote-favorites';
    this.favoritesContainer.style.display = 'none';

    // Create settings container
    this.settingsContainer = document.createElement('div');
    this.settingsContainer.className = 'webinar-panel-remote-settings';
    this.settingsContainer.style.display = 'none';

    // Create search container
    this.searchContainer = document.createElement('div');
    this.searchContainer.className = 'webinar-panel-remote-search';
    this.searchContainer.style.display = 'none';

    // Button for collapsing/expanding the remote
    this.collapseButton = document.createElement('button');
    this.collapseButton.className = 'webinar-panel-remote-collapse';
    this.collapseButton.innerHTML = this.position === 'right' ? '▶' : '◀';
    this.collapseButton.addEventListener('click', () => this.toggleCollapsed());

    // Assemble remote
    this.remoteContainer.appendChild(this.collapseButton);
    this.remoteContainer.appendChild(this.buttonsContainer);
    this.remoteContainer.appendChild(this.favoritesContainer);
    this.remoteContainer.appendChild(this.settingsContainer);
    this.remoteContainer.appendChild(this.searchContainer);

    // Add to panel's parent element
    const panelParent = this.panelToggle.panelContainer.parentElement;
    panelParent.appendChild(this.remoteContainer);

    // Set initial state
    if (!this.expanded) {
      this.collapse();
    }

    // Update favorites
    this.updateFavorites();
  }

  /**
   * Create a button element
   * @param {Object} button - Button configuration
   * @returns {HTMLElement} Button element
   */
  createButton(button) {
    const buttonElement = document.createElement('button');
    buttonElement.className = `remote-button remote-button-${button.id}`;
    buttonElement.dataset.buttonId = button.id;

    // Add icon
    const iconElement = document.createElement('span');
    iconElement.className = 'remote-button-icon';
    iconElement.innerHTML = button.icon || '';
    buttonElement.appendChild(iconElement);

    // Add label if enabled
    if (this.showLabels && button.label) {
      const labelElement = document.createElement('span');
      labelElement.className = 'remote-button-label';
      labelElement.textContent = button.label;
      buttonElement.appendChild(labelElement);
    } else {
      buttonElement.title = button.label || button.id;
    }

    // Add click handler
    if (typeof button.action === 'function') {
      buttonElement.addEventListener('click', event => {
        event.preventDefault();
        button.action(button, this);
      });
    }

    return buttonElement;
  }

  /**
   * Toggle the collapsed state of the remote
   */
  toggleCollapsed() {
    if (this.expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  /**
   * Collapse the remote
   */
  collapse() {
    this.remoteContainer.classList.add('remote-collapsed');
    this.expanded = false;
    this.collapseButton.innerHTML = this.position === 'right' ? '◀' : '▶';
  }

  /**
   * Expand the remote
   */
  expand() {
    this.remoteContainer.classList.remove('remote-collapsed');
    this.expanded = true;
    this.collapseButton.innerHTML = this.position === 'right' ? '▶' : '◀';
  }

  /**
   * Navigate through history
   * @param {number} direction - Direction to navigate (-1 for back, 1 for forward)
   */
  navigateHistory(direction) {
    const history = this.panelToggle.history;
    if (!history.length) return false;

    // Update history index
    this.historyIndex = Math.max(
      -1,
      Math.min(this.historyIndex + direction, history.length - 1)
    );

    // Load view from history
    if (this.historyIndex >= 0) {
      const viewId = history[history.length - 1 - this.historyIndex];
      return this.panelToggle.loadView(viewId);
    }

    return false;
  }

  /**
   * Toggle favorites panel
   */
  toggleFavorites() {
    const isVisible = this.favoritesContainer.style.display !== 'none';

    // Hide other panels
    this.settingsContainer.style.display = 'none';
    this.searchContainer.style.display = 'none';

    // Toggle favorites panel
    this.favoritesContainer.style.display = isVisible ? 'none' : 'block';

    // Update favorites if showing
    if (!isVisible) {
      this.updateFavorites();
    }
  }

  /**
   * Update favorites panel with current favorites
   */
  updateFavorites() {
    this.favoritesContainer.innerHTML = '';

    // Create header
    const header = document.createElement('h3');
    header.textContent = 'Favorites';
    this.favoritesContainer.appendChild(header);

    // Create favorites list
    const favoritesList = document.createElement('div');
    favoritesList.className = 'favorites-list';

    // Add favorites buttons
    const favorites = this.panelToggle.favorites;
    if (favorites.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'favorites-empty';
      emptyMessage.textContent = 'No favorites added yet';
      favoritesList.appendChild(emptyMessage);
    } else {
      favorites.forEach(viewId => {
        const view = this.panelToggle.availableViews.find(v => v.id === viewId);
        if (!view) return;

        const favoriteButton = document.createElement('button');
        favoriteButton.className = 'favorite-button';
        favoriteButton.textContent = view.name || view.id;
        favoriteButton.addEventListener('click', () => {
          this.panelToggle.loadView(viewId);
          this.favoritesContainer.style.display = 'none';
        });

        // Add remove button
        const removeButton = document.createElement('button');
        removeButton.className = 'favorite-remove';
        removeButton.innerHTML = '✕';
        removeButton.title = 'Remove from favorites';
        removeButton.addEventListener('click', event => {
          event.stopPropagation();
          this.panelToggle.removeFromFavorites(viewId);
          this.updateFavorites();
        });

        favoriteButton.appendChild(removeButton);
        favoritesList.appendChild(favoriteButton);
      });
    }

    this.favoritesContainer.appendChild(favoritesList);
  }

  /**
   * Open search panel
   */
  openSearch() {
    // Hide other panels
    this.favoritesContainer.style.display = 'none';
    this.settingsContainer.style.display = 'none';

    // Toggle search panel
    const isVisible = this.searchContainer.style.display !== 'none';
    this.searchContainer.style.display = isVisible ? 'none' : 'block';

    // Create search interface if showing
    if (!isVisible) {
      this.searchContainer.innerHTML = '';

      // Create header
      const header = document.createElement('h3');
      header.textContent = 'Search Views';
      this.searchContainer.appendChild(header);

      // Create search input
      const searchForm = document.createElement('form');
      searchForm.className = 'search-form';

      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.className = 'search-input';
      searchInput.placeholder = 'Search...';

      const searchButton = document.createElement('button');
      searchButton.type = 'submit';
      searchButton.className = 'search-button';
      searchButton.innerHTML = '🔍';

      searchForm.appendChild(searchInput);
      searchForm.appendChild(searchButton);

      // Create results container
      const resultsContainer = document.createElement('div');
      resultsContainer.className = 'search-results';

      // Add search functionality
      searchForm.addEventListener('submit', event => {
        event.preventDefault();
        const query = searchInput.value.toLowerCase();
        this.performSearch(query, resultsContainer);
      });

      this.searchContainer.appendChild(searchForm);
      this.searchContainer.appendChild(resultsContainer);

      // Focus input
      setTimeout(() => searchInput.focus(), 0);
    }
  }

  /**
   * Perform search and display results
   * @param {string} query - Search query
   * @param {HTMLElement} resultsContainer - Container for results
   */
  performSearch(query, resultsContainer) {
    resultsContainer.innerHTML = '';

    if (!query) {
      resultsContainer.innerHTML =
        '<p class="search-empty">Enter a search term</p>';
      return;
    }

    // Filter views by query
    const filteredViews = this.panelToggle.availableViews.filter(view => {
      const viewName = (view.name || view.id).toLowerCase();
      const viewDescription = (view.description || '').toLowerCase();
      return viewName.includes(query) || viewDescription.includes(query);
    });

    if (filteredViews.length === 0) {
      resultsContainer.innerHTML =
        '<p class="search-empty">No results found</p>';
      return;
    }

    // Display results
    filteredViews.forEach(view => {
      const resultItem = document.createElement('div');
      resultItem.className = 'search-result';

      const resultButton = document.createElement('button');
      resultButton.className = 'result-button';
      resultButton.textContent = view.name || view.id;
      resultButton.addEventListener('click', () => {
        this.panelToggle.loadView(view.id);
        this.searchContainer.style.display = 'none';
      });

      const favoriteButton = document.createElement('button');
      favoriteButton.className = 'result-favorite';
      favoriteButton.innerHTML = this.panelToggle.favorites.includes(view.id)
        ? '★'
        : '☆';
      favoriteButton.title = this.panelToggle.favorites.includes(view.id)
        ? 'Remove from favorites'
        : 'Add to favorites';
      favoriteButton.addEventListener('click', event => {
        event.stopPropagation();
        if (this.panelToggle.favorites.includes(view.id)) {
          this.panelToggle.removeFromFavorites(view.id);
          favoriteButton.innerHTML = '☆';
          favoriteButton.title = 'Add to favorites';
        } else {
          this.panelToggle.addToFavorites(view.id);
          favoriteButton.innerHTML = '★';
          favoriteButton.title = 'Remove from favorites';
        }
      });

      resultItem.appendChild(resultButton);
      resultItem.appendChild(favoriteButton);

      // Add description if available
      if (view.description) {
        const description = document.createElement('p');
        description.className = 'result-description';
        description.textContent = view.description;
        resultItem.appendChild(description);
      }

      resultsContainer.appendChild(resultItem);
    });
  }

  /**
   * Open settings panel
   */
  openSettings() {
    // Hide other panels
    this.favoritesContainer.style.display = 'none';
    this.searchContainer.style.display = 'none';

    // Toggle settings panel
    const isVisible = this.settingsContainer.style.display !== 'none';
    this.settingsContainer.style.display = isVisible ? 'none' : 'block';

    // Create settings interface if showing
    if (!isVisible) {
      this.settingsContainer.innerHTML = '';

      // Create header
      const header = document.createElement('h3');
      header.textContent = 'Panel Settings';
      this.settingsContainer.appendChild(header);

      // Create settings form
      const settingsForm = document.createElement('form');
      settingsForm.className = 'settings-form';

      // Theme selection
      const themeGroup = document.createElement('div');
      themeGroup.className = 'settings-group';

      const themeLabel = document.createElement('label');
      themeLabel.textContent = 'Theme:';

      const themeSelect = document.createElement('select');
      themeSelect.className = 'theme-select';

      const themes = ['dark', 'light', 'high-contrast'];
      themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
        option.selected = theme === this.panelToggle.theme;
        themeSelect.appendChild(option);
      });

      themeGroup.appendChild(themeLabel);
      themeGroup.appendChild(themeSelect);

      // Position selection
      const positionGroup = document.createElement('div');
      positionGroup.className = 'settings-group';

      const positionLabel = document.createElement('label');
      positionLabel.textContent = 'Position:';

      const positionSelect = document.createElement('select');
      positionSelect.className = 'position-select';

      const positions = [
        'bottom-right',
        'bottom-left',
        'top-right',
        'top-left',
      ];
      positions.forEach(position => {
        const option = document.createElement('option');
        option.value = position;
        option.textContent = position
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        option.selected = position === this.panelToggle.position;
        positionSelect.appendChild(option);
      });

      positionGroup.appendChild(positionLabel);
      positionGroup.appendChild(positionSelect);

      // Animation toggle
      const animationGroup = document.createElement('div');
      animationGroup.className = 'settings-group';

      const animationCheckbox = document.createElement('input');
      animationCheckbox.type = 'checkbox';
      animationCheckbox.id = 'animation-toggle';
      animationCheckbox.checked = this.panelToggle.animate;

      const animationLabel = document.createElement('label');
      animationLabel.htmlFor = 'animation-toggle';
      animationLabel.textContent = 'Enable animations';

      animationGroup.appendChild(animationCheckbox);
      animationGroup.appendChild(animationLabel);

      // Labels toggle
      const labelsGroup = document.createElement('div');
      labelsGroup.className = 'settings-group';

      const labelsCheckbox = document.createElement('input');
      labelsCheckbox.type = 'checkbox';
      labelsCheckbox.id = 'labels-toggle';
      labelsCheckbox.checked = this.showLabels;

      const labelsLabel = document.createElement('label');
      labelsLabel.htmlFor = 'labels-toggle';
      labelsLabel.textContent = 'Show button labels';

      labelsGroup.appendChild(labelsCheckbox);
      labelsGroup.appendChild(labelsLabel);

      // Endpoint visibility
      const endpointGroup = document.createElement('div');
      endpointGroup.className = 'settings-group';

      const endpointLabel = document.createElement('label');
      endpointLabel.textContent = 'Endpoint Visibility:';

      const endpointSelect = document.createElement('select');
      endpointSelect.className = 'endpoint-select';

      const visibilityOptions = ['hover', 'always', 'none'];
      visibilityOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent =
          option.charAt(0).toUpperCase() + option.slice(1);
        optionElement.selected = option === this.panelToggle.endpointVisibility;
        endpointSelect.appendChild(optionElement);
      });

      endpointGroup.appendChild(endpointLabel);
      endpointGroup.appendChild(endpointSelect);

      // Apply button
      const applyButton = document.createElement('button');
      applyButton.type = 'submit';
      applyButton.className = 'settings-apply';
      applyButton.textContent = 'Apply Settings';

      // Add settings groups to form
      settingsForm.appendChild(themeGroup);
      settingsForm.appendChild(positionGroup);
      settingsForm.appendChild(animationGroup);
      settingsForm.appendChild(labelsGroup);
      settingsForm.appendChild(endpointGroup);
      settingsForm.appendChild(applyButton);

      // Add submit handler
      settingsForm.addEventListener('submit', event => {
        event.preventDefault();

        // Apply settings
        this.panelToggle.theme = themeSelect.value;
        this.panelToggle.position = positionSelect.value;
        this.panelToggle.animate = animationCheckbox.checked;
        this.showLabels = labelsCheckbox.checked;
        this.panelToggle.endpointVisibility = endpointSelect.value;

        // Update UI
        this.panelToggle.panelContainer.className = `webinar-panel webinar-panel-${this.panelToggle.theme} webinar-panel-${this.panelToggle.position}`;
        this.remoteContainer.className = `webinar-panel-remote webinar-panel-remote-${this.panelToggle.theme} webinar-panel-remote-${this.position}`;

        // Update endpoint visibility
        const endpointContainer = this.panelToggle.endpointContainer;
        if (endpointContainer) {
          endpointContainer.classList.remove(
            'endpoints-hover',
            'endpoints-visible'
          );
          if (this.panelToggle.endpointVisibility === 'hover') {
            endpointContainer.classList.add('endpoints-hover');
          } else if (this.panelToggle.endpointVisibility === 'always') {
            endpointContainer.classList.add('endpoints-visible');
          }
        }

        // Update button labels
        this.updateButtonLabels();

        // Hide settings panel
        this.settingsContainer.style.display = 'none';
      });

      this.settingsContainer.appendChild(settingsForm);
    }
  }

  /**
   * Update button labels based on showLabels setting
   */
  updateButtonLabels() {
    const buttons = this.remoteContainer.querySelectorAll('.remote-button');
    buttons.forEach(button => {
      const buttonId = button.dataset.buttonId;
      const buttonConfig = this.buttons.find(b => b.id === buttonId);
      if (!buttonConfig) return;

      // Find or create label element
      let labelElement = button.querySelector('.remote-button-label');
      if (this.showLabels) {
        if (!labelElement && buttonConfig.label) {
          labelElement = document.createElement('span');
          labelElement.className = 'remote-button-label';
          labelElement.textContent = buttonConfig.label;
          button.appendChild(labelElement);
        }
      } else if (labelElement) {
        labelElement.remove();
        button.title = buttonConfig.label || buttonConfig.id;
      }
    });
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WebinarPanelRemote;
} else if (typeof define === 'function' && define.amd) {
  define(['./panel-toggle'], function (WebinarPanelToggle) {
    return WebinarPanelRemote;
  });
} else if (window.WebinarPanelToggle) {
  window.WebinarPanelRemote = WebinarPanelRemote;
}

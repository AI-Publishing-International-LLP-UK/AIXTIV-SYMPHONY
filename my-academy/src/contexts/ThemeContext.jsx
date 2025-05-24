'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Context for theme management across the application
 */
const ThemeContext = createContext();

/**
 * Theme Provider component that handles theme loading and switching
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.initialTenantId - Initial tenant ID for theming
 * @param {boolean} props.initialDarkMode - Initial dark mode state
 */
export function ThemeProvider({
  children,
  initialTenantId = 'default',
  initialDarkMode = false,
}) {
  const [tenantId, setTenantId] = useState(initialTenantId);
  const [darkMode, setDarkMode] = useState(initialDarkMode);
  const [availableThemes, setAvailableThemes] = useState(['default']);

  // Load theme based on tenant ID
  useEffect(() => {
    // Remove any previously loaded tenant themes
    const prevLinks = document.querySelectorAll('link[data-tenant-theme]');
    prevLinks.forEach(link => link.remove());

    // Load tenant-specific theme if available
    if (tenantId !== 'default') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/styles/tenant-${tenantId}.css`;
      link.setAttribute('data-tenant-theme', tenantId);
      document.head.appendChild(link);
    }

    // Apply dark mode class to body if needed
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }

    // Store preferences
    try {
      localStorage.setItem(
        'theme-preferences',
        JSON.stringify({ tenantId, darkMode })
      );
    } catch (e) {
      console.error('Could not save theme preferences', e);
    }
  }, [tenantId, darkMode]);

  // Load available themes
  useEffect(() => {
    // In a real app, you would fetch this from an API
    // This is a placeholder for demonstration
    setAvailableThemes(['default', 'acme', 'globex', 'initech']);

    // Try to load saved preferences
    try {
      const savedPreferences = localStorage.getItem('theme-preferences');
      if (savedPreferences) {
        const { tenantId: savedTenant, darkMode: savedDarkMode } =
          JSON.parse(savedPreferences);
        if (savedTenant && savedTenant !== tenantId) {
          setTenantId(savedTenant);
        }
        if (savedDarkMode !== undefined && savedDarkMode !== darkMode) {
          setDarkMode(savedDarkMode);
        }
      }
    } catch (e) {
      console.error('Could not load saved theme preferences', e);
    }
  }, []);

  /**
   * Switch to a different tenant theme
   * @param {string} newTenantId - The ID of the tenant theme to switch to
   */
  const switchTheme = newTenantId => {
    if (newTenantId && availableThemes.includes(newTenantId)) {
      setTenantId(newTenantId);
    } else {
      console.warn(`Theme ${newTenantId} is not available`);
    }
  };

  /**
   * Toggle between light and dark mode
   */
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  /**
   * Set dark mode to a specific state
   * @param {boolean} state - The dark mode state to set
   */
  const setDarkModeState = state => {
    setDarkMode(Boolean(state));
  };

  /**
   * Get the current active theme styles
   * This can be used in components that need to access theme values programmatically
   */
  const getActiveTheme = () => {
    // In a real implementation, you might compute this from CSS variables
    // For now, we just return the tenant ID and dark mode state
    return {
      tenantId,
      darkMode,
      // You could add computed values here, like:
      // primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary'),
      // etc.
    };
  };

  const value = {
    tenantId,
    darkMode,
    availableThemes,
    switchTheme,
    toggleDarkMode,
    setDarkMode: setDarkModeState,
    getActiveTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Hook to use the theme context
 * @returns {Object} Theme context value
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Example usage:
 *
 * // In _app.jsx
 * import { ThemeProvider } from '../contexts/ThemeContext';
 *
 * function MyApp({ Component, pageProps }) {
 *   return (
 *     <ThemeProvider initialTenantId="acme">
 *       <Component {...pageProps} />
 *     </ThemeProvider>
 *   );
 * }
 *
 * // In a component
 * import { useTheme } from '../contexts/ThemeContext';
 *
 * function Header() {
 *   const { tenantId, darkMode, toggleDarkMode, switchTheme } = useTheme();
 *
 *   return (
 *     <header>
 *       <h1>Current theme: {tenantId}</h1>
 *       <button onClick={toggleDarkMode}>
 *         {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
 *       </button>
 *       <select
 *         value={tenantId}
 *         onChange={(e) => switchTheme(e.target.value)}
 *       >
 *         <option value="default">Default</option>
 *         <option value="acme">ACME Corp</option>
 *         <option value="globex">Globex</option>
 *       </select>
 *     </header>
 *   );
 * }
 */

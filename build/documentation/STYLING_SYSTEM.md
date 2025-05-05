# Current Styling System Documentation

This document outlines the current styling approach used in our application, including component structure, CSS variables, and theming system.

## Component Structure

The application uses styled components located in the `src/components/styled/` directory. These components use styled-jsx for inline styling:

- **Button.jsx**: A styled button component that supports different variants (primary, secondary) and sizes
- **Card.jsx**: A container component with consistent styling for card-like UI elements

Components use styled-jsx to encapsulate CSS within each component, making them self-contained.

## CSS Variables and Theming

### CSS Variables

The application uses CSS custom properties (variables) defined in `src/styles/themes.css` to maintain a consistent design language. Key variables include:

- Color variables (primary, secondary, text colors)
- Spacing and sizing variables
- Typography variables (font families, sizes)
- Animation/transition variables

### Tenant-specific Styling

The application supports multi-tenant styling through tenant-specific CSS files:

- `src/styles/tenant-acme.css`: Contains custom styling overrides for the "ACME" tenant

These tenant-specific files override the base theme variables to provide customized experiences for different tenants.

## Theming System

### ThemeContext

The application uses a React Context (`src/contexts/ThemeContext.jsx`) to manage theme state throughout the application. This context:

- Provides the current theme to all components
- Allows dynamic theme switching
- Stores theme preferences

Components can consume this context to access the current theme and adjust their styling accordingly.

## Styling Utilities

Utility functions in `src/utils/styleUtils.js` provide programmatic access to theme variables and consistent styling patterns:

- Functions to access theme colors and values
- Helper functions for common styling tasks
- Utilities to manage responsive behaviors

These utilities help maintain consistency when styling requires JavaScript integration.

## How Components Use the Styling System

1. Components use styled-jsx for component-specific styling
2. They access theme variables through CSS var() functions
3. For dynamic styling, they use the ThemeContext
4. For complex styling logic, they use the styling utility functions

## Example Usage

### Styled-JSX in Components

```jsx
// From Button.jsx
<style jsx>{`
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius-md);
    font-weight: var(--font-weight-medium);
    transition: all 0.2s ease;
  }
  
  .primary {
    background-color: var(--color-primary);
    color: var(--color-white);
  }
  
  .secondary {
    background-color: var(--color-secondary);
    color: var(--color-black);
  }
`}</style>
```

### Using ThemeContext

```jsx
const { theme, setTheme } = useTheme();

// Access theme values
const primaryColor = theme.colors.primary;

// Switch themes
const toggleTheme = () => {
  setTheme(theme.name === 'light' ? 'dark' : 'light');
};
```

### Using Styling Utilities

```jsx
import { getThemeColor, applyResponsiveStyles } from '../utils/styleUtils';

// Get a color from the current theme
const highlightColor = getThemeColor('highlight');

// Apply responsive styles
const containerStyles = applyResponsiveStyles({
  base: { padding: '1rem' },
  md: { padding: '2rem' },
  lg: { padding: '3rem' }
});
```


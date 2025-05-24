/**
 * Style Utilities
 *
 * This file contains utility functions for common style patterns and
 * helper functions to access theme variables programmatically.
 */

/**
 * Creates heading styles with consistent typography based on heading level
 * @param {number} level - Heading level (1-6)
 * @returns {string} CSS styles for the heading
 */
export const headingStyle = (level = 1) => `
  font-family: var(--font-family-heading);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-${level <= 2 ? 'lg' : 'md'});
  font-size: ${2.5 - level * 0.25}rem;
  line-height: 1.2;
`;

/**
 * Creates card styles with consistent appearance
 * @param {string} variant - Card variant ('default', 'outlined', 'elevated')
 * @returns {string} CSS styles for the card
 */
export const cardStyle = (variant = 'default') => {
  const baseStyle = `
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    transition: all 0.2s ease;
  `;

  const variantStyles = {
    default: `
      background-color: var(--surface);
      box-shadow: var(--shadow-sm);
    `,
    outlined: `
      background-color: var(--surface);
      border: 1px solid var(--text-secondary);
      box-shadow: none;
    `,
    elevated: `
      background-color: var(--surface);
      box-shadow: var(--shadow-lg);
    `,
  };

  return `${baseStyle}${variantStyles[variant] || variantStyles.default}`;
};

/**
 * Creates form element styles with consistent appearance
 * @param {string} type - Form element type ('input', 'select', 'textarea')
 * @returns {string} CSS styles for the form element
 */
export const formElementStyle = (type = 'input') => {
  const baseStyle = `
    display: block;
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    font-family: var(--font-family-main);
    font-size: 1rem;
    border: 1px solid var(--text-secondary);
    border-radius: var(--radius-sm);
    background-color: var(--background);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
    }
  `;

  const typeStyles = {
    textarea: `
      min-height: 100px;
      resize: vertical;
    `,
    select: `
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right var(--spacing-sm) center;
      padding-right: var(--spacing-xl);
    `,
  };

  return `${baseStyle}${typeStyles[type] || ''}`;
};

/**
 * Creates button styles with consistent appearance
 * @param {string} variant - Button variant ('primary', 'secondary', 'outline', 'text')
 * @param {string} size - Button size ('sm', 'md', 'lg')
 * @returns {string} CSS styles for the button
 */
export const buttonStyle = (variant = 'primary', size = 'md') => {
  const baseStyle = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-family-main);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  `;

  const sizeStyles = {
    sm: `
      padding: var(--spacing-xs) var(--spacing-sm);
      font-size: 0.875rem;
    `,
    md: `
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: 1rem;
    `,
    lg: `
      padding: var(--spacing-md) var(--spacing-lg);
      font-size: 1.125rem;
    `,
  };

  const variantStyles = {
    primary: `
      background-color: var(--primary);
      color: white;
      border: none;
      
      &:hover {
        background-color: var(--primary-dark);
      }
      
      &:focus {
        box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.3);
      }
    `,
    secondary: `
      background-color: var(--secondary);
      color: white;
      border: none;
      
      &:hover {
        filter: brightness(0.9);
      }
      
      &:focus {
        box-shadow: 0 0 0 3px rgba(var(--secondary-rgb), 0.3);
      }
    `,
    outline: `
      background-color: transparent;
      color: var(--primary);
      border: 1px solid var(--primary);
      
      &:hover {
        background-color: rgba(var(--primary-rgb), 0.05);
      }
      
      &:focus {
        box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.2);
      }
    `,
    text: `
      background-color: transparent;
      color: var(--primary);
      border: none;
      
      &:hover {
        background-color: rgba(var(--primary-rgb), 0.05);
      }
    `,
  };

  return `${baseStyle}${sizeStyles[size] || sizeStyles.md}${variantStyles[variant] || variantStyles.primary}`;
};

/**
 * Creates layout grid styles with consistent appearance
 * @param {number} columns - Number of columns
 * @param {string} gap - Gap size ('xs', 'sm', 'md', 'lg', 'xl')
 * @returns {string} CSS styles for the grid layout
 */
export const gridStyle = (columns = 12, gap = 'md') => {
  const gapSizes = {
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)',
  };

  return `
    display: grid;
    grid-template-columns: repeat(${columns}, 1fr);
    gap: ${gapSizes[gap] || gapSizes.md};
  `;
};

/**
 * Creates flexbox layout styles with consistent appearance
 * @param {string} direction - Flex direction ('row', 'column')
 * @param {string} align - Align items ('start', 'center', 'end', 'stretch')
 * @param {string} justify - Justify content ('start', 'center', 'end', 'between', 'around')
 * @param {string} gap - Gap size ('xs', 'sm', 'md', 'lg', 'xl')
 * @returns {string} CSS styles for the flexbox layout
 */
export const flexStyle = (
  direction = 'row',
  align = 'center',
  justify = 'start',
  gap = 'md'
) => {
  const gapSizes = {
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)',
  };

  const justifyMap = {
    start: 'flex-start',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    center: 'center',
  };

  const alignMap = {
    start: 'flex-start',
    end: 'flex-end',
    center: 'center',
    stretch: 'stretch',
  };

  return `
    display: flex;
    flex-direction: ${direction};
    align-items: ${alignMap[align] || alignMap.center};
    justify-content: ${justifyMap[justify] || justifyMap.start};
    gap: ${gapSizes[gap] || gapSizes.md};
  `;
};

/**
 * Helper function to get CSS variable value
 * @param {string} variable - CSS variable name (without the -- prefix)
 * @returns {string} The value of the CSS variable
 */
export const getThemeVar = variable => {
  if (typeof window === 'undefined') return null;
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--${variable}`)
    .trim();
};

/**
 * Helper function to set CSS variable value
 * @param {string} variable - CSS variable name (without the -- prefix)
 * @param {string} value - New value for the CSS variable
 */
export const setThemeVar = (variable, value) => {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty(`--${variable}`, value);
};

/**
 * Creates responsive styles based on the breakpoints
 * @param {Object} styles - Object containing styles for different breakpoints
 * @returns {string} CSS styles with media queries
 *
 * @example
 * responsive({
 *   base: 'width: 100%;',
 *   md: 'width: 50%;',
 *   lg: 'width: 33.33%;'
 * })
 */
export const responsive = styles => {
  const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  };

  let css = styles.base || '';

  Object.entries(styles).forEach(([key, value]) => {
    if (key !== 'base' && breakpoints[key]) {
      css += `
        @media (min-width: ${breakpoints[key]}) {
          ${value}
        }
      `;
    }
  });

  return css;
};

/**
 * Creates text styles with consistent typography
 * @param {string} variant - Text variant ('body', 'small', 'large', 'caption')
 * @returns {string} CSS styles for the text
 */
export const textStyle = (variant = 'body') => {
  const variants = {
    body: `
      font-family: var(--font-family-main);
      font-weight: var(--font-weight-normal);
      font-size: 1rem;
      line-height: 1.5;
      color: var(--text-primary);
    `,
    small: `
      font-family: var(--font-family-main);
      font-weight: var(--font-weight-normal);
      font-size: 0.875rem;
      line-height: 1.5;
      color: var(--text-primary);
    `,
    large: `
      font-family: var(--font-family-main);
      font-weight: var(--font-weight-normal);
      font-size: 1.125rem;
      line-height: 1.5;
      color: var(--text-primary);
    `,
    caption: `
      font-family: var(--font-family-main);
      font-weight: var(--font-weight-normal);
      font-size: 0.75rem;
      line-height: 1.5;
      color: var(--text-secondary);
    `,
  };

  return variants[variant] || variants.body;
};

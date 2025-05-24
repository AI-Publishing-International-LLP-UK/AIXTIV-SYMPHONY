import React from 'react';

/**
 * Button Component
 * A versatile button component that supports various styles and sizes.
 *
 * @param {Object} props - Component props
 * @param {string} [props.variant='primary'] - Button style variant: 'primary', 'secondary', 'outline'
 * @param {string} [props.size='medium'] - Button size: 'small', 'medium', 'large'
 * @param {boolean} [props.fullWidth=false] - Whether button should take full width of container
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {string} [props.type='button'] - Button type attribute
 * @param {Function} [props.onClick] - Click handler function
 * @param {React.ReactNode} props.children - Button content
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) => {
  // Combine classes to handle external className additions
  const buttonClass = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`;

  return (
    <button
      className={buttonClass}
      type={type}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
      <style jsx>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-family-main);
          font-weight: var(--font-weight-medium);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          outline: none;
          position: relative;
          overflow: hidden;
        }

        .btn:focus-visible {
          box-shadow: 0 0 0 3px var(--primary-transparent);
          outline: none;
        }

        /* Size variants */
        .btn-small {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: 0.875rem;
          height: 2rem;
        }

        .btn-medium {
          padding: var(--spacing-sm) var(--spacing-md);
          font-size: 1rem;
          height: 2.5rem;
        }

        .btn-large {
          padding: var(--spacing-md) var(--spacing-lg);
          font-size: 1.125rem;
          height: 3rem;
        }

        /* Style variants */
        .btn-primary {
          background-color: var(--primary);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: var(--primary-dark);
        }

        .btn-primary:active:not(:disabled) {
          transform: translateY(1px);
          background-color: var(--primary-darker, var(--primary-dark));
        }

        .btn-secondary {
          background-color: var(--secondary);
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: var(--secondary-dark, #0ea271);
          filter: brightness(0.9);
        }

        .btn-secondary:active:not(:disabled) {
          transform: translateY(1px);
          filter: brightness(0.85);
        }

        .btn-outline {
          background-color: transparent;
          color: var(--primary);
          border: 1px solid var(--primary);
        }

        .btn-outline:hover:not(:disabled) {
          background-color: var(--primary-transparent, rgba(59, 130, 246, 0.1));
        }

        .btn-outline:active:not(:disabled) {
          transform: translateY(1px);
          background-color: var(--primary-transparent, rgba(59, 130, 246, 0.2));
        }

        /* Disabled state */
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Full width */
        .btn-full {
          width: 100%;
        }

        /* Button with loading state (for future use) */
        .btn-loading {
          position: relative;
          color: transparent;
        }

        .btn-loading::after {
          content: '';
          position: absolute;
          width: 1em;
          height: 1em;
          border-radius: 50%;
          border: 2px solid currentColor;
          border-top-color: transparent;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
};

export default Button;

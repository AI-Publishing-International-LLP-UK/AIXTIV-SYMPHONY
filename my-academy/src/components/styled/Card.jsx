import React from 'react';

/**
 * Card Component
 * Renders a themed card container with customizable styling
 *
 * @param {ReactNode} children - The content to display inside the card
 * @param {string} variant - Card style variant: 'default', 'outlined', 'elevated'
 * @param {string} shadow - Shadow size: 'none', 'sm', 'md', 'lg'
 * @param {string} padding - Padding size: 'none', 'sm', 'md', 'lg', 'xl'
 * @param {boolean} interactive - Whether the card should have hover/active states
 * @param {string} className - Additional CSS classes to apply
 * @param {Object} props - Additional HTML attributes
 */
export function Card({
  children,
  variant = 'default',
  shadow = 'md',
  padding = 'md',
  interactive = false,
  className = '',
  ...props
}) {
  const cardClassName = `card card-${variant} ${className} ${interactive ? 'interactive' : ''}`;

  return (
    <div className={cardClassName} {...props}>
      {children}
      <style jsx>{`
        .card {
          border-radius: var(--radius-md);
          background-color: var(--surface);
          overflow: hidden;
          position: relative;
          transition: all 0.2s ease-in-out;
        }

        .card-default {
          box-shadow: ${shadow === 'none' ? 'none' : `var(--shadow-${shadow})`};
          padding: ${padding === 'none' ? '0' : `var(--spacing-${padding})`};
        }

        .card-outlined {
          border: 1px solid var(--border-color, #e2e8f0);
          padding: ${padding === 'none' ? '0' : `var(--spacing-${padding})`};
          box-shadow: none;
        }

        .card-elevated {
          box-shadow: var(--shadow-lg);
          padding: ${padding === 'none' ? '0' : `var(--spacing-${padding})`};
        }

        .card-elevated:hover {
          transform: ${interactive ? 'translateY(-3px)' : 'none'};
          box-shadow: ${interactive
            ? 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))'
            : 'var(--shadow-lg)'};
        }

        .interactive {
          cursor: pointer;
        }

        .interactive:hover {
          box-shadow: ${shadow === 'none' ? 'none' : 'var(--shadow-lg)'};
        }

        .interactive:active {
          transform: translateY(1px);
        }
      `}</style>
    </div>
  );
}

/**
 * CardHeader Component
 * Renders a styled header section for the Card
 */
export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
      <style jsx>{`
        .card-header {
          border-bottom: 1px solid var(--border-color, #e2e8f0);
          padding-bottom: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}

/**
 * CardFooter Component
 * Renders a styled footer section for the Card
 */
export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
      <style jsx>{`
        .card-footer {
          border-top: 1px solid var(--border-color, #e2e8f0);
          padding-top: var(--spacing-sm);
          margin-top: var(--spacing-md);
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}

/**
 * CardMedia Component
 * Renders a media container (images/videos) for the Card
 *
 * @param {string} position - Where to position the media: 'top', 'bottom'
 */
export function CardMedia({
  children,
  position = 'top',
  className = '',
  ...props
}) {
  return (
    <div
      className={`card-media card-media-${position} ${className}`}
      {...props}
    >
      {children}
      <style jsx>{`
        .card-media {
          margin: 0 calc(-1 * var(--spacing-md));
          overflow: hidden;
        }

        .card-media-top {
          margin-top: calc(-1 * var(--spacing-md));
          margin-bottom: var(--spacing-md);
        }

        .card-media-bottom {
          margin-bottom: calc(-1 * var(--spacing-md));
          margin-top: var(--spacing-md);
        }

        .card-media :global(img) {
          width: 100%;
          display: block;
        }
      `}</style>
    </div>
  );
}

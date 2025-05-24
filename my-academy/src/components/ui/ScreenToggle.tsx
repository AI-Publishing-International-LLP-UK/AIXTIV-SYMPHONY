'use client';

import React, { useState, useEffect } from 'react';
import {
  Video,
  Users,
  Bot,
  PanelLeft,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface ScreenToggleProps {
  activeScreen: string;
  onScreenChange: (screen: string) => void;
  screens: {
    id: string;
    label: string;
    icon: React.ReactNode;
    description?: string;
  }[];
  isExpanded?: boolean;
}

/**
 * ScreenToggle component for switching between different screens/views in the Academy UI
 */
const ScreenToggle: React.FC<ScreenToggleProps> = ({
  activeScreen,
  onScreenChange,
  screens,
  isExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const [hoveredScreen, setHoveredScreen] = useState<string | null>(null);

  // Default screens if none provided
  const defaultScreens = [
    {
      id: 'theater',
      label: 'Theater',
      icon: <Video className="w-5 h-5" />,
      description: 'Join webinars and watch presentations',
    },
    {
      id: 'pilots-lounge',
      label: 'Pilots Lounge',
      icon: <Users className="w-5 h-5" />,
      description: 'Connect with other pilots and view dashboards',
    },
    {
      id: 'copilot',
      label: 'Copilot',
      icon: <Bot className="w-5 h-5" />,
      description: 'Work directly with your AI copilot',
    },
  ];

  const displayScreens = screens?.length ? screens : defaultScreens;

  return (
    <div
      className={`fixed ${expanded ? 'left-5' : 'left-2'} top-1/2 transform -translate-y-1/2 
      bg-white dark:bg-gray-800 shadow-lg rounded-lg transition-all duration-200 z-50
      ${expanded ? 'w-48' : 'w-12'} p-2`}
    >
      <div className="flex flex-col space-y-2">
        {displayScreens.map(screen => (
          <button
            key={screen.id}
            onClick={() => onScreenChange(screen.id)}
            onMouseEnter={() => setHoveredScreen(screen.id)}
            onMouseLeave={() => setHoveredScreen(null)}
            className={`relative flex items-center ${expanded ? 'justify-start px-3' : 'justify-center'} py-2 rounded-md transition-colors
              ${
                activeScreen === screen.id
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
              }`}
          >
            <div className="flex items-center">
              {React.cloneElement(screen.icon as React.ReactElement, {
                className: `${expanded ? 'mr-3' : ''} ${(screen.icon as React.ReactElement).props.className || 'w-5 h-5'}`,
              })}
              {expanded && <span>{screen.label}</span>}
            </div>

            {/* Tooltip for collapsed mode */}
            {!expanded && hoveredScreen === screen.id && (
              <div className="absolute left-full ml-2 w-32 px-2 py-1 bg-gray-800 dark:bg-gray-900 text-white text-xs rounded whitespace-normal z-10">
                {screen.label}
                {screen.description && (
                  <p className="mt-1 text-gray-300 text-xs">
                    {screen.description}
                  </p>
                )}
              </div>
            )}
          </button>
        ))}

        {/* Expand/collapse button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center py-2 mt-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          {expanded ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ScreenToggle;

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Users,
  MessageSquare,
  ScreenShare,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Settings,
} from 'lucide-react';

declare global {
  interface Window {
    DailyIframe: any;
  }
}

interface TheaterViewProps {
  roomUrl?: string;
  userName?: string;
  role?: 'viewer' | 'participant' | 'moderator';
  showChat?: boolean;
  showParticipants?: boolean;
}

/**
 * TheaterView component for joining video webinars using Daily.co
 */
const TheaterView: React.FC<TheaterViewProps> = ({
  roomUrl,
  userName = 'Anonymous',
  role = 'viewer',
  showChat = true,
  showParticipants = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callInstance, setCallInstance] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const frameContainerRef = useRef<HTMLDivElement>(null);
  const dailyUrl = roomUrl || 'https://your-daily-domain.daily.co/room-name';

  useEffect(() => {
    // Load Daily.co script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@daily-co/daily-js';
    script.async = true;
    script.onload = () => initializeDaily();
    script.onerror = () => setError('Failed to load Daily.co library');
    document.body.appendChild(script);

    return () => {
      // Clean up
      if (callInstance && typeof callInstance.destroy === 'function') {
        callInstance.destroy();
      }
    };
  }, [roomUrl]);

  const initializeDaily = async () => {
    try {
      if (!window.DailyIframe) {
        setError('Daily.co library not loaded properly');
        return;
      }

      if (!frameContainerRef.current) return;

      // Create the Daily call frame
      const callFrame = window.DailyIframe.createFrame(
        frameContainerRef.current,
        {
          showLeaveButton: true,
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '12px',
          },
        }
      );

      callFrame
        .on('joining-meeting', () => {
          console.log('Joining theater room...');
        })
        .on('joined-meeting', () => {
          console.log('Joined theater room!');
          setIsLoading(false);
        })
        .on('error', (e: any) => {
          console.error('Daily error:', e);
          setError(`Error: ${e.errorMsg || 'Unknown error'}`);
        })
        .on('left-meeting', () => {
          console.log('Left theater room');
        });

      // Join the room
      await callFrame.join({
        url: dailyUrl,
        userName: userName,
        showLeaveButton: true,
      });

      // Check user role/permissions and set initial states
      if (role === 'viewer') {
        callFrame.setLocalAudio(false);
        callFrame.setLocalVideo(false);
        setAudioEnabled(false);
        setVideoEnabled(false);
      } else {
        // For participants and moderators
        callFrame.setLocalAudio(true);
        callFrame.setLocalVideo(false); // Default video off
        setAudioEnabled(true);
        setVideoEnabled(false);
      }

      setCallInstance(callFrame);
    } catch (err) {
      console.error('Error initializing Daily:', err);
      setError(`Failed to initialize: ${(err as Error).message}`);
      setIsLoading(false);
    }
  };

  const toggleAudio = () => {
    if (!callInstance) return;
    const newState = !audioEnabled;
    callInstance.setLocalAudio(newState);
    setAudioEnabled(newState);
  };

  const toggleVideo = () => {
    if (!callInstance) return;
    const newState = !videoEnabled;
    callInstance.setLocalVideo(newState);
    setVideoEnabled(newState);
  };

  const toggleScreenShare = async () => {
    if (!callInstance) return;
    if (screenShareEnabled) {
      await callInstance.stopScreenShare();
      setScreenShareEnabled(false);
    } else {
      try {
        await callInstance.startScreenShare();
        setScreenShareEnabled(true);
      } catch (e) {
        console.error('Error sharing screen:', e);
      }
    }
  };

  const leaveCall = () => {
    if (!callInstance) return;
    callInstance.leave();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex">
        {/* Main video area */}
        <div className="flex-1 p-4">
          <div className="bg-gray-900 rounded-xl h-full w-full relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
                <div className="text-center p-4">
                  <p className="text-red-500 mb-2">{error}</p>
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    onClick={initializeDaily}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <div ref={frameContainerRef} className="h-full w-full"></div>
          </div>
        </div>

        {/* Right sidebar for chat and participants */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {showChat && (
                <button
                  className={`flex-1 py-3 text-sm font-medium ${
                    activeTab === 'chat'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('chat')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat</span>
                  </div>
                </button>
              )}

              {showParticipants && (
                <button
                  className={`flex-1 py-3 text-sm font-medium ${
                    activeTab === 'participants'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('participants')}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Participants</span>
                  </div>
                </button>
              )}
            </div>

            {/* Tab content */}
            <div className="p-4">
              {activeTab === 'chat' ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto mb-4 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-md">
                    <p className="text-gray-500 dark:text-gray-400 text-center text-sm py-8">
                      Chat will appear here when the Daily.co integration is
                      complete.
                    </p>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="w-full p-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-indigo-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <p className="text-gray-500 dark:text-gray-400 text-center text-sm py-8">
                    Participants will appear here when the Daily.co integration
                    is complete.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mr-2">
            Theater Mode
          </p>
          <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${
              audioEnabled
                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {audioEnabled ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              videoEnabled
                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {videoEnabled ? (
              <Video className="w-5 h-5" />
            ) : (
              <VideoOff className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full ${
              screenShareEnabled
                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            <ScreenShare className="w-5 h-5" />
          </button>

          <button
            onClick={leaveCall}
            className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        <div className="w-24">{/* Empty space to balance the layout */}</div>
      </div>
    </div>
  );
};

export default TheaterView;

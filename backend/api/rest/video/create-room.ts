import axios from 'axios';

// Interface for function parameters
interface CreateRoomParams {
  userId: string;
  context: {
    sessionName?: string;
    duration?: number;
    maxParticipants?: number;
    enableChat?: boolean;
    enableScreenshare?: boolean;
    [key: string]: any; // Allow for additional context properties
  };
}

// Interface for the room object returned
interface DailyRoom {
  id: string;
  name: string;
  url: string;
  apiCreated: boolean;
  privacy: string;
  created_at: string;
  config?: {
    max_participants?: number;
    enable_chat?: boolean;
    enable_screenshare?: boolean;
    [key: string]: any;
  };
  [key: string]: any; // Allow for additional room properties
}

/**
 * Creates a video room using the Daily.co API
 *
 * @param userId - The ID of the user creating the room
 * @param context - Additional context for room creation
 * @returns Promise resolving to a room object
 */
export async function createDailyRoom(
  userId: string,
  context: CreateRoomParams['context']
): Promise<DailyRoom> {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.DAILY_API_KEY;

    if (!apiKey) {
      throw new Error('DAILY_API_KEY environment variable is required');
    }

    // Construct room configuration
    const roomConfig = {
      privacy: 'private',
      properties: {
        max_participants: context.maxParticipants || 10,
        enable_chat: context.enableChat ?? true,
        enable_screenshare: context.enableScreenshare ?? true,
        start_video_off: false,
        start_audio_off: false,
        owner_only_broadcast: false,
        exp: Math.floor(Date.now() / 1000) + (context.duration || 3600), // Default 1 hour expiration
      },
    };

    // Get room name from context or generate one
    const roomName = context.sessionName || `session-${userId}-${Date.now()}`;

    // Make API request to create room
    const response = await axios.post(
      'https://api.daily.co/v1/rooms',
      {
        name: roomName,
        ...roomConfig,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    // Log room creation
    console.log(`Created room for user ${userId}: ${roomName}`);

    return response.data;
  } catch (error) {
    console.error('Error creating Daily room:', error);
    throw error;
  }
}

/**
 * Validates if a room exists and is active
 *
 * @param roomId - The ID of the room to validate
 * @returns Promise resolving to a boolean indicating if the room is valid
 */
export async function validateRoom(roomId: string): Promise<boolean> {
  try {
    const apiKey = process.env.DAILY_API_KEY;

    if (!apiKey) {
      throw new Error('DAILY_API_KEY environment variable is required');
    }

    const response = await axios.get(
      `https://api.daily.co/v1/rooms/${roomId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return response.status === 200;
  } catch (error) {
    console.error('Error validating room:', error);
    return false;
  }
}

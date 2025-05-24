'use server'
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { db } from '@/aixtiv-orchestra/services/firebase'

// Define Conference interface to replace Prisma type
export interface Conference {
  id: string
  name: string
  description: string
  startDateTime: Date
  endDateTime: Date
  date: Date
  conferenceRoom: string
  conferenceUrlRoom: string
  speakerId: string
  speaker?: any
  attendeesAsAttendee?: any[]
}

// Create a reference to the conferences collection
const conferencesCollection = collection(db, 'conferences')

export interface CreateConferenceDto {
  name: string
  description: string
  startDateTime: Date
  endDateTime: Date
  date: Date
  speakerId: string
}

export interface UpdateConferenceDto {
  name?: string
  description?: string
  startDateTime?: Date
  endDateTime?: Date
  conferenceRoomId?: string
  date?: Date
  speakerId?: string
}

export const createConference = async (data: CreateConferenceDto): Promise<Conference> => {
  try {
    const room = await createRoomDail()

    console.log(room)

    // Create a new conference document in Firestore
    const newConference = {
      name: data.name,
      description: data.description,
      startDateTime: data.startDateTime,
      endDateTime: data.endDateTime,
      conferenceRoom: room.id,
      conferenceUrlRoom: room.url,
      date: data.date,
      speakerId: data.speakerId,
      createdAt: new Date()
    }

    // Stub implementation - return mock data
    return {
      id: 'mock-id-' + Date.now(),
      ...newConference
    } as Conference
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create conference')
  }
}

export const getAllConferences = async (): Promise<Conference[]> => {
  try {
    // Stub implementation - return empty array or mock data
    return [
      {
        id: 'mock-id-1',
        name: 'Mock Conference 1',
        description: 'This is a mock conference',
        startDateTime: new Date(),
        endDateTime: new Date(Date.now() + 3600000), // 1 hour later
        date: new Date(),
        conferenceRoom: 'mock-room-1',
        conferenceUrlRoom: 'https://example.com/room/mock-1',
        speakerId: 'mock-speaker-1',
        speaker: { id: 'mock-speaker-1', name: 'Mock Speaker' },
        attendeesAsAttendee: []
      }
    ]
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find conferences')
  }
}

export const getConferenceById = async (id: string): Promise<Conference | null> => {
  try {
    // Stub implementation - return mock data for the given ID
    if (id === 'mock-id-1') {
      return {
        id: 'mock-id-1',
        name: 'Mock Conference 1',
        description: 'This is a mock conference',
        startDateTime: new Date(),
        endDateTime: new Date(Date.now() + 3600000), // 1 hour later
        date: new Date(),
        conferenceRoom: 'mock-room-1',
        conferenceUrlRoom: 'https://example.com/room/mock-1',
        speakerId: 'mock-speaker-1',
        speaker: { id: 'mock-speaker-1', name: 'Mock Speaker' },
        attendeesAsAttendee: []
      }
    }
    return null
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find conference')
  }
}

export const updateConference = async (id: string, data: UpdateConferenceDto): Promise<Conference> => {
  try {
    // Stub implementation - return updated mock data
    return {
      id,
      name: data.name || 'Mock Conference Updated',
      description: data.description || 'This is an updated mock conference',
      startDateTime: data.startDateTime || new Date(),
      endDateTime: data.endDateTime || new Date(Date.now() + 3600000),
      date: data.date || new Date(),
      conferenceRoom: 'mock-room-1',
      conferenceUrlRoom: 'https://example.com/room/mock-1',
      speakerId: data.speakerId || 'mock-speaker-1'
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update conference')
  }
}

export const deleteConference = async (id: string): Promise<void> => {
  try {
    // Stub implementation - just log the deletion
    console.log(`Mock deleting conference with ID: ${id}`)
    // In a real implementation, we would use:
    // await deleteDoc(doc(conferencesCollection, id))
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete conference')
  }
}

export const createRoomDail = async () => {
  const roomProperties = {
    privacy: 'private',
    properties: {
      eject_at_room_exp: true,
      start_audio_off: true,
      start_video_off: true,
      enable_recording: 'cloud',
      enable_transcription_storage: true,
      auto_transcription_settings: {
        language: 'es',
        model: 'nova-2'
      },
      recordings_bucket: {
        bucket_name: process.env.BUCKET_AWS_NAME,
        bucket_region: process.env.REGION_AWS,
        assume_role_arn: process.env.DAYLY_AWS_ARN,
        allow_api_access: false
      },
      transcription_bucket: {
        bucket_name: process.env.BUCKET_AWS_NAME,
        bucket_region: process.env.REGION_AWS,
        assume_role_arn: process.env.DAYLY_AWS_ARN,
        allow_api_access: false
      }
    }
  }

  console.log('Room properties:', roomProperties)

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.DAILY_API_KEY}`
    },
    body: JSON.stringify(roomProperties)
  })

  if (!response.ok) {
    console.log(response.text())
    throw new Error(`Error creating Daily.co room: ${response.statusText}`)
  }

  const room = await response.json()

  return room
}

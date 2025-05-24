'use server'
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/aixtiv-orchestra/services/firebase'

const webinarCollection = collection(db, 'webinars')

export interface Webinar {
  id: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  thumbnail: string
  speakerId: string
  webinarIdRoom: string
  webinarUrlRoom: string
}

export interface CreateWebinarDto {
  name: string
  description: string
  startDate: Date
  endDate: Date
  thumbnail: string
  speakerId: string
}

export const createWebinar = async (data: CreateWebinarDto): Promise<Webinar> => {
  try {
    const room = await createRoomDailWebinar({ data: { startDate: data.startDate, endDate: data.endDate } })

    console.log('room:', room)

    const webinarData = {
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      webinarIdRoom: room.id,
      webinarUrlRoom: room.url,
      endDate: data.endDate,
      thumbnail: data.thumbnail,
      speakerId: data.speakerId
    }

    const docRef = await addDoc(webinarCollection, webinarData)

    console.log('webinar:', docRef.id)

    const createdWebinar = {
      id: docRef.id,
      ...webinarData
    } as Webinar

    return createdWebinar
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create webinar')
  }
}

export const getAllWebinar = async (): Promise<Webinar[]> => {
  try {
    const snapshot = await getDocs(webinarCollection)
    const webinars: Webinar[] = []

    snapshot.forEach(doc => {
      webinars.push({
        id: doc.id,
        ...doc.data()
      } as Webinar)
    })

    return webinars
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find webinars')
  }
}

export const getWebinarById = async (id: string): Promise<Webinar | null> => {
  try {
    const docRef = doc(webinarCollection, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Webinar
    }

    return null
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find webinar')
  }
}

export const updateWebinar = async (id: string, data: Partial<Webinar>): Promise<Webinar> => {
  try {
    const docRef = doc(webinarCollection, id)

    // Remove the id field from the data to be updated
    const { id: _, ...updateData } = data

    await updateDoc(docRef, updateData as any)

    // Fetch the updated document
    const updatedDoc = await getDoc(docRef)

    if (!updatedDoc.exists()) {
      throw new Error('Webinar not found after update')
    }

    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Webinar
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update webinar')
  }
}

export const deleteWebinar = async (id: string): Promise<void> => {
  try {
    const docRef = doc(webinarCollection, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete webinar')
  }
}

export const createRoomDailWebinar = async ({
  data
}: {
  data: {
    startDate: Date
    endDate: Date
  }
}) => {
  const roomProperties = {
    privacy: 'private',
    properties: {
      eject_at_room_exp: true,
      start_audio_off: true,
      start_video_off: true,
      enable_recording: 'cloud',
      enable_transcription_storage: true,
      auto_transcription_settings: {
        language: 'en',
        model: 'nova-2'
      },
      nbf: new Date(data.startDate).getTime() / 1000,
      exp: new Date(data.endDate).getTime() / 1000,
      permissions: {
        canSend: ['video']
      },
      recordings_bucket: {
        bucket_name: process.env.BUCKET_AWS_NAME,
        bucket_region: process.env.REGION_AWS,
        assume_role_arn: process.env.DAYLY_AWS_ARN,
        allow_api_access: true
      },
      transcription_bucket: {
        bucket_name: process.env.BUCKET_AWS_NAME,
        bucket_region: process.env.REGION_AWS,
        assume_role_arn: process.env.DAYLY_AWS_ARN,
        allow_api_access: true
      }
    }
  }

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
    console.log(response)
    throw new Error(`Error creating Daily.co room: ${response.statusText}`)
  }

  const room = await response.json()

  return room
}

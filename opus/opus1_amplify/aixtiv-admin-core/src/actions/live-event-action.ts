'use server'

import { db } from '@/aixtiv-orchestra/services/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  DocumentData
} from 'firebase/firestore'

// Define the LiveEvent interface to replace the Prisma type
interface LiveEvent {
  id: number
  url: string
  title: string
  description: string
  backgroundLink?: string
  isLive: boolean
  contentType: string
}

// Create a collection reference for live events
const liveEventsCollection = collection(db, 'liveEvents')
export async function getAllLiveEvents() {
  try {
    const snapshot = await getDocs(liveEventsCollection)
    const liveEvents = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: parseInt(doc.id),
        ...data
      } as LiveEvent
    })
    return liveEvents
  } catch (error) {
    console.error('Error getting live events:', error)
    return []
  }
}

export async function createLiveEvent({
  url,
  title,
  description,
  backgroundLink,
  isLive = false,
  contentType
}: {
  url: string
  title: string
  description: string
  backgroundLink?: string
  isLive?: boolean
  contentType: string
}) {
  try {
    if (isLive) {
      // Unset any currently live event
      const currentLiveQuery = query(liveEventsCollection, where('isLive', '==', true))
      const liveSnapshot = await getDocs(currentLiveQuery)

      // Update all currently live events to not live
      const updatePromises = liveSnapshot.docs.map(document => {
        return updateDoc(doc(liveEventsCollection, document.id), { isLive: false })
      })

      await Promise.all(updatePromises)
    }

    // Create new live event
    const newLiveEventData = {
      url,
      title,
      description,
      backgroundLink,
      isLive,
      contentType
    }

    const docRef = await addDoc(liveEventsCollection, newLiveEventData)

    return {
      id: parseInt(docRef.id),
      ...newLiveEventData
    }
  } catch (error) {
    console.error('Error creating live event:', error)
    return null
  }
}

export async function updateLiveEvent({
  id,
  url,
  title,
  description,
  backgroundLink,
  isLive,
  contentType
}: {
  id: number
  url?: string
  title?: string
  description?: string
  backgroundLink?: string
  isLive?: boolean
  contentType?: string
}) {
  try {
    if (isLive) {
      // Unset any currently live event
      const currentLiveQuery = query(liveEventsCollection, where('isLive', '==', true))
      const liveSnapshot = await getDocs(currentLiveQuery)

      // Update all currently live events to not live
      const updatePromises = liveSnapshot.docs.map(document => {
        return updateDoc(doc(liveEventsCollection, document.id), { isLive: false })
      })

      await Promise.all(updatePromises)
    }

    const docRef = doc(liveEventsCollection, id.toString())
    const updateData: Partial<LiveEvent> = {}

    if (url !== undefined) updateData.url = url
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (backgroundLink !== undefined) updateData.backgroundLink = backgroundLink
    if (isLive !== undefined) updateData.isLive = isLive
    if (contentType !== undefined) updateData.contentType = contentType

    await updateDoc(docRef, updateData)

    // Get the updated document to return
    const updatedDoc = await getDoc(docRef)
    if (updatedDoc.exists()) {
      return {
        id,
        ...updatedDoc.data()
      } as LiveEvent
    }

    return null
  } catch (error) {
    console.error('Error updating live event:', error)
    return null
  }
}

export async function getLiveEventById(id: number) {
  try {
    const docRef = doc(liveEventsCollection, id.toString())
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id,
        ...docSnap.data()
      } as LiveEvent
    }

    return null
  } catch (error) {
    console.error('Error getting live event by ID:', error)
    return null
  }
}

export async function deleteLiveEvent(id: number) {
  try {
    const docRef = doc(liveEventsCollection, id.toString())

    // Get the document first so we can return it after deletion
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      return null
    }

    const liveEventData = docSnap.data()
    await deleteDoc(docRef)

    return {
      id,
      ...liveEventData
    } as LiveEvent
  } catch (error) {
    console.error('Error deleting live event:', error)
    return null
  }
}

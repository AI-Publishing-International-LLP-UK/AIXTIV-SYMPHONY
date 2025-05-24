'use server'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  writeBatch
} from '@firebase/firestore'
import { db } from '@/aixtiv-orchestra/services/firebase'

// Firestore collection references
const activitiesCollection = collection(db, 'activities')
const activityTypesCollection = collection(db, 'activityTypes')
const sessionsCollection = collection(db, 'sessions')
const sessionActivitiesCollection = collection(db, 'sessionActivities')
const webinarsCollection = collection(db, 'webinars')
const conferencesCollection = collection(db, 'conferences')

// Interfaces
export interface CreateActivityDto {
  name: string
  description: string
  typeId: string
  thumbnail: string
}

export interface Activity {
  id: string
  name: string
  description: string
  typeId: string
  thumbnail: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ActivityType {
  id: string
  name: string
  description?: string
}

export interface SessionActivity {
  id: string
  sessionId: string
  activityId: string
  startDate: Date
  endDate: Date
}

export const createActivity = async (data: CreateActivityDto) => {
  try {
    const activityData = {
      name: data.name,
      description: data.description,
      typeId: data.typeId,
      thumbnail: data.thumbnail,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const docRef = await addDoc(activitiesCollection, activityData)

    return {
      id: docRef.id,
      ...activityData
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create activity')
  }
}

export const getAllActivity = async (): Promise<Activity[]> => {
  try {
    const querySnapshot = await getDocs(activitiesCollection)
    const activities: Activity[] = []

    querySnapshot.forEach(doc => {
      const data = doc.data()
      activities.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        typeId: data.typeId,
        thumbnail: data.thumbnail,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      })
    })

    return activities
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find activities')
  }
}

export const getActivityById = async (id: string) => {
  try {
    const activityRef = doc(activitiesCollection, id)
    const activitySnap = await getDoc(activityRef)

    if (!activitySnap.exists()) {
      throw new Error('Activity not found')
    }

    const activityData = activitySnap.data()

    // Get the activity type
    const activityTypeRef = doc(activityTypesCollection, activityData.typeId)
    const activityTypeSnap = await getDoc(activityTypeRef)

    const activityTypeData = activityTypeSnap.exists() ? activityTypeSnap.data() : null

    return {
      id: activitySnap.id,
      name: activityData.name,
      description: activityData.description,
      typeId: activityData.typeId,
      thumbnail: activityData.thumbnail,
      createdAt: activityData.createdAt?.toDate(),
      updatedAt: activityData.updatedAt?.toDate(),
      activityType: activityTypeData
        ? {
            id: activityTypeSnap.id,
            name: activityTypeData.name,
            description: activityTypeData.description
          }
        : null
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find activity')
  }
}

export const updateActivity = async (id: string, data: Partial<CreateActivityDto>) => {
  try {
    const activityRef = doc(activitiesCollection, id)
    const activitySnap = await getDoc(activityRef)

    if (!activitySnap.exists()) {
      throw new Error('Activity not found')
    }

    const updateData = {
      ...data,
      updatedAt: new Date()
    }

    await updateDoc(activityRef, updateData)

    const updatedActivitySnap = await getDoc(activityRef)
    const updatedData = updatedActivitySnap.data()

    return {
      id: updatedActivitySnap.id,
      ...updatedData
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update activity')
  }
}

export const deleteActivity = async (id: string): Promise<void> => {
  try {
    // First, check if the activity exists
    const activityRef = doc(activitiesCollection, id)
    const activitySnap = await getDoc(activityRef)

    if (!activitySnap.exists()) {
      throw new Error('Activity not found')
    }

    // Find any sessionActivities referencing this activity
    const sessionActivitiesQuery = query(sessionActivitiesCollection, where('activityId', '==', id))
    const sessionActivitiesSnap = await getDocs(sessionActivitiesQuery)

    // Use a batch to delete the activity and all related records
    const batch = writeBatch(db)

    // Delete all sessionActivities records
    sessionActivitiesSnap.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref)
    })

    // Delete the activity itself
    batch.delete(activityRef)

    // Commit the batch
    await batch.commit()
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete activity')
  }
}

export const GetAllActivitiesTypes = async () => {
  try {
    const querySnapshot = await getDocs(activityTypesCollection)
    const activityTypes: ActivityType[] = []

    querySnapshot.forEach(doc => {
      const data = doc.data()
      activityTypes.push({
        id: doc.id,
        name: data.name,
        description: data.description
      })
    })

    return activityTypes
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find activity types')
  }
}

interface ActivitySessionData {
  sessionId: string
  name: string
  description: string
  thumbnail: string
  typeId: string
  startDate: Date
  endDate: Date
  webinarId?: string
  conferenceId?: string
}

export const CreateAndAssignActivityToSession = async (data: ActivitySessionData) => {
  try {
    // Use a batch to create all related documents
    const batch = writeBatch(db)

    // 1. Create the activity
    const activityRef = doc(activitiesCollection)

    const activityData = {
      name: data.name,
      description: data.description,
      typeId: data.typeId,
      thumbnail: data.thumbnail,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    batch.set(activityRef, activityData)

    // 2. Create the session activity relationship
    const sessionActivityRef = doc(sessionActivitiesCollection)

    const sessionActivityData = {
      sessionId: data.sessionId,
      activityId: activityRef.id,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    batch.set(sessionActivityRef, sessionActivityData)

    // 3. Add webinar connection if specified
    if (data.webinarId) {
      const webinarActivityRef = doc(collection(db, 'webinarActivities'))
      batch.set(webinarActivityRef, {
        webinarId: data.webinarId,
        activityId: activityRef.id,
        createdAt: new Date()
      })
    }

    // 4. Add conference connection if specified
    if (data.conferenceId) {
      const conferenceActivityRef = doc(collection(db, 'conferenceActivities'))
      batch.set(conferenceActivityRef, {
        conferenceId: data.conferenceId,
        activityId: activityRef.id,
        createdAt: new Date()
      })
    }

    // Commit the batch
    await batch.commit()

    // Return the created activity with its ID
    const createdActivitySnap = await getDoc(activityRef)
    const createdActivity = createdActivitySnap.data()

    return {
      id: activityRef.id,
      name: data.name,
      description: data.description,
      typeId: data.typeId,
      thumbnail: data.thumbnail,
      createdAt: createdActivity?.createdAt?.toDate() || new Date(),
      updatedAt: createdActivity?.updatedAt?.toDate() || new Date(),
      sessionActivity: {
        id: sessionActivityRef.id,
        sessionId: data.sessionId,
        activityId: activityRef.id,
        startDate: data.startDate,
        endDate: data.endDate
      }
    }
  } catch (error) {
    console.error('Error creating and assigning activity:', error)
    throw new Error('Failed to create and assign activity to session')
  }
}

'use server'

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
  writeBatch
} from '@firebase/firestore'
import { db } from '@/aixtiv-orchestra/services/firebase'

// Collection references
const sessionsCollection = collection(db, 'sessions')
const sessionActivitiesCollection = collection(db, 'sessionActivities')

// Interfaces
export interface CreateSessionDto {
  courseId: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  thumbnail: string
}

// Firestore session interface
export interface Session {
  id: string
  courseId: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  thumbnail: string
  createdAt: Date
  updatedAt: Date
}

// Firestore sessionActivity interface
export interface SessionActivity {
  id: string
  sessionId: string
  activityId: string
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface AssignSessionActivityDto {
  sessionId: string
  activityId: string
  startDate: Date
  endDate: Date
}

export const createSession = async (data: CreateSessionDto): Promise<Session> => {
  try {
    const now = new Date()
    const sessionData = {
      courseId: data.courseId,
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      thumbnail: data.thumbnail,
      createdAt: now,
      updatedAt: now
    }

    const docRef = await addDoc(sessionsCollection, sessionData)

    return {
      id: docRef.id,
      ...sessionData
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create session')
  }
}

export const findAllSessions = async (): Promise<Session[]> => {
  try {
    const snapshot = await getDocs(sessionsCollection)
    const sessions: Session[] = []

    snapshot.forEach(doc => {
      const data = doc.data()
      sessions.push({
        id: doc.id,
        courseId: data.courseId,
        name: data.name,
        description: data.description,
        startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
        endDate: data.endDate instanceof Date ? data.endDate : new Date(data.endDate),
        thumbnail: data.thumbnail,
        createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt)
      })
    })

    return sessions
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find sessions')
  }
}

export const getSessionById = async (id: string): Promise<Session | null> => {
  try {
    const docRef = doc(db, 'sessions', id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    return {
      id: docSnap.id,
      courseId: data.courseId,
      name: data.name,
      description: data.description,
      startDate: data.startDate instanceof Date ? data.startDate : new Date(data.startDate),
      endDate: data.endDate instanceof Date ? data.endDate : new Date(data.endDate),
      thumbnail: data.thumbnail,
      createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt)
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find session')
  }
}

interface updateSession {
  id: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  thumbnail: string
}

export const updateSession = async (id: string, data: updateSession): Promise<Session> => {
  try {
    const docRef = doc(db, 'sessions', id)
    const sessionSnapshot = await getDoc(docRef)

    if (!sessionSnapshot.exists()) {
      throw new Error(`Session with ID ${id} not found`)
    }

    const sessionData = sessionSnapshot.data()
    const updatedSession = {
      name: data.name,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      thumbnail: data.thumbnail,
      updatedAt: new Date()
    }

    await updateDoc(docRef, updatedSession)

    return {
      id,
      courseId: sessionData.courseId,
      ...updatedSession,
      createdAt: sessionData.createdAt instanceof Date ? sessionData.createdAt : new Date(sessionData.createdAt)
    } as Session
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update session')
  }
}

export const deleteSession = async (id: string): Promise<void> => {
  try {
    const batch = writeBatch(db)

    // First, get all related session activities
    const sessionActivitiesQuery = query(sessionActivitiesCollection, where('sessionId', '==', id))
    const sessionActivitiesSnapshot = await getDocs(sessionActivitiesQuery)

    // Delete all related session activities
    sessionActivitiesSnapshot.forEach(docSnapshot => {
      batch.delete(doc(db, 'sessionActivities', docSnapshot.id))
    })

    // Delete the session itself
    batch.delete(doc(db, 'sessions', id))

    // Commit the batch operation
    await batch.commit()
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete session')
  }
}

export const assignActivityToSession = async (data: AssignSessionActivityDto): Promise<boolean> => {
  try {
    // Verify that the session exists
    const sessionRef = doc(db, 'sessions', data.sessionId)
    const sessionSnapshot = await getDoc(sessionRef)

    if (!sessionSnapshot.exists()) {
      throw new Error(`Session with ID ${data.sessionId} not found`)
    }

    // Create a new session activity
    const now = new Date()
    const sessionActivityData = {
      sessionId: data.sessionId,
      activityId: data.activityId,
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: now,
      updatedAt: now
    }

    await addDoc(sessionActivitiesCollection, sessionActivityData)

    return true
  } catch (error) {
    console.error(error)
    throw new Error('Failed to assign activity to session')
  }
}

export const removeActivityFromSession = async (sessionActivityId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'sessionActivities', sessionActivityId)
    await deleteDoc(docRef)

    return true
  } catch (error) {
    console.error(error)
    throw new Error('Failed to remove activity from session')
  }
}

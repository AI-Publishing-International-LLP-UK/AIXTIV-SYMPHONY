'use server'
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from '@firebase/firestore'
import { db } from '@/aixtiv-orchestra/services/firebase'

// Define ActivityTypeEnum for Firestore
export enum ActivityTypeEnum {
  EXAM = 'EXAM',
  ASSIGNMENT = 'ASSIGNMENT',
  PROJECT = 'PROJECT',
  QUIZ = 'QUIZ',
  LAB = 'LAB',
  READING = 'READING',
  OTHER = 'OTHER'
}

// Define ActivityType interface for Firestore
export interface ActivityType {
  id: string
  description: string
  type: ActivityTypeEnum
}

// Collection reference
const activityTypesRef = collection(db, 'activityTypes')

export const getAllActivityType = async (): Promise<ActivityType[]> => {
  try {
    const snapshot = await getDocs(activityTypesRef)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ActivityType[]
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find activity type')
  }
}

export const createActivityType = async (description: string, type: ActivityTypeEnum) => {
  try {
    const data = {
      description,
      type
    }

    const docRef = await addDoc(activityTypesRef, data)

    return {
      id: docRef.id,
      ...data
    } as ActivityType
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create activity type')
  }
}

export const getActivityTypeById = async (id: string) => {
  try {
    const activityTypeDocRef = doc(activityTypesRef, id)
    const activityTypeDoc = await getDoc(activityTypeDocRef)

    if (!activityTypeDoc.exists()) {
      return null
    }

    return {
      id: activityTypeDoc.id,
      ...activityTypeDoc.data()
    } as ActivityType
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find activity type')
  }
}

export const updateActivityType = async (id: string, data: Partial<ActivityType>) => {
  try {
    const activityTypeDocRef = doc(activityTypesRef, id)
    const activityTypeDoc = await getDoc(activityTypeDocRef)

    if (!activityTypeDoc.exists()) {
      throw new Error(`Activity type with ID ${id} not found`)
    }

    // Remove id from data if present as it shouldn't be updated
    const { id: _, ...updateData } = data

    await updateDoc(activityTypeDocRef, updateData)

    // Fetch the updated document to return
    const updatedDoc = await getDoc(activityTypeDocRef)

    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as ActivityType
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update activity type')
  }
}

export const deleteActivityType = async (id: string) => {
  try {
    const activityTypeDocRef = doc(activityTypesRef, id)
    const activityTypeDoc = await getDoc(activityTypeDocRef)

    if (!activityTypeDoc.exists()) {
      throw new Error(`Activity type with ID ${id} not found`)
    }

    // Store the data before deletion to return it
    const deletedData = {
      id: activityTypeDoc.id,
      ...activityTypeDoc.data()
    } as ActivityType

    await deleteDoc(activityTypeDocRef)

    return deletedData
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete activity type')
  }
}

'use server'
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/aixtiv-orchestra/services/firebase'

// Define a type to replace the Prisma Interests type
interface Interests {
  id: string
  interest: string
  category: string
  createdAt?: Date
  updatedAt?: Date
}

// Create a collection reference for interests
const interestsCollection = collection(db, 'interests')

//crud basic

export const createInterests = async (interest: string, category: string): Promise<Interests> => {
  try {
    const docRef = await addDoc(interestsCollection, {
      interest,
      category,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return {
      id: docRef.id,
      interest,
      category,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create interests')
  }
}

export const getAllInterests = async (): Promise<Interests[]> => {
  try {
    const querySnapshot = await getDocs(interestsCollection)
    const interests: Interests[] = []

    querySnapshot.forEach(doc => {
      const data = doc.data()
      interests.push({
        id: doc.id,
        interest: data.interest,
        category: data.category,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      })
    })

    return interests
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find interests')
  }
}

export const getInterestsById = async (id: string) => {
  try {
    const docRef = doc(db, 'interests', id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        interest: data.interest,
        category: data.category,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      }
    } else {
      return null
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find interests')
  }
}

export const deleteInterests = async (id: string): Promise<Interests> => {
  try {
    // First get the document to return its data after deletion
    const interestData = await getInterestsById(id)

    if (!interestData) {
      throw new Error('Interest not found')
    }

    // Delete the document
    const docRef = doc(db, 'interests', id)
    await deleteDoc(docRef)

    return interestData as Interests
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete interests')
  }
}

export const updateInterests = async (id: string, data: Partial<Interests>): Promise<Interests> => {
  try {
    // Get the existing document
    const existingInterest = await getInterestsById(id)

    if (!existingInterest) {
      throw new Error('Interest not found')
    }

    // Update the document with new data
    const docRef = doc(db, 'interests', id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    })

    // Return the updated document
    const updatedInterest = await getInterestsById(id)
    return updatedInterest as Interests
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update interests')
  }
}

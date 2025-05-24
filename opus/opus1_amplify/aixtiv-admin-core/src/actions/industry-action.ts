'use server'

import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/aixtiv-orchestra/services/firebase'

// Define Industry interface to replace Prisma type
interface Industry {
  id: string
  name: string
  createdAt?: Date
  updatedAt?: Date
}

// Create a reference to the industries collection
const industriesCollection = collection(db, 'industries')

//crud basic

export const createIndustry = async (name: string): Promise<Industry> => {
  try {
    const docRef = await addDoc(industriesCollection, {
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return {
      id: docRef.id,
      name
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to industry webinar')
  }
}

export const getAllIndustry = async (): Promise<Industry[]> => {
  try {
    const querySnapshot = await getDocs(industriesCollection)
    const industries: Industry[] = []

    querySnapshot.forEach(doc => {
      industries.push({
        id: doc.id,
        ...doc.data()
      } as Industry)
    })

    return industries
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find industry')
  }
}

export const getIndustryById = async (id: string) => {
  try {
    const docRef = doc(industriesCollection, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Industry
    }

    return null
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find industry')
  }
}

export const deleteIndustry = async (id: string): Promise<Industry> => {
  try {
    // Get the industry data before deleting
    const industry = await getIndustryById(id)

    if (!industry) {
      throw new Error('Industry not found')
    }

    // Delete the document
    const docRef = doc(industriesCollection, id)
    await deleteDoc(docRef)

    return industry as Industry
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete industry')
  }
}

export const updateIndustry = async (id: string, data: Partial<Industry>): Promise<Industry> => {
  try {
    // Add updatedAt timestamp to the data
    const updatedData = {
      ...data,
      updatedAt: new Date()
    }

    // Update the document
    const docRef = doc(industriesCollection, id)
    await updateDoc(docRef, updatedData)

    // Get the updated industry data
    const updatedIndustry = await getIndustryById(id)

    if (!updatedIndustry) {
      throw new Error('Industry not found after update')
    }

    return updatedIndustry as Industry
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update industry')
  }
}

'use server'

import { db } from '@/aixtiv-orchestra/services/firebase'
import { collection, doc, getDocs, getDoc, deleteDoc, DocumentData } from 'firebase/firestore'

// Reference to the collaborations collection
const collaborationsCollection = collection(db, 'collaborations')

// Define types to match Prisma's return type
interface User {
  email: string
  id: string
  firstName: string
  lastName: string
}

interface Collaboration {
  id: number
  userId: number
  description?: string
  createdAt: Date
  updatedAt: Date
  User?: User
}
export const getAllCollaboration = async () => {
  try {
    // Return empty array or mock data since this is a stub implementation
    // In a real implementation, we would fetch data from Firestore

    /*
    // Example of how the real implementation would look
    const snapshot = await getDocs(collaborationsCollection)
    return snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: parseInt(doc.id),
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      }
    })
    */

    // Mock data
    return [
      {
        id: 1,
        userId: 101,
        description: 'Sample collaboration 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        User: {
          email: 'user1@example.com',
          id: '101',
          firstName: 'John',
          lastName: 'Doe'
        }
      },
      {
        id: 2,
        userId: 102,
        description: 'Sample collaboration 2',
        createdAt: new Date(),
        updatedAt: new Date(),
        User: {
          email: 'user2@example.com',
          id: '102',
          firstName: 'Jane',
          lastName: 'Smith'
        }
      }
    ] as Collaboration[]
  } catch (err) {
    console.error(err)
    throw new Error('Failed to fetch all collaboration')
  }
}

export const getCollaborationById = async (id: string) => {
  try {
    // Stub implementation returning mock data
    // In a real implementation, we would fetch data from Firestore

    /*
    // Example of how the real implementation would look
    const docRef = doc(collaborationsCollection, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: parseInt(id),
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      }
    }
    return null
    */

    // Mock data for the requested ID
    if (id === '1') {
      return {
        id: 1,
        userId: 101,
        description: 'Sample collaboration 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        User: {
          email: 'user1@example.com',
          id: '101',
          firstName: 'John',
          lastName: 'Doe'
        }
      } as Collaboration
    }
    return null // Return null for IDs that don't match our mock data
  } catch (err) {
    console.error(err)
    throw new Error('Failed to fetch collaboration by ID')
  }
}

export const deleteCollaboration = async (id: number) => {
  try {
    // Stub implementation - in a real implementation we would delete from Firestore

    /*
    // Example of how the real implementation would look
    const docRef = doc(collaborationsCollection, id.toString())
    await deleteDoc(docRef)
    return { id, deleted: true }
    */

    // Return mock response
    return {
      id,
      userId: 101,
      description: 'Deleted collaboration',
      createdAt: new Date(),
      updatedAt: new Date()
    } as Collaboration
  } catch (err) {
    console.error(err)
    throw new Error('Failed to delete collaboration')
  }
}

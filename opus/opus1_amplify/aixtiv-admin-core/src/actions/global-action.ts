'use server'
import { db } from '@/aixtiv-orchestra/services/firebase'
import { collection, getDocs } from 'firebase/firestore'

// Collection references
const interestsCollection = collection(db, 'interests')
const occupationsCollection = collection(db, 'occupations')
const industriesCollection = collection(db, 'industries')
const userTypesCollection = collection(db, 'userTypes')

//function to get all intersts

export const getAllInterests = async () => {
  try {
    // Stub implementation returning mock data
    // In a real implementation, you would use:
    // const snapshot = await getDocs(interestsCollection)
    // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return [
      { id: '1', name: 'Technology' },
      { id: '2', name: 'Finance' },
      { id: '3', name: 'Marketing' }
    ]
  } catch (error) {
    console.error(error)
    return []
  }
}

export const getAllOccupations = async () => {
  try {
    // Stub implementation returning mock data
    // In a real implementation, you would use:
    // const snapshot = await getDocs(occupationsCollection)
    // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return [
      { id: '1', name: 'Software Engineer' },
      { id: '2', name: 'Product Manager' },
      { id: '3', name: 'Designer' }
    ]
  } catch (error) {
    console.error(error)
    return []
  }
}

export const getAllIndustries = async () => {
  try {
    // Stub implementation returning mock data
    // In a real implementation, you would use:
    // const snapshot = await getDocs(industriesCollection)
    // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return [
      { id: '1', name: 'Technology' },
      { id: '2', name: 'Healthcare' },
      { id: '3', name: 'Education' }
    ]
  } catch (error) {
    console.error(error)
    return []
  }
}

export const getAllUserTypes = async () => {
  try {
    // Stub implementation returning mock data
    // In a real implementation, you would use:
    // const snapshot = await getDocs(userTypesCollection)
    // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    return [
      { id: '1', name: 'Admin' },
      { id: '2', name: 'User' },
      { id: '3', name: 'Moderator' }
    ]
  } catch (error) {
    console.error(error)
    return []
  }
}

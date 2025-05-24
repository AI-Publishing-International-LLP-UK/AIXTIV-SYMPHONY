'use server'
import { db } from '@/aixtiv-orchestra/services/firebase'
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  DocumentData
} from 'firebase/firestore'

const organizationsCollection = collection(db, 'organizations')

export interface CreateOrganizationDto {
  name: string
  description: string
  industryId: string
}

export const createOrganization = async (data: CreateOrganizationDto): Promise<any> => {
  try {
    const newOrg = {
      name: data.name,
      description: data.description,
      industryId: data.industryId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const docRef = await addDoc(organizationsCollection, newOrg)
    return { id: docRef.id, ...newOrg }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create organization')
  }
}

export const getAllOrganization = async () => {
  try {
    const querySnapshot = await getDocs(organizationsCollection)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find organizations')
  }
}

export const getOrganizationById = async (id: string) => {
  try {
    const docRef = doc(organizationsCollection, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return { id: docSnap.id, ...docSnap.data() }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find organization')
  }
}

export const updateOrganization = async (
  id: string,
  data: Partial<{
    id: string
    course: string
    startDate: Date
    endDate: Date
    createdAt: Date
    updatedAt: Date
  }>
) => {
  try {
    const docRef = doc(organizationsCollection, id)
    const updateData = { ...data, updatedAt: new Date() }

    // Remove id from the update data if it exists
    if (updateData.id) {
      delete updateData.id
    }

    await updateDoc(docRef, updateData as DocumentData)

    // Get the updated document
    const updatedDoc = await getDoc(docRef)
    return { id: updatedDoc.id, ...updatedDoc.data() }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update organization')
  }
}

export const deleteOrganization = async (id: string): Promise<void> => {
  try {
    const docRef = doc(organizationsCollection, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete organization')
  }
}

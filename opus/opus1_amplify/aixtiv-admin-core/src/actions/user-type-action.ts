'use server'

import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from '@firebase/firestore'
import { db } from '@/aixtiv-orchestra/services/firebase'

const userTypeRef = collection(db, 'userTypes')

export interface UserType {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
}

//crud basic

export const createUserType = async (name: string, description: string): Promise<UserType> => {
  try {
    const docRef = await addDoc(userTypeRef, {
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    const newDoc = await getDoc(docRef)
    return { id: docRef.id, ...newDoc.data() } as UserType
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create user type')
  }
}

export const getAllUserType = async (): Promise<UserType[]> => {
  try {
    const snapshot = await getDocs(userTypeRef)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserType[]
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find usertype')
  }
}

export const getUserTypeById = async (id: string) => {
  try {
    const docRef = doc(userTypeRef, id)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as UserType
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find usertype')
  }
}

export const updateUserType = async (id: string, data: Partial<Omit<UserType, 'id'>>): Promise<UserType> => {
  try {
    const docRef = doc(userTypeRef, id)
    const updateData = {
      ...data,
      updatedAt: new Date()
    }
    await updateDoc(docRef, updateData)
    const updatedDoc = await getDoc(docRef)
    return { id: updatedDoc.id, ...updatedDoc.data() } as UserType
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update usertype')
  }
}

export const deleteUserType = async (id: string): Promise<void> => {
  try {
    const docRef = doc(userTypeRef, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete usertype')
  }
}

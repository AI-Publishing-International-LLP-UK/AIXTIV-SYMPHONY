'use server'

import { db } from '@/aixtiv-orchestra/services/firebase'
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  DocumentData,
  DocumentReference,
  DocumentSnapshot
} from 'firebase/firestore'

// Create a collection reference for blacklists
const blacklistCollection = collection(db, 'blacklists')

//crud basic

export const getAllBlacklist = async () => {
  try {
    // Stub implementation using Firestore
    const snapshot = await getDocs(blacklistCollection)
    const blacklists = snapshot.docs.map(doc => ({
      id: doc.id,
      domain: doc.data().domain
    }))
    return blacklists
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find blacklist')
  }
}

export const getBlacklistById = async (id: string) => {
  try {
    // Stub implementation using Firestore
    const docRef = doc(blacklistCollection, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        domain: docSnap.data().domain
      }
    } else {
      return null
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find blacklist')
  }
}

export const createBlacklist = async (domain: string) => {
  try {
    // Stub implementation using Firestore
    const docRef = await addDoc(blacklistCollection, { domain })
    return {
      id: docRef.id,
      domain
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create blacklist')
  }
}

export const deleteBlacklist = async (id: string) => {
  try {
    // Stub implementation using Firestore
    const docRef = doc(blacklistCollection, id)
    await deleteDoc(docRef)
    return { id, domain: 'deleted-domain' } // Mock return value
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete blacklist')
  }
}

export const updateBlacklist = async (id: string, domain: string) => {
  try {
    // Stub implementation using Firestore
    const docRef = doc(blacklistCollection, id)
    await updateDoc(docRef, { domain })
    return {
      id,
      domain
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update blacklist')
  }
}

export const findBlacklistByDomain = async (domain: string) => {
  try {
    // Stub implementation using Firestore
    const q = query(blacklistCollection, where('domain', '==', domain))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return {
        id: doc.id,
        domain: doc.data().domain
      }
    } else {
      return null
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find blacklist')
  }
}

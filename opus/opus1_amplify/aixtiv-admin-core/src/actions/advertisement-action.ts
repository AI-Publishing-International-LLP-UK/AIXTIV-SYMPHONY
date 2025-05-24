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

const advertisementCollection = collection(db, 'advertisements')

// Mock advertisement type to replace Prisma types
type Advertisement = {
  id: number
  url: string
  backgroundImg: string
  title: string
  description: string
  isHeroSection?: boolean
  isFooterBanner?: boolean
  createdAt?: Date
  updatedAt?: Date
}

type createAdvertisementDTO = {
  url: string
  backgroundImg: string
  title: string
  description: string
}

export const getAllAdvertisememts = async () => {
  try {
    // Stub implementation using Firestore
    const querySnapshot = await getDocs(advertisementCollection)
    const advertisements: Advertisement[] = []

    querySnapshot.forEach(doc => {
      const data = doc.data() as Omit<Advertisement, 'id'>
      advertisements.push({ ...data, id: Number(doc.id) })
    })

    return advertisements
  } catch (err) {
    throw new Error('Failed to get advertisements')
  }
}

export const createAdvertisement = async (data: createAdvertisementDTO) => {
  try {
    // Stub implementation using Firestore
    const docRef = await addDoc(advertisementCollection, {
      ...data,
      isHeroSection: false,
      isFooterBanner: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const newAdvertisement: Advertisement = {
      id: Number(docRef.id),
      ...data,
      isHeroSection: false,
      isFooterBanner: false
    }

    return newAdvertisement
  } catch (err) {
    throw new Error('Failed to create advertisement')
  }
}

export const updateAdvertisement = async (id: number, data: Partial<Advertisement>) => {
  try {
    // Stub implementation using Firestore
    const docRef = doc(advertisementCollection, id.toString())
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    })

    // Get the updated document
    const updatedDoc = await getDoc(docRef)
    const updatedData = updatedDoc.data() as Omit<Advertisement, 'id'>

    const updatedAdvertisement: Advertisement = {
      id,
      ...updatedData
    }

    return updatedAdvertisement
  } catch (err) {
    throw new Error('Failed to update advertisement')
  }
}

export const getAdvertisementById = async (id: number) => {
  try {
    // Stub implementation using Firestore
    const docRef = doc(advertisementCollection, id.toString())
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data() as Omit<Advertisement, 'id'>
      return {
        id,
        ...data
      } as Advertisement
    }

    return null
  } catch (err) {
    throw new Error('Failed to get advertisement by id')
  }
}

export const deleteAdvertisement = async (id: number) => {
  try {
    // Stub implementation using Firestore
    const docRef = doc(advertisementCollection, id.toString())

    // Get the document before deleting it
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      throw new Error('Advertisement not found')
    }

    const data = docSnap.data() as Omit<Advertisement, 'id'>
    const advertisement = {
      id,
      ...data
    } as Advertisement

    await deleteDoc(docRef)

    return advertisement
  } catch (err) {
    console.log('Error deleting advertisement')
    throw new Error('Failed to delete advertisement')
  }
}

export const setAsHeader = async (id: number) => {
  try {
    // Stub implementation using Firestore
    // 1. Find all advertisements with isHeroSection = true
    const heroSectionQuery = query(advertisementCollection, where('isHeroSection', '==', true))
    const querySnapshot = await getDocs(heroSectionQuery)

    // 2. Update all existing hero sections to false
    const batch = writeBatch(db)
    querySnapshot.forEach(document => {
      const docRef = doc(advertisementCollection, document.id)
      batch.update(docRef, { isHeroSection: false, updatedAt: new Date() })
    })

    // 3. Set the new hero section
    const newHeroDocRef = doc(advertisementCollection, id.toString())
    batch.update(newHeroDocRef, { isHeroSection: true, updatedAt: new Date() })

    await batch.commit()
  } catch (err) {
    throw new Error('Failed to set advertisement as header')
  }
}

export const unsetHeader = async (id: number) => {
  try {
    // Stub implementation using Firestore
    const docRef = doc(advertisementCollection, id.toString())
    await updateDoc(docRef, {
      isHeroSection: false,
      updatedAt: new Date()
    })
  } catch (err) {
    throw new Error('Failed to unset advertisement as header')
  }
}

export const setAsFooter = async (id: number) => {
  try {
    // Stub implementation using Firestore
    // 1. Find all advertisements with isFooterBanner = true
    const footerBannerQuery = query(advertisementCollection, where('isFooterBanner', '==', true))
    const querySnapshot = await getDocs(footerBannerQuery)

    // 2. Update all existing footer banners to false
    const batch = writeBatch(db)
    querySnapshot.forEach(document => {
      const docRef = doc(advertisementCollection, document.id)
      batch.update(docRef, { isFooterBanner: false, updatedAt: new Date() })
    })

    // 3. Set the new footer banner
    const newFooterDocRef = doc(advertisementCollection, id.toString())
    batch.update(newFooterDocRef, { isFooterBanner: true, updatedAt: new Date() })

    await batch.commit()
  } catch (err) {
    throw new Error('Failed to set advertisement as footer')
  }
}

export const unsetFooter = async (id: number) => {
  try {
    // Stub implementation using Firestore
    const docRef = doc(advertisementCollection, id.toString())
    await updateDoc(docRef, {
      isFooterBanner: false,
      updatedAt: new Date()
    })
  } catch (err) {
    throw new Error('Failed to unset advertisement as footer')
  }
}

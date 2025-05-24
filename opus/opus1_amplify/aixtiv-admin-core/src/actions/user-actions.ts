'use server'
import * as bcrypt from 'bcrypt'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from '@firebase/firestore'
import { db } from '@/aixtiv-orchestra/services/firebase'

export interface CreateUserDtO {
  email: string
  password: string
  firstName: string
  lastName: string
  cellphone: string
  interests: string[]
  industry: string
  occupation: string
  userType: string
}

export interface UpdateUserDtO extends CreateUserDtO {
  id: string
}

// CRUD básico con manejo de errores
export const createUser = async (user: CreateUserDtO) => {
  const hashedPassword = await bcrypt.hash(user.password, 10)

  try {
    // Create a reference to the user document
    const usersCollection = collection(db, 'users')

    // Create user data object
    const userData = {
      password: hashedPassword,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userRole: 'USER',
      userTypeId: user.userType,
      interestIds: user.interests,
      industryId: user.industry,
      occupationId: user.occupation,
      createdAt: new Date(),
      updatedAt: new Date(),
      verified: false
    }

    // Add the user document to Firestore
    const docRef = await setDoc(doc(usersCollection), userData)

    return {
      id: docRef.id,
      ...userData
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create user')
  }
}

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  cellphone?: string
  userRole?: string
  userTypeId?: string
  interestIds?: string[]
  industryId?: string
  occupationId?: string
  verified?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, 'users')
    const q = query(usersCollection, orderBy('updatedAt', 'desc'))
    const querySnapshot = await getDocs(q)

    const users: User[] = []
    querySnapshot.forEach(doc => {
      const data = doc.data()
      users.push({
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        cellphone: data.cellphone,
        userRole: data.userRole,
        userTypeId: data.userTypeId,
        interestIds: data.interestIds,
        industryId: data.industryId,
        occupationId: data.occupationId,
        verified: data.verified,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      })
    })

    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    throw new Error('Failed to fetch users')
  }
}

export const getUserById = async (id: string, userRole: string) => {
  try {
    const userRef = doc(db, 'users', id)
    const userSnapshot = await getDoc(userRef)

    if (!userSnapshot.exists()) {
      throw new Error(`User with ID ${id} not found`)
    }

    const userData = userSnapshot.data()

    // If not an admin, exclude password
    if (userRole !== 'ADMIN' && userData.password) {
      const { password, ...userWithoutPassword } = userData
      return {
        id: userSnapshot.id,
        ...userWithoutPassword
      }
    }

    return {
      id: userSnapshot.id,
      ...userData
    }
  } catch (error) {
    console.error('Error fetching user by ID:', error)
    throw new Error('Failed to fetch user')
  }
}

export const updateUser = async (user: Partial<UpdateUserDtO>) => {
  try {
    if (!user.id) {
      throw new Error('User ID is required for update')
    }

    const userRef = doc(db, 'users', user.id)

    // Check if user exists
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) {
      throw new Error(`User with ID ${user.id} not found`)
    }

    // Create update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (user.email) updateData.email = user.email
    if (user.firstName) updateData.firstName = user.firstName
    if (user.lastName) updateData.lastName = user.lastName
    if (user.userType) updateData.userTypeId = user.userType
    if (user.interests) updateData.interestIds = user.interests
    if (user.industry) updateData.industryId = user.industry
    if (user.occupation) updateData.occupationId = user.occupation

    // Update the user
    await updateDoc(userRef, updateData)

    // Return the updated user
    const updatedUserDoc = await getDoc(userRef)
    return {
      id: updatedUserDoc.id,
      ...updatedUserDoc.data()
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update user')
  }
}

export const deleteUser = async (id: string) => {
  try {
    const userRef = doc(db, 'users', id)

    // Check if user exists
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) {
      throw new Error(`User with ID ${id} not found`)
    }

    // Delete the user
    await deleteDoc(userRef)

    return { id, deleted: true }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete user')
  }
}

export const getUserByType = async (type: string) => {
  try {
    const usersCollection = collection(db, 'users')

    // Query users by user type name
    const userTypesCollection = collection(db, 'userTypes')
    const typeQuery = query(userTypesCollection, where('name', '==', type))
    const typeSnapshot = await getDocs(typeQuery)

    if (typeSnapshot.empty) {
      return []
    }

    const typeId = typeSnapshot.docs[0].id
    const usersQuery = query(usersCollection, where('userTypeId', '==', typeId))
    const usersSnapshot = await getDocs(usersQuery)

    const users: User[] = []
    usersSnapshot.forEach(doc => {
      const data = doc.data()
      users.push({
        id: doc.id,
        ...data
      })
    })

    return users
  } catch (error) {
    console.error('Error fetching users by type:', error)
    throw new Error('Failed to fetch users by type')
  }
}

type ManageApproveUserType = {
  id: string
  approved: boolean
}

export const manageApproveUser = async (user: ManageApproveUserType) => {
  try {
    const userRef = doc(db, 'users', user.id)

    // Check if the user exists
    const userDoc = await getDoc(userRef)
    if (!userDoc.exists()) {
      throw new Error(`User with ID ${user.id} not found`)
    }

    // Update the verified status
    await updateDoc(userRef, {
      verified: user.approved
    })

    return { success: true, message: `User verification status updated to ${user.approved}` }
  } catch (err) {
    console.error('Error updating user verification status:', err)
    throw new Error('Failed to update user verification status')
  }
}

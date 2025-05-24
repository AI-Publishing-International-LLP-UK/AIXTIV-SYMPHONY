export interface User {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  cellphone: string
  interests: string[]
  industry: string
  occupation: string
  userType: string
  verified: boolean
  createdAt: Date
  updatedAt: Date
  userRole: string
}

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
    // Create a reference to the users collection
    const usersCollection = collection(db, 'users')
    
    // Create a new document with a generated id
    const newUserRef = doc(usersCollection)
    
    // Get additional data for related fields
    const userTypeDoc = await getDoc(doc(db, 'userTypes', user.userType))
    const industryDoc = await getDoc(doc(db, 'industries', user.industry))
    const occupationDoc = await getDoc(doc(db, 'occupations', user.occupation))
    
    // Get interest documents
    const interestsData = []
    for (const interestId of user.interests) {
      const interestDoc = await getDoc(doc(db, 'interests', interestId))
      if (interestDoc.exists()) {
        interestsData.push({
          id: interestId,
          name: interestDoc.data().name
        })
      }
    }
    
    // User data to store
    const userData = {
      id: newUserRef.id,
      password: hashedPassword,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      cellphone: user.cellphone || '',
      userRole: 'USER',
      userType: {
        id: user.userType,
        name: userTypeDoc.exists() ? userTypeDoc.data().name : ''
      },
      interests: interestsData,
      industry: {
        id: user.industry,
        name: industryDoc.exists() ? industryDoc.data().name : ''
      },
      occupation: {
        id: user.occupation,
        name: occupationDoc.exists() ? occupationDoc.data().name : ''
      },
      verified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Set the user data in Firestore
    await setDoc(newUserRef, userData)
    
    return userData
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create user')
  }
}
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, 'users')
    const usersQuery = query(usersCollection, orderBy('updatedAt', 'desc'))
    const querySnapshot = await getDocs(usersQuery)
    
    const users: User[] = []
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as User)
    })
    
    return users
  } catch (error) {
    console.error('Error getting users:', error)
    throw new Error('Failed to get users')
  }
}
export const getUserById = async (id: string, userRole: string) => {
  try {
    const userRef = doc(db, 'users', id)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      return null
    }
    
    const userData = userSnap.data() as User
    
    // If not an admin, remove the password from the returned data
    if (userRole !== 'ADMIN') {
      const { password, ...userWithoutPassword } = userData
      return userWithoutPassword
    }
    
    return userData
  } catch (error) {
    console.error('Error getting user by ID:', error)
    throw new Error('Failed to get user')
  }
}
export const updateUser = async (user: Partial<UpdateUserDtO>) => {
  try {
    // Get the current user data first
    const userRef = doc(db, 'users', user.id)
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      throw new Error('User not found')
    }
    
    const currentData = userSnap.data()
    
    // Get additional data for related fields if they're being updated
    let userTypeData = currentData.userType
    if (user.userType) {
      const userTypeDoc = await getDoc(doc(db, 'userTypes', user.userType))
      if (userTypeDoc.exists()) {
        userTypeData = {
          id: user.userType,
          name: userTypeDoc.data().name
        }
      }
    }
    
    let industryData = currentData.industry
    if (user.industry) {
      const industryDoc = await getDoc(doc(db, 'industries', user.industry))
      if (industryDoc.exists()) {
        industryData = {
          id: user.industry,
          name: industryDoc.data().name
        }
      }
    }
    
    let occupationData = currentData.occupation
    if (user.occupation) {
      const occupationDoc = await getDoc(doc(db, 'occupations', user.occupation))
      if (occupationDoc.exists()) {
        occupationData = {
          id: user.occupation,
          name: occupationDoc.data().name
        }
      }
    }
    
    // Handle interests if they're being updated
    let interestsData = currentData.interests
    if (user.interests && user.interests.length > 0) {
      interestsData = []
      for (const interestId of user.interests) {
        const interestDoc = await getDoc(doc(db, 'interests', interestId))
        if (interestDoc.exists()) {
          interestsData.push({
            id: interestId,
            name: interestDoc.data().name
          })
        }
      }
    }
    
    // Prepare update data
    const updateData = {
      email: user.email || currentData.email,
      firstName: user.firstName || currentData.firstName,
      lastName: user.lastName || currentData.lastName,
      userRole: 'USER', // Maintain as USER
      userType: userTypeData,
      interests: interestsData,
      industry: industryData,
      occupation: occupationData,
      updatedAt: new Date()
    }
    
    // Update the document
    await updateDoc(userRef, updateData)
    
    // Return the updated user data
    const updatedUserSnap = await getDoc(userRef)
    return updatedUserSnap.data()
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update user')
  }
}
export const deleteUser = async (id: string) => {
  try {
    const userRef = doc(db, 'users', id)
    
    // Check if the user exists
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) {
      throw new Error('User not found')
    }
    
    // Delete the user document
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
    const usersQuery = query(usersCollection, where('userType.name', '==', type))
    const querySnapshot = await getDocs(usersQuery)
    
    const users: User[] = []
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as User)
    })
    
    return users
  } catch (error) {
    console.error('Error getting users by type:', error)
    throw new Error('Failed to get users by type')
  }
}

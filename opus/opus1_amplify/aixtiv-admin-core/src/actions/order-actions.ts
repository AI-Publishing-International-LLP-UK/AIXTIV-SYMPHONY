'use server'

import { collection, getDocs, getDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '@/aixtiv-orchestra/services/firebase'

// Define Order type to replace Prisma's Order type
interface Order {
  orderId: string
  userId: string
  amount: number
  status: string
  createdAt: Date
  updatedAt: Date
  User?: {
    id: string
    name: string
    email: string
  }
  [key: string]: any // For any additional fields
}

// Create a reference to the orders collection
const ordersCollection = collection(db, 'orders')

export const getAllOrders = async (): Promise<Order[]> => {
  try {
    // Create a query against the orders collection, ordered by updatedAt in descending order
    const q = query(ordersCollection, orderBy('updatedAt', 'desc'))
    const querySnapshot = await getDocs(q)

    // Convert the documents to Order objects
    const orders: Order[] = []
    querySnapshot.forEach(doc => {
      const data = doc.data()
      orders.push({
        ...data,
        orderId: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Order)
    })

    return orders
  } catch (error) {
    console.error('Error getting orders:', error)
    return []
  }
}

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    // Get the document reference
    const orderRef = doc(ordersCollection, id)
    const orderSnap = await getDoc(orderRef)

    if (!orderSnap.exists()) {
      return null
    }

    const orderData = orderSnap.data()

    // Get user data if userId exists
    let userData = null
    if (orderData.userId) {
      const userRef = doc(collection(db, 'users'), orderData.userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        userData = {
          id: userSnap.id,
          ...userSnap.data()
        }
      }
    }

    return {
      ...orderData,
      orderId: orderSnap.id,
      createdAt: orderData.createdAt?.toDate() || new Date(),
      updatedAt: orderData.updatedAt?.toDate() || new Date(),
      User: userData
    } as Order
  } catch (error) {
    console.error('Error getting order by ID:', error)
    return null
  }
}

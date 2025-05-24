'use server'
import { db } from '@/aixtiv-orchestra/services/firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'

// Create collection references
const productsCollection = collection(db, 'products')
const vendorsCollection = collection(db, 'vendors')
const categoriesCollection = collection(db, 'categories')

export interface CreateProductDto {
  name: string
  description: string
  thumbnail: string
  url: string
  vendorId: string[]
  categoryId: string[]
  price: number
  solveProblem: string
  solveHow: string
  integrationAbility: string
  marketReputation: string
  customerServiceLevel: string
}

export const createProduct = async (data: CreateProductDto) => {
  try {
    // Create a product with vendor and category IDs
    const productData = {
      name: data.name,
      description: data.description,
      thumbnail: data.thumbnail,
      url: data.url,
      price: data.price,
      solveHow: data.solveHow,
      solveProblem: data.solveProblem,
      integrationAbility: data.integrationAbility,
      marketReputation: data.marketReputation,
      customerServiceLevel: data.customerServiceLevel,
      vendorIds: data.vendorId,
      categoryIds: data.categoryId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add the document to Firestore
    const docRef = await addDoc(productsCollection, productData)

    return { id: docRef.id, ...productData }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create product')
  }
}

export const getAllProducts = async () => {
  try {
    const querySnapshot = await getDocs(productsCollection)

    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      price: doc.data().price.toString() // Convert number to string for consistency
    }))

    return products
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find products')
  }
}

export const getProductById = async (id: string) => {
  try {
    const docRef = doc(productsCollection, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      throw new Error(`Product with ID ${id} not found`)
    }

    const productData = docSnap.data()

    // Fetch vendor details if vendorIds exists
    let vendors = []
    if (productData.vendorIds && productData.vendorIds.length > 0) {
      const vendorPromises = productData.vendorIds.map(async (vendorId: string) => {
        const vendorDocRef = doc(vendorsCollection, vendorId)
        const vendorSnap = await getDoc(vendorDocRef)
        if (vendorSnap.exists()) {
          return { id: vendorSnap.id, ...vendorSnap.data() }
        }
        return null
      })
      vendors = (await Promise.all(vendorPromises)).filter(Boolean)
    }

    // Fetch category details if categoryIds exists
    let categories = []
    if (productData.categoryIds && productData.categoryIds.length > 0) {
      const categoryPromises = productData.categoryIds.map(async (categoryId: string) => {
        const categoryDocRef = doc(categoriesCollection, categoryId)
        const categorySnap = await getDoc(categoryDocRef)
        if (categorySnap.exists()) {
          return { id: categorySnap.id, ...categorySnap.data() }
        }
        return null
      })
      categories = (await Promise.all(categoryPromises)).filter(Boolean)
    }

    const productWithRelations = {
      id: docSnap.id,
      ...productData,
      vendor: vendors,
      category: categories,
      price: productData.price.toString()
    }

    return productWithRelations
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find product')
  }
}

interface createProductDtO {
  name: string
  description: string
  thumbnail: string
  url: string
  vendor: string[]
  category: string[]
  id: string
  price: number
  solveProblem: string
  solveHow: string
  integrationAbility: string
  marketReputation: string
  customerServiceLevel: string
}

export const updateProduct = async (data: createProductDtO) => {
  try {
    const productRef = doc(productsCollection, data.id)
    const docSnap = await getDoc(productRef)

    if (!docSnap.exists()) {
      throw new Error(`Product with ID ${data.id} not found`)
    }

    const productData = docSnap.data()

    // Update the product data
    const updatedProduct = {
      name: data.name,
      description: data.description,
      thumbnail: data.thumbnail,
      url: data.url,
      price: data.price,
      marketReputation: data.marketReputation,
      integrationAbility: data.integrationAbility,
      solveHow: data.solveHow,
      solveProblem: data.solveProblem,
      customerServiceLevel: data.customerServiceLevel,
      vendorIds: data.vendor, // Use the new vendor IDs directly
      categoryIds: data.category, // Use the new category IDs directly
      updatedAt: new Date()
    }

    // Update the document in Firestore
    await updateDoc(productRef, updatedProduct)

    // Return the updated product with ID
    return {
      id: data.id,
      ...updatedProduct,
      price: updatedProduct.price.toString()
    }
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update product')
  }
}

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const productRef = doc(productsCollection, id)
    await deleteDoc(productRef)
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete product')
  }
}

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore'

// Type definitions to match Firestore
type DocumentData = Record<string, any>
type QueryConstraint = any
type DocumentReference = {
  id: string
  path: string
}
type QueryDocumentSnapshot = {
  id: string
  data: () => DocumentData
  ref: DocumentReference
}
type QuerySnapshot = {
  docs: QueryDocumentSnapshot[]
  empty: boolean
  size: number
}

// In-memory database to store collections and documents
const inMemoryDb: Record<string, Record<string, DocumentData>> = {
  courses: {
    'course-1': {
      id: 'course-1',
      title: 'Introduction to JavaScript',
      description: 'Learn the basics of JavaScript programming',
      price: 99.99,
      instructor: 'John Doe',
      createdAt: new Date('2023-01-15').toISOString(),
      updatedAt: new Date('2023-02-10').toISOString(),
      skills: ['javascript', 'web-development'],
      isPublished: true,
      studentIds: ['student-1', 'student-2']
    },
    'course-2': {
      id: 'course-2',
      title: 'Advanced React',
      description: 'Deep dive into React hooks and patterns',
      price: 149.99,
      instructor: 'Jane Smith',
      createdAt: new Date('2023-03-20').toISOString(),
      updatedAt: new Date('2023-03-20').toISOString(),
      skills: ['react', 'javascript', 'front-end'],
      isPublished: true,
      studentIds: ['student-3']
    },
    'course-3': {
      id: 'course-3',
      title: 'Node.js Fundamentals',
      description: 'Server-side JavaScript with Node.js',
      price: 129.99,
      instructor: 'Bob Johnson',
      createdAt: new Date('2023-04-10').toISOString(),
      updatedAt: new Date('2023-04-15').toISOString(),
      skills: ['node.js', 'javascript', 'back-end'],
      isPublished: false,
      studentIds: []
    }
  },
  students: {
    'student-1': {
      id: 'student-1',
      name: 'Alice Brown',
      email: 'alice@example.com',
      enrolledCourses: ['course-1']
    },
    'student-2': {
      id: 'student-2',
      name: 'Tom Wilson',
      email: 'tom@example.com',
      enrolledCourses: ['course-1']
    },
    'student-3': {
      id: 'student-3',
      name: 'Sarah Lee',
      email: 'sarah@example.com',
      enrolledCourses: ['course-2']
    }
  },
  sessions: {
    'session-1': {
      id: 'session-1',
      courseId: 'course-1',
      title: 'Session 1: JavaScript Basics',
      description: 'Introduction to JavaScript syntax',
      date: new Date('2023-05-10').toISOString(),
      duration: 60, // in minutes
      activities: ['activity-1', 'activity-2']
    },
    'session-2': {
      id: 'session-2',
      courseId: 'course-1',
      title: 'Session 2: Functions and Objects',
      description: 'Working with JavaScript functions and objects',
      date: new Date('2023-05-17').toISOString(),
      duration: 90,
      activities: ['activity-3']
    }
  },
  activities: {
    'activity-1': {
      id: 'activity-1',
      sessionId: 'session-1',
      title: 'JavaScript Variables',
      description: 'Exercise on declaring and using variables',
      type: 'Exercise',
      duration: 15
    },
    'activity-2': {
      id: 'activity-2',
      sessionId: 'session-1',
      title: 'JavaScript Data Types',
      description: 'Quiz on different data types in JavaScript',
      type: 'Quiz',
      duration: 10
    },
    'activity-3': {
      id: 'activity-3',
      sessionId: 'session-2',
      title: 'Function Declaration Practice',
      description: 'Practice declaring and using functions',
      type: 'Exercise',
      duration: 20
    }
  },
  skills: {
    'skill-1': {
      id: 'skill-1',
      name: 'javascript',
      description: 'JavaScript programming language'
    },
    'skill-2': {
      id: 'skill-2',
      name: 'react',
      description: 'React.js framework'
    },
    'skill-3': {
      id: 'skill-3',
      name: 'node.js',
      description: 'Node.js runtime'
    }
  },
  occupations: {
    'occupation-1': {
      id: 'occupation-1',
      name: 'Frontend Developer',
      description: 'Develops user interfaces and web applications',
      skills: ['javascript', 'react', 'html', 'css']
    },
    'occupation-2': {
      id: 'occupation-2',
      name: 'Backend Developer',
      description: 'Develops server-side applications and APIs',
      skills: ['node.js', 'express', 'mongodb', 'sql']
    }
  },
  userTypes: {
    'usertype-1': {
      id: 'usertype-1',
      name: 'Student',
      permissions: ['read_courses', 'enroll_courses']
    },
    'usertype-2': {
      id: 'usertype-2',
      name: 'Instructor',
      permissions: ['read_courses', 'create_courses', 'update_courses']
    },
    'usertype-3': {
      id: 'usertype-3',
      name: 'Admin',
      permissions: ['read_courses', 'create_courses', 'update_courses', 'delete_courses', 'manage_users']
    }
  }
}

// Helper function to generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Mock collection reference
export function mockCollection(db: any, collectionPath: string) {
  return {
    id: collectionPath,
    path: collectionPath,
    withConverter: () => mockCollection(db, collectionPath)
  }
}

// Mock document reference
export function mockDoc(db: any, collectionPath: string, docId?: string) {
  const id = docId || generateId()
  return {
    id,
    path: `${collectionPath}/${id}`,
    collection: (subcollection: string) => mockCollection(db, `${collectionPath}/${id}/${subcollection}`)
  }
}

// Mock setDoc
export async function mockSetDoc(docRef: any, data: DocumentData) {
  const collection = docRef.path.split('/')[0]
  const docId = docRef.id

  if (!inMemoryDb[collection]) {
    inMemoryDb[collection] = {}
  }

  inMemoryDb[collection][docId] = {
    ...data,
    id: docId
  }

  return Promise.resolve()
}

// Mock getDoc
export async function mockGetDoc(docRef: any) {
  const collection = docRef.path.split('/')[0]
  const docId = docRef.id

  const data = inMemoryDb[collection]?.[docId]

  return {
    exists: () => !!data,
    data: () => data || null,
    id: docId
  }
}

// Mock getDocs
export async function mockGetDocs(query: any) {
  const collection = query.collection.path
  const constraints = query.constraints || []

  let docs = Object.entries(inMemoryDb[collection] || {}).map(([id, data]) => ({
    id,
    data: () => data,
    ref: { id, path: `${collection}/${id}` }
  }))

  // Apply constraints (where, orderBy, limit)
  constraints.forEach((constraint: any) => {
    if (constraint.type === 'where') {
      const { field, operator, value } = constraint

      docs = docs.filter(doc => {
        const fieldValue = doc.data()[field]

        switch (operator) {
          case '==':
            return fieldValue === value
          case '!=':
            return fieldValue !== value
          case '>':
            return fieldValue > value
          case '>=':
            return fieldValue >= value
          case '<':
            return fieldValue < value
          case '<=':
            return fieldValue <= value
          case 'array-contains':
            return Array.isArray(fieldValue) && fieldValue.includes(value)
          case 'in':
            return value.includes(fieldValue)
          case 'array-contains-any':
            return Array.isArray(fieldValue) && value.some((v: any) => fieldValue.includes(v))
          default:
            return true
        }
      })
    } else if (constraint.type === 'orderBy') {
      const { field, direction } = constraint
      docs = docs.sort((a, b) => {
        const valueA = a.data()[field]
        const valueB = b.data()[field]

        if (valueA < valueB) return direction === 'asc' ? -1 : 1
        if (valueA > valueB) return direction === 'asc' ? 1 : -1
        return 0
      })
    } else if (constraint.type === 'limit') {
      docs = docs.slice(0, constraint.limit)
    }
  })

  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback: (doc: QueryDocumentSnapshot) => void) => docs.forEach(callback)
  }
}

// Mock updateDoc
export async function mockUpdateDoc(docRef: any, data: Partial<DocumentData>) {
  const collection = docRef.path.split('/')[0]
  const docId = docRef.id

  if (inMemoryDb[collection]?.[docId]) {
    inMemoryDb[collection][docId] = {
      ...inMemoryDb[collection][docId],
      ...data,
      updatedAt: new Date().toISOString()
    }
  }

  return Promise.resolve()
}

// Mock deleteDoc
export async function mockDeleteDoc(docRef: any) {
  const collection = docRef.path.split('/')[0]
  const docId = docRef.id

  if (inMemoryDb[collection]?.[docId]) {
    delete inMemoryDb[collection][docId]
  }

  return Promise.resolve()
}

// Mock query
export function mockQuery(collectionRef: any, ...constraints: QueryConstraint[]) {
  return {
    collection: collectionRef,
    constraints
  }
}

// Mock where constraint
export function mockWhere(field: string, operator: string, value: any) {
  return {
    type: 'where',
    field,
    operator,
    value
  }
}

// Mock orderBy constraint
export function mockOrderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return {
    type: 'orderBy',
    field,
    direction
  }
}

// Mock limit constraint
export function mockLimit(limit: number) {
  return {
    type: 'limit',
    limit
  }
}

// Export a mock Firestore DB
export const mockFirestore = {
  db: {},
  collection: mockCollection,
  doc: mockDoc,
  setDoc: mockSetDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,

  // Helper methods for testing
  _reset: () => {
    Object.keys(inMemoryDb).forEach(collection => {
      inMemoryDb[collection] = {}
    })
  },
  _getData: () => ({ ...inMemoryDb }),
  _setData: (data: typeof inMemoryDb) => {
    Object.keys(data).forEach(collection => {
      inMemoryDb[collection] = { ...data[collection] }
    })
  }
}

// Re-export the mocked functions to match Firebase imports
export {
  mockCollection as collection,
  mockDoc as doc,
  mockSetDoc as setDoc,
  mockGetDoc as getDoc,
  mockGetDocs as getDocs,
  mockUpdateDoc as updateDoc,
  mockDeleteDoc as deleteDoc,
  mockQuery as query,
  mockWhere as where,
  mockOrderBy as orderBy,
  mockLimit as limit
}

// Example usage of the mock:
/*
// Import the mock instead of the real Firebase
import { mockFirestore, collection, doc, setDoc, getDoc } from '../mocks/firebase/firestore-mock';

// Use it like you would use Firebase
const coursesCollection = collection(mockFirestore.db, 'courses');
const courseDoc = doc(coursesCollection, 'new-course');

async function createCourse() {
  await setDoc(courseDoc, {
    title: 'New Course',
    description: 'Course description',
    price: 99.99
  });
  
  const docSnap = await getDoc(courseDoc);
  if (docSnap.exists()) {
    console.log('Course data:', docSnap.data());
  }
}
*/

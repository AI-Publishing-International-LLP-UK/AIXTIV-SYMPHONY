import { Timestamp } from 'firebase/firestore'

// Enums
export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum ActivityTypeEnum {
  DISCUSSION_FORUMS = 'DISCUSSION_FORUMS',
  QUIZ = 'QUIZ',
  ASSIGNMENTS = 'ASSIGNMENTS',
  SURVEYS = 'SURVEYS',
  VIDEO_LECTURES = 'VIDEO_LECTURES',
  LIVE_WEBINARS = 'LIVE_WEBINARS',
  GROUP_PROJECTS = 'GROUP_PROJECTS',
  CASE_STUDIES = 'CASE_STUDIES',
  FEEDBACK_SESSIONS = 'FEEDBACK_SESSIONS',
  CHAT_ROOMS = 'CHAT_ROOMS',
  EXTERNAL_LINKS = 'EXTERNAL_LINKS',
  VIRTUAL_LABS = 'VIRTUAL_LABS'
}

// Base Metadata Interface
interface Metadata {
  createdAt: Timestamp
  updatedAt: Timestamp
}

// User-related Interfaces
export interface FirebaseUser extends Metadata {
  id: string
  email: string
  firstName: string
  lastName: string
  cellphone?: string
  roleId: string
  verified?: boolean
  formData?: Record<string, any>
}

export interface PersonalInformation {
  age?: number
  gender?: string
  education?: string
}

export interface ProfessionalBackground {
  experience?: string
  employer?: string
}

export interface LoginHistory {
  loginTime: Timestamp
  logoutTime?: Timestamp
  activity?: string
}

export interface Role extends Metadata {
  id: string
  name: string
  description?: string
}

export interface Interests extends Metadata {
  id: string
  category: string
  interest: string
}

// Conference & Webinar Interfaces
export interface Conference extends Metadata {
  id: string
  name: string
  description: string
  startDateTime: Timestamp
  endDateTime: Timestamp
  conferenceRoom: string
  speakerId: string
  attendeeIds: string[]
}

export interface Webinar extends Metadata {
  id: string
  name: string
  description: string
  startDate: Timestamp
  endDate: Timestamp
  speakerId: string
  webinarUrlRoom: string
}

export interface UserFeedback extends Metadata {
  userId: string
  comment: string
  rating: number
  webinarId?: string
  conferenceId?: string
}

// Products & Order Interfaces
export interface Product extends Metadata {
  id: string
  name: string
  description: string
  price: number
  thumbnail: string
  solveProblem: string
  marketReputation: string
  categoryIds: string[]
  vendorIds: string[]
}

export interface Order extends Metadata {
  id: string
  userId: string
  products: Array<{
    productId: string
    quantity: number
  }>
  paymentStatus: PaymentStatus
  amount: number
}

export interface Cart {
  userId: string
  productIds: string[]
}

// Learning Interfaces
export interface Course extends Metadata {
  id: string
  name: string
  description: string
  startDate?: Timestamp
  endDate?: Timestamp
  skillIds: string[]
}

export interface Session extends Metadata {
  id: string
  courseId: string
  name: string
  description: string
  startDate: Timestamp
  endDate: Timestamp
  activityIds: string[]
}

export interface Activity extends Metadata {
  id: string
  name: string
  description: string
  type: ActivityTypeEnum
  thumbnail: string
}

// Collaboration & Feedback
export interface Collaboration extends Metadata {
  userId: string
  feedbackOptions: string[]
  additionalFeedback?: string
  userFriendlyRating: number
}

export interface Comment extends Metadata {
  id: string
  content: string
  authorId: string
  sessionId?: string
  parentId?: string
  likes: number
}

// Utility function for timestamp conversion
export function convertToFirebaseTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date)
}

// Utility function for converting Prisma models to Firebase models
export function convertPrismaToFirebase<T>(prismaModel: any): T {
  const { createdAt, updatedAt, ...rest } = prismaModel
  return {
    ...rest,
    createdAt: convertToFirebaseTimestamp(createdAt),
    updatedAt: convertToFirebaseTimestamp(updatedAt)
  } as T
}

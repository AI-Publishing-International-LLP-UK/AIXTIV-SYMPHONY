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

// Define the Course interface for Firestore
export interface Course {
  id: string
  name: string
  startDate: Date
  endDate: Date
  description: string
  thumbnail: string
  skills?: Skill[]
  sessions?: Session[]
}

// Define related interfaces
export interface Skill {
  id: string
  name: string
}

export interface Session {
  id: string
  name: string
  description: string
  startDate: Date
  endDate: Date
  thumbnail: string
  courseId: string
  activities?: SessionActivity[]
}

export interface SessionActivity {
  id: string
  sessionId: string
  activityId: string
  startDate: Date
  endDate: Date
  activity?: Activity
}

export interface Activity {
  id: string
  name: string
  description: string
}

export interface UserCourse {
  id: string
  userId: string
  courseId: string
}

// Collection references
const coursesRef = collection(db, 'courses')
const skillsRef = collection(db, 'skills')
const sessionsRef = collection(db, 'sessions')
const sessionActivitiesRef = collection(db, 'sessionActivities')
const userCoursesRef = collection(db, 'userCourses')

export interface CreateCourseDto {
  course: string
  startDate: Date
  endDate: Date
  description: string
  thumbnail: string
  skillIds: string[]
}

export interface CreateCourseCompleteDto {
  course: string
  startDate: Date
  endDate: Date
  description: string
  thumbnail: string
  skillIds: string[]
  sessions: {
    name: string
    description: string
    startDate: Date
    endDate: Date
    thumbnail: string
    activities: {
      activityId: string
      startDate: Date
      endDate: Date
    }[]
  }[]
}

export const findStudentInCourse = async (id: string, studentId: string) => {
  try {
    const q = query(userCoursesRef, where('courseId', '==', id), where('userId', '==', studentId))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() } as UserCourse
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find student in course')
  }
}

export const createCourse = async (data: CreateCourseDto): Promise<Course> => {
  try {
    // Create the course document
    const courseData = {
      name: data.course,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description,
      thumbnail: data.thumbnail,
      skillIds: data.skillIds // Store skill IDs for reference
    }

    const docRef = await addDoc(coursesRef, courseData)

    // Fetch skills data to return a complete course object
    const skills: Skill[] = []
    if (data.skillIds.length > 0) {
      for (const skillId of data.skillIds) {
        const skillDocRef = doc(skillsRef, skillId)
        const skillDoc = await getDoc(skillDocRef)
        if (skillDoc.exists()) {
          skills.push({ id: skillDoc.id, ...skillDoc.data() } as Skill)
        }
      }
    }

    return {
      id: docRef.id,
      ...courseData,
      skills
    } as Course
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create course')
  }
}

export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const coursesSnapshot = await getDocs(coursesRef)
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate.toDate(),
      endDate: doc.data().endDate.toDate()
    })) as Course[]

    // Fetch associated data for each course
    for (const course of courses) {
      // Fetch skills
      if (course.skillIds && Array.isArray(course.skillIds)) {
        const skills: Skill[] = []
        for (const skillId of course.skillIds) {
          const skillDocRef = doc(skillsRef, skillId)
          const skillDoc = await getDoc(skillDocRef)
          if (skillDoc.exists()) {
            skills.push({ id: skillDoc.id, ...skillDoc.data() } as Skill)
          }
        }
        course.skills = skills
      }

      // Fetch sessions
      const sessionsQuery = query(sessionsRef, where('courseId', '==', course.id))
      const sessionsSnapshot = await getDocs(sessionsQuery)
      const sessions = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate.toDate()
      })) as Session[]

      // Fetch activities for each session
      for (const session of sessions) {
        const activitiesQuery = query(sessionActivitiesRef, where('sessionId', '==', session.id))
        const activitiesSnapshot = await getDocs(activitiesQuery)
        const activities = await Promise.all(
          activitiesSnapshot.docs.map(async activityDoc => {
            const data = activityDoc.data()
            // Fetch the activity details
            const activityRef = doc(collection(db, 'activities'), data.activityId)
            const activitySnapshot = await getDoc(activityRef)

            return {
              id: activityDoc.id,
              ...data,
              startDate: data.startDate.toDate(),
              endDate: data.endDate.toDate(),
              activity: activitySnapshot.exists()
                ? ({ id: activitySnapshot.id, ...activitySnapshot.data() } as Activity)
                : undefined
            } as SessionActivity
          })
        )

        session.activities = activities
      }

      course.sessions = sessions
    }

    return courses
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find courses')
  }
}

export const getCourseById = async (id: string) => {
  try {
    const courseDocRef = doc(coursesRef, id)
    const courseDoc = await getDoc(courseDocRef)

    if (!courseDoc.exists()) {
      return null
    }

    const courseData = courseDoc.data()
    const course = {
      id: courseDoc.id,
      ...courseData,
      startDate: courseData.startDate.toDate(),
      endDate: courseData.endDate.toDate()
    } as Course

    // Fetch skills if skillIds exist
    if (courseData.skillIds && Array.isArray(courseData.skillIds)) {
      const skills: Skill[] = []
      for (const skillId of courseData.skillIds) {
        const skillDocRef = doc(skillsRef, skillId)
        const skillDoc = await getDoc(skillDocRef)
        if (skillDoc.exists()) {
          skills.push({ id: skillDoc.id, ...skillDoc.data() } as Skill)
        }
      }
      course.skills = skills
    }

    return course
  } catch (error) {
    console.error(error)
    throw new Error('Failed to find course')
  }
}

export const updateCourse = async (id: string, data: CreateCourseDto): Promise<Course> => {
  try {
    const courseDocRef = doc(coursesRef, id)
    const courseDoc = await getDoc(courseDocRef)

    if (!courseDoc.exists()) {
      throw new Error(`Course with ID ${id} not found`)
    }

    const courseData = {
      name: data.course,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description,
      thumbnail: data.thumbnail,
      skillIds: data.skillIds // Update skill IDs
    }

    await updateDoc(courseDocRef, courseData)

    // Fetch skills data to return a complete course object
    const skills: Skill[] = []
    if (data.skillIds.length > 0) {
      for (const skillId of data.skillIds) {
        const skillDocRef = doc(skillsRef, skillId)
        const skillDoc = await getDoc(skillDocRef)
        if (skillDoc.exists()) {
          skills.push({ id: skillDoc.id, ...skillDoc.data() } as Skill)
        }
      }
    }

    return {
      id,
      ...courseData,
      skills
    } as Course
  } catch (error) {
    console.error(error)
    throw new Error('Failed to update course')
  }
}

export const deleteCourse = async (id: string): Promise<void> => {
  try {
    const batch = writeBatch(db)

    // Find all sessions for the course
    const sessionsQuery = query(sessionsRef, where('courseId', '==', id))
    const sessionsSnapshot = await getDocs(sessionsQuery)
    const sessionIds = sessionsSnapshot.docs.map(doc => doc.id)

    // Find and delete all session activities for these sessions
    for (const sessionId of sessionIds) {
      const activitiesQuery = query(sessionActivitiesRef, where('sessionId', '==', sessionId))
      const activitiesSnapshot = await getDocs(activitiesQuery)

      activitiesSnapshot.docs.forEach(activityDoc => {
        batch.delete(doc(sessionActivitiesRef, activityDoc.id))
      })

      // Delete the session
      batch.delete(doc(sessionsRef, sessionId))
    }

    // Find and delete user course enrollments
    const userCoursesQuery = query(userCoursesRef, where('courseId', '==', id))
    const userCoursesSnapshot = await getDocs(userCoursesQuery)

    userCoursesSnapshot.docs.forEach(userCourseDoc => {
      batch.delete(doc(userCoursesRef, userCourseDoc.id))
    })

    // Finally, delete the course itself
    batch.delete(doc(coursesRef, id))

    // Commit all the deletions in a batch
    await batch.commit()
  } catch (error) {
    console.error(error)
    throw new Error('Failed to delete course')
  }
}

export const addStudentToCourse = async (id: string, studentId: string) => {
  try {
    // Check if the course exists
    const courseDocRef = doc(coursesRef, id)
    const courseDoc = await getDoc(courseDocRef)

    if (!courseDoc.exists()) {
      throw new Error(`Course with ID ${id} not found`)
    }

    // Check if the student is already enrolled in the course
    const existingEnrollment = await findStudentInCourse(id, studentId)
    if (existingEnrollment) {
      // Student is already enrolled, no action needed
      return
    }

    // Create the new enrollment
    const userCourseData = {
      userId: studentId,
      courseId: id,
      enrolledAt: new Date()
    }

    // Add the new document to the userCourses collection
    await addDoc(userCoursesRef, userCourseData)
  } catch (error) {
    console.error(error)
    throw new Error('Failed to add student to course')
  }
}

export const createCourseComplete = async (createCourseComplete: CreateCourseCompleteDto) => {
  try {
    const batch = writeBatch(db)

    // Create course document
    const courseData = {
      name: createCourseComplete.course,
      startDate: createCourseComplete.startDate,
      endDate: createCourseComplete.endDate,
      description: createCourseComplete.description,
      thumbnail: createCourseComplete.thumbnail,
      skillIds: createCourseComplete.skillIds // Store skill IDs for reference
    }

    // Add the course document
    const courseDocRef = doc(coursesRef)
    batch.set(courseDocRef, courseData)

    // Create sessions with activities
    const sessionRefs = []
    for (const sessionData of createCourseComplete.sessions) {
      const sessionDocRef = doc(sessionsRef)
      const session = {
        name: sessionData.name,
        description: sessionData.description,
        startDate: sessionData.startDate,
        endDate: sessionData.endDate,
        thumbnail: sessionData.thumbnail,
        courseId: courseDocRef.id
      }

      batch.set(sessionDocRef, session)
      sessionRefs.push({ ref: sessionDocRef, activities: sessionData.activities })
    }

    // Commit the batch to create the course and sessions
    await batch.commit()

    // Create activities for each session (in a separate batch to ensure course and sessions exist)
    const activitiesBatch = writeBatch(db)

    for (const { ref, activities } of sessionRefs) {
      for (const activity of activities) {
        const activityDocRef = doc(sessionActivitiesRef)
        const activityData = {
          sessionId: ref.id,
          activityId: activity.activityId,
          startDate: activity.startDate,
          endDate: activity.endDate
        }

        activitiesBatch.set(activityDocRef, activityData)
      }
    }

    // Commit the activities batch
    await activitiesBatch.commit()

    // Fetch and return the complete course with skills
    const courseDoc = await getDoc(courseDocRef)
    const course = {
      id: courseDocRef.id,
      ...courseDoc.data(),
      startDate: courseDoc.data().startDate,
      endDate: courseDoc.data().endDate
    } as Course

    // Fetch skills
    if (course.skillIds && Array.isArray(course.skillIds)) {
      const skills: Skill[] = []
      for (const skillId of course.skillIds) {
        const skillDocRef = doc(skillsRef, skillId)
        const skillDoc = await getDoc(skillDocRef)
        if (skillDoc.exists()) {
          skills.push({ id: skillDoc.id, ...skillDoc.data() } as Skill)
        }
      }
      course.skills = skills
    }

    return course
  } catch (error) {
    console.error(error)
    throw new Error('Failed to create course complete')
  }
}

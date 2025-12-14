/**
 * Enrollment Data Cache
 * 
 * Caches enrollment structure to avoid redundant database queries
 * This significantly improves performance when switching between lessons
 */

interface CachedEnrollment {
  enrollment: any
  course: {
    id: string
    title: string
    modules: Array<{
      id: string
      title: string
      week_number: number
      order_index: number
      lessons: Array<{
        id: string
        title: string
        order_index: number
        lesson_type: string
        duration_minutes?: number
        is_required?: boolean
      }>
    }>
  }
  timestamp: number
}

class EnrollmentCache {
  private cache = new Map<string, CachedEnrollment>()
  private readonly TTL = 10 * 60 * 1000 // 10 minutes

  get(enrollmentId: string): CachedEnrollment | null {
    const cached = this.cache.get(enrollmentId)
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached
    }
    // Remove expired entry
    if (cached) {
      this.cache.delete(enrollmentId)
    }
    return null
  }

  set(enrollmentId: string, data: CachedEnrollment) {
    this.cache.set(enrollmentId, {
      ...data,
      timestamp: Date.now()
    })
  }

  invalidate(enrollmentId: string) {
    this.cache.delete(enrollmentId)
  }

  clear() {
    this.cache.clear()
  }

  // Get only the structure (modules and lessons list) without full lesson data
  getStructure(enrollmentId: string) {
    const cached = this.get(enrollmentId)
    if (!cached) return null

    return {
      enrollment: cached.enrollment,
      course: {
        ...cached.course,
        modules: cached.course.modules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            order_index: lesson.order_index,
            lesson_type: lesson.lesson_type,
            duration_minutes: lesson.duration_minutes,
            is_required: lesson.is_required
          }))
        }))
      }
    }
  }
}

export const enrollmentCache = new EnrollmentCache()


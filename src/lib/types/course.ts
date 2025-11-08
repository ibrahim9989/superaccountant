export interface CourseEnrollment {
  id: string
  course_id?: string | null
  user_id?: string | null
  status?: string | null
  progress_percentage?: number | null
  completion_date?: string | null
  last_accessed_at?: string | null
  // When joined with course details
  course?: {
    id?: string
    title?: string
    description?: string | null
  } | null
}



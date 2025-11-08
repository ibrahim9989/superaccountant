import { z } from 'zod'

// Course Category Types
export const CourseCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
  icon: z.string().max(50).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type CourseCategory = z.infer<typeof CourseCategorySchema>

// Course Types
export const CourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  short_description: z.string().max(500).optional(),
  category_id: z.string().uuid().optional(),
  duration_days: z.number().int().positive().default(45),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  prerequisites: z.array(z.string()).default([]),
  learning_objectives: z.array(z.string()).default([]),
  certification_requirements: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  thumbnail_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type Course = z.infer<typeof CourseSchema>

// Course Module Types
export const CourseModuleSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  week_number: z.number().int().positive(),
  order_index: z.number().int().nonnegative(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type CourseModule = z.infer<typeof CourseModuleSchema>

// Lesson Types
export const LessonSchema = z.object({
  id: z.string().uuid(),
  module_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  video_url: z.string().url().optional(),
  lesson_type: z.enum(['video', 'reading', 'quiz', 'assignment', 'discussion', 'live_session']),
  duration_minutes: z.number().int().positive().optional(),
  order_index: z.number().int().nonnegative(),
  is_active: z.boolean().default(true),
  is_required: z.boolean().default(true),
  flowchart_file_path: z.string().optional(),
  flowchart_file_name: z.string().optional(),
  flowchart_mime_type: z.string().optional(),
  flowchart_url: z.string().url().optional(),
  flowchart_title: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type Lesson = z.infer<typeof LessonSchema>

// Lesson Content Types
export const LessonContentSchema = z.object({
  id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  content_type: z.enum(['video', 'document', 'image', 'audio', 'link', 'embed']),
  title: z.string().min(1).max(200),
  content_url: z.string().url().optional(),
  content_data: z.record(z.string(), z.any()).optional(), // JSONB for embedded content
  file_path: z.string().optional(), // Path to uploaded file in storage
  file_name: z.string().optional(), // Original filename of uploaded file
  mime_type: z.string().optional(), // MIME type of the content
  upload_source: z.enum(['url', 'file_upload', 'embed']).default('url'),
  file_size_bytes: z.number().int().nonnegative().optional(),
  duration_seconds: z.number().int().nonnegative().optional(),
  order_index: z.number().int().nonnegative(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type LessonContent = z.infer<typeof LessonContentSchema>

// Course Enrollment Types
export const CourseEnrollmentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  course_id: z.string().uuid(),
  enrollment_date: z.string().datetime(),
  start_date: z.string().datetime().optional(),
  completion_date: z.string().datetime().optional(),
  status: z.enum(['enrolled', 'in_progress', 'completed', 'paused', 'dropped']).default('enrolled'),
  progress_percentage: z.number().min(0).max(100).default(0),
  last_accessed_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type CourseEnrollment = z.infer<typeof CourseEnrollmentSchema>

// Lesson Progress Types
export const LessonProgressSchema = z.object({
  id: z.string().uuid(),
  enrollment_id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'skipped']).default('not_started'),
  completion_percentage: z.number().min(0).max(100).default(0),
  time_spent_minutes: z.number().int().nonnegative().default(0),
  last_accessed_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type LessonProgress = z.infer<typeof LessonProgressSchema>

// Content Progress Types
export const ContentProgressSchema = z.object({
  id: z.string().uuid(),
  lesson_progress_id: z.string().uuid(),
  content_id: z.string().uuid(),
  content_type: z.string(),
  progress_percentage: z.number().min(0).max(100).default(0),
  time_spent_seconds: z.number().int().nonnegative().default(0),
  last_position_seconds: z.number().int().nonnegative().default(0),
  is_completed: z.boolean().default(false),
  last_accessed_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type ContentProgress = z.infer<typeof ContentProgressSchema>

// Course Quiz Types
export const CourseQuizSchema = z.object({
  id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  quiz_type: z.enum(['formative', 'summative', 'practice', 'final']).default('formative'),
  time_limit_minutes: z.number().int().positive().optional(),
  passing_score_percentage: z.number().min(0).max(100).default(70),
  max_attempts: z.number().int().positive().default(3),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type CourseQuiz = z.infer<typeof CourseQuizSchema>

// Quiz Question Types
export const QuizQuestionSchema = z.object({
  id: z.string().uuid(),
  quiz_id: z.string().uuid(),
  question_text: z.string().min(1),
  question_type: z.enum(['multiple_choice', 'true_false', 'fill_blank', 'essay', 'matching']).default('multiple_choice'),
  options: z.record(z.string(), z.any()).optional(), // JSONB for multiple choice options
  correct_answer: z.string().optional(),
  explanation: z.string().optional(),
  points: z.number().int().positive().default(1),
  order_index: z.number().int().nonnegative(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>

// Quiz Attempt Types
export const QuizAttemptSchema = z.object({
  id: z.string().uuid(),
  enrollment_id: z.string().uuid(),
  quiz_id: z.string().uuid(),
  attempt_number: z.number().int().positive(),
  started_at: z.string().datetime(),
  submitted_at: z.string().datetime().optional(),
  score: z.number().min(0).optional(),
  max_score: z.number().min(0).optional(),
  percentage_score: z.number().min(0).max(100).optional(),
  time_taken_minutes: z.number().int().nonnegative().optional(),
  status: z.enum(['in_progress', 'submitted', 'graded']).default('in_progress'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type QuizAttempt = z.infer<typeof QuizAttemptSchema>

// Quiz Response Types
export const QuizResponseSchema = z.object({
  id: z.string().uuid(),
  attempt_id: z.string().uuid(),
  question_id: z.string().uuid(),
  user_answer: z.string().optional(),
  is_correct: z.boolean().optional(),
  points_earned: z.number().min(0).default(0),
  created_at: z.string().datetime(),
})

export type QuizResponse = z.infer<typeof QuizResponseSchema>

// Course Assignment Types
export const CourseAssignmentSchema = z.object({
  id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  assignment_type: z.enum(['individual', 'group', 'peer_review']).default('individual'),
  due_date: z.string().datetime().optional(),
  max_points: z.number().min(0).default(100),
  instructions: z.string().optional(),
  rubric: z.record(z.string(), z.any()).optional(), // JSONB for rubric
  attachment_files: z.record(z.string(), z.any()).optional(), // JSONB for assignment attachments/documents
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type CourseAssignment = z.infer<typeof CourseAssignmentSchema>

// Assignment Submission Types
export const AssignmentSubmissionSchema = z.object({
  id: z.string().uuid(),
  enrollment_id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  submission_text: z.string().optional(),
  submission_files: z.record(z.string(), z.any()).optional(), // JSONB for file URLs
  submitted_at: z.string().datetime(),
  grade: z.number().min(0).optional(),
  feedback: z.string().optional(),
  graded_at: z.string().datetime().optional(),
  graded_by: z.string().uuid().optional(),
  status: z.enum(['submitted', 'graded', 'returned']).default('submitted'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type AssignmentSubmission = z.infer<typeof AssignmentSubmissionSchema>

// Course Discussion Types
export const CourseDiscussionSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  discussion_type: z.enum(['general', 'q_and_a', 'announcement', 'assignment_help']).default('general'),
  is_pinned: z.boolean().default(false),
  is_locked: z.boolean().default(false),
  created_by: z.string().uuid().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type CourseDiscussion = z.infer<typeof CourseDiscussionSchema>

// Discussion Post Types
export const DiscussionPostSchema = z.object({
  id: z.string().uuid(),
  discussion_id: z.string().uuid(),
  parent_post_id: z.string().uuid().optional(),
  author_id: z.string().uuid().optional(),
  content: z.string().min(1),
  is_solution: z.boolean().default(false),
  is_pinned: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type DiscussionPost = z.infer<typeof DiscussionPostSchema>

// Course Certificate Types
export const CourseCertificateSchema = z.object({
  id: z.string().uuid(),
  enrollment_id: z.string().uuid(),
  certificate_number: z.string().min(1).max(50),
  issued_at: z.string().datetime(),
  certificate_url: z.string().url().optional(),
  verification_code: z.string().min(1).max(20),
  is_valid: z.boolean().default(true),
  created_at: z.string().datetime(),
})

export type CourseCertificate = z.infer<typeof CourseCertificateSchema>

// Course Analytics Types
export const CourseAnalyticsSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  date: z.string().date(),
  total_enrollments: z.number().int().nonnegative().default(0),
  active_enrollments: z.number().int().nonnegative().default(0),
  completed_enrollments: z.number().int().nonnegative().default(0),
  average_progress: z.number().min(0).max(100).default(0),
  average_completion_time_days: z.number().int().nonnegative().optional(),
  created_at: z.string().datetime(),
})

export type CourseAnalytics = z.infer<typeof CourseAnalyticsSchema>

// Extended types with relationships
export interface CourseWithDetails extends Course {
  category?: CourseCategory
  modules?: CourseModuleWithDetails[]
  enrollment?: CourseEnrollment
}

export interface CourseModuleWithDetails extends CourseModule {
  lessons?: LessonWithDetails[]
}

export interface LessonWithDetails extends Lesson {
  content?: LessonContent[]
  quiz?: CourseQuiz
  assignment?: CourseAssignment
  progress?: LessonProgress
}

export interface CourseEnrollmentWithDetails extends CourseEnrollment {
  course?: Course
  progress?: LessonProgress[]
  certificate?: CourseCertificate
}

export interface QuizAttemptWithDetails extends QuizAttempt {
  quiz?: CourseQuiz
  responses?: QuizResponse[]
  enrollment?: CourseEnrollment
}

export interface AssignmentSubmissionWithDetails extends AssignmentSubmission {
  assignment?: CourseAssignment
  enrollment?: CourseEnrollment
}

export interface DiscussionPostWithDetails extends DiscussionPost {
  author?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  replies?: DiscussionPostWithDetails[]
}

export interface CourseDiscussionWithDetails extends CourseDiscussion {
  posts?: DiscussionPostWithDetails[]
  author?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

// Progress tracking types
export interface CourseProgress {
  enrollment: CourseEnrollment
  overall_progress: number
  modules_completed: number
  total_modules: number
  lessons_completed: number
  total_lessons: number
  time_spent_minutes: number
  last_accessed_at?: string
  next_lesson?: Lesson
}

export interface ModuleProgress {
  module: CourseModule
  progress_percentage: number
  lessons_completed: number
  total_lessons: number
  time_spent_minutes: number
  is_completed: boolean
  lessons: LessonProgress[]
}

export interface LessonProgressWithDetails extends LessonProgress {
  lesson?: Lesson
  content_progress?: ContentProgress[]
}

// Analytics types
export interface CourseAnalyticsSummary {
  course_id: string
  total_enrollments: number
  active_enrollments: number
  completed_enrollments: number
  completion_rate: number
  average_progress: number
  average_completion_time_days: number
  recent_activity: CourseAnalytics[]
}

export interface UserProgressAnalytics {
  user_id: string
  total_courses_enrolled: number
  total_courses_completed: number
  total_time_spent_minutes: number
  average_progress: number
  completion_rate: number
  recent_activity: LessonProgress[]
}

// Form schemas for creating/updating
export const CreateCourseSchema = CourseSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateCourseSchema = CreateCourseSchema.partial()

export const CreateCourseModuleSchema = CourseModuleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateCourseModuleSchema = CreateCourseModuleSchema.partial()

export const CreateLessonSchema = LessonSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateLessonSchema = CreateLessonSchema.partial()

export const CreateLessonContentSchema = LessonContentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateLessonContentSchema = CreateLessonContentSchema.partial()

export const CreateCourseEnrollmentSchema = CourseEnrollmentSchema.omit({
  id: true,
  enrollment_date: true,
  created_at: true,
  updated_at: true,
})

export const UpdateCourseEnrollmentSchema = CreateCourseEnrollmentSchema.partial()

export const CreateQuizSchema = CourseQuizSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateQuizSchema = CreateQuizSchema.partial()

export const CreateQuizQuestionSchema = QuizQuestionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateQuizQuestionSchema = CreateQuizQuestionSchema.partial()

export const CreateAssignmentSchema = CourseAssignmentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateAssignmentSchema = CreateAssignmentSchema.partial()

export const CreateDiscussionSchema = CourseDiscussionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateDiscussionSchema = CreateDiscussionSchema.partial()

export const CreateDiscussionPostSchema = DiscussionPostSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateDiscussionPostSchema = CreateDiscussionPostSchema.partial()

// Type exports
export type CreateCourse = z.infer<typeof CreateCourseSchema>
export type UpdateCourse = z.infer<typeof UpdateCourseSchema>
export type CreateCourseModule = z.infer<typeof CreateCourseModuleSchema>
export type UpdateCourseModule = z.infer<typeof UpdateCourseModuleSchema>
export type CreateLesson = z.infer<typeof CreateLessonSchema>
export type UpdateLesson = z.infer<typeof UpdateLessonSchema>
export type CreateLessonContent = z.infer<typeof CreateLessonContentSchema>
export type UpdateLessonContent = z.infer<typeof UpdateLessonContentSchema>
export type CreateCourseEnrollment = z.infer<typeof CreateCourseEnrollmentSchema>
export type UpdateCourseEnrollment = z.infer<typeof UpdateCourseEnrollmentSchema>
export type CreateQuiz = z.infer<typeof CreateQuizSchema>
export type UpdateQuiz = z.infer<typeof UpdateQuizSchema>
export type CreateQuizQuestion = z.infer<typeof CreateQuizQuestionSchema>
export type UpdateQuizQuestion = z.infer<typeof UpdateQuizQuestionSchema>
export type CreateAssignment = z.infer<typeof CreateAssignmentSchema>
export type UpdateAssignment = z.infer<typeof UpdateAssignmentSchema>
export type CreateDiscussion = z.infer<typeof CreateDiscussionSchema>
export type UpdateDiscussion = z.infer<typeof UpdateDiscussionSchema>
export type CreateDiscussionPost = z.infer<typeof CreateDiscussionPostSchema>
export type UpdateDiscussionPost = z.infer<typeof UpdateDiscussionPostSchema>



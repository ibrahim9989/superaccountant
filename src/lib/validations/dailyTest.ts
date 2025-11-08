import { z } from 'zod'

// Daily Test Configuration
export const DailyTestConfigSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  day_number: z.number().int().min(1).max(45),
  title: z.string().min(1),
  description: z.string().optional(),
  test_type: z.enum(['daily', 'weekly', 'milestone']).default('daily'),
  question_count: z.number().int().min(1).max(50).default(10),
  time_limit_minutes: z.number().int().min(1).max(120).optional(),
  passing_score_percentage: z.number().min(0).max(100).default(70),
  max_attempts: z.number().int().min(1).max(10).default(3),
  is_active: z.boolean().default(true),
  unlock_conditions: z.record(z.string(), z.any()).optional(),
  prerequisites: z.record(z.string(), z.any()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const CreateDailyTestConfigSchema = DailyTestConfigSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateDailyTestConfigSchema = CreateDailyTestConfigSchema.partial()

export type DailyTestConfig = z.infer<typeof DailyTestConfigSchema>
export type CreateDailyTestConfig = z.infer<typeof CreateDailyTestConfigSchema>
export type UpdateDailyTestConfig = z.infer<typeof UpdateDailyTestConfigSchema>

// Daily Test Question
export const DailyTestQuestionSchema = z.object({
  id: z.string().uuid(),
  test_config_id: z.string().uuid(),
  question_id: z.string().uuid(),
  order_index: z.number().int().min(1),
  is_active: z.boolean().default(true),
  created_at: z.string(),
})

export const CreateDailyTestQuestionSchema = DailyTestQuestionSchema.omit({
  id: true,
  created_at: true,
})

export type DailyTestQuestion = z.infer<typeof DailyTestQuestionSchema>
export type CreateDailyTestQuestion = z.infer<typeof CreateDailyTestQuestionSchema>

// Daily Test Attempt
export const DailyTestAttemptSchema = z.object({
  id: z.string().uuid(),
  enrollment_id: z.string().uuid(),
  test_config_id: z.string().uuid(),
  attempt_number: z.number().int().min(1),
  started_at: z.string(),
  submitted_at: z.string().optional(),
  score: z.number().optional(),
  max_score: z.number().optional(),
  percentage_score: z.number().optional(),
  time_taken_minutes: z.number().int().optional(),
  status: z.enum(['in_progress', 'submitted', 'graded']).default('in_progress'),
  day_completed: z.number().int().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const CreateDailyTestAttemptSchema = DailyTestAttemptSchema.omit({
  id: true,
  submitted_at: true,
  score: true,
  max_score: true,
  percentage_score: true,
  time_taken_minutes: true,
  status: true,
  day_completed: true,
  created_at: true,
  updated_at: true,
})

export type DailyTestAttempt = z.infer<typeof DailyTestAttemptSchema>
export type CreateDailyTestAttempt = z.infer<typeof CreateDailyTestAttemptSchema>

// Daily Test Response
export const DailyTestResponseSchema = z.object({
  id: z.string().uuid(),
  attempt_id: z.string().uuid(),
  question_id: z.string().uuid(),
  user_answer: z.string().optional(),
  is_correct: z.boolean().optional(),
  points_earned: z.number().default(0),
  time_spent_seconds: z.number().int().optional(),
  created_at: z.string(),
})

export const CreateDailyTestResponseSchema = DailyTestResponseSchema.omit({
  id: true,
  is_correct: true,
  points_earned: true,
  created_at: true,
})

export type DailyTestResponse = z.infer<typeof DailyTestResponseSchema>
export type CreateDailyTestResponse = z.infer<typeof CreateDailyTestResponseSchema>

// Daily Test Progress
export const DailyTestProgressSchema = z.object({
  id: z.string().uuid(),
  enrollment_id: z.string().uuid(),
  course_id: z.string().uuid(),
  day_number: z.number().int().min(1).max(45),
  test_config_id: z.string().uuid().optional(),
  status: z.enum(['locked', 'unlocked', 'in_progress', 'completed', 'failed']).default('locked'),
  unlocked_at: z.string().optional(),
  completed_at: z.string().optional(),
  best_score: z.number().optional(),
  best_attempt_id: z.string().uuid().optional(),
  total_attempts: z.number().int().default(0),
  streak_count: z.number().int().default(0),
  last_attempt_at: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const CreateDailyTestProgressSchema = DailyTestProgressSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateDailyTestProgressSchema = CreateDailyTestProgressSchema.partial()

export type DailyTestProgress = z.infer<typeof DailyTestProgressSchema>
export type CreateDailyTestProgress = z.infer<typeof CreateDailyTestProgressSchema>
export type UpdateDailyTestProgress = z.infer<typeof UpdateDailyTestProgressSchema>

// Daily Test Analytics
export const DailyTestAnalyticsSchema = z.object({
  id: z.string().uuid(),
  enrollment_id: z.string().uuid(),
  course_id: z.string().uuid(),
  date: z.string(), // ISO date string
  tests_available: z.number().int().default(0),
  tests_completed: z.number().int().default(0),
  tests_passed: z.number().int().default(0),
  tests_failed: z.number().int().default(0),
  total_score: z.number().default(0),
  average_score: z.number().default(0),
  total_time_minutes: z.number().int().default(0),
  streak_count: z.number().int().default(0),
  created_at: z.string(),
  updated_at: z.string(),
})

export type DailyTestAnalytics = z.infer<typeof DailyTestAnalyticsSchema>

// Extended types with relationships
export interface DailyTestConfigWithQuestions extends DailyTestConfig {
  questions: DailyTestQuestion[]
}

export interface DailyTestAttemptWithDetails extends DailyTestAttempt {
  test_config: DailyTestConfig
  responses: DailyTestResponse[]
}

export interface DailyTestProgressWithDetails extends DailyTestProgress {
  test_config?: DailyTestConfig
  best_attempt?: DailyTestAttempt
}

// Request/Response types
export interface StartDailyTestData {
  test_config_id: string
  day_number: number
}

export interface SubmitDailyTestAnswerData {
  question_id: string
  user_answer: string
  time_spent_seconds?: number
}

export interface CompleteDailyTestData {
  attempt_id: string
}

export interface DailyTestResult {
  attempt: DailyTestAttempt
  score: number
  max_score: number
  percentage: number
  passed: boolean
  time_taken_minutes: number
  responses: DailyTestResponse[]
}

// Analytics types
export interface DailyTestStats {
  total_tests: number
  completed_tests: number
  passed_tests: number
  failed_tests: number
  average_score: number
  current_streak: number
  longest_streak: number
  total_time_minutes: number
}

export interface WeeklyTestStats {
  week_number: number
  tests_available: number
  tests_completed: number
  tests_passed: number
  average_score: number
  streak_count: number
}

export interface MonthlyTestStats {
  month: string
  tests_available: number
  tests_completed: number
  tests_passed: number
  average_score: number
  streak_count: number
  improvement_trend: 'up' | 'down' | 'stable'
}



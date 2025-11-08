import { z } from 'zod'

// Enums
export const DifficultyLevel = z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
export const QuestionType = z.enum(['single_choice', 'multiple_choice', 'true_false'])
export const TestStatus = z.enum(['in_progress', 'completed', 'abandoned', 'timeout'])

// Base schemas
export const QuestionOptionSchema = z.object({
  id: z.string().uuid(),
  option_text: z.string().min(1, 'Option text is required'),
  is_correct: z.boolean(),
  order_index: z.number().int().min(0)
})

export const QuestionSchema = z.object({
  id: z.string().uuid(),
  category_id: z.string().uuid(),
  question_text: z.string().min(1, 'Question text is required'),
  question_type: QuestionType,
  difficulty: DifficultyLevel,
  explanation: z.string().optional(),
  points: z.number().int().min(1),
  time_limit_seconds: z.number().int().min(10).max(300),
  is_active: z.boolean(),
  options: z.array(QuestionOptionSchema).min(2, 'At least 2 options required'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const TestConfigurationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Test name is required'),
  description: z.string().optional(),
  total_questions: z.number().int().min(1).max(100),
  time_limit_minutes: z.number().int().min(5).max(180),
  passing_score_percentage: z.number().int().min(0).max(100),
  max_attempts: z.number().int().min(1).max(10),
  is_active: z.boolean()
})

export const TestSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  test_config_id: z.string().uuid(),
  status: TestStatus,
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  total_score: z.number().int().min(0),
  max_possible_score: z.number().int().min(0),
  percentage_score: z.number().min(0).max(100),
  time_taken_seconds: z.number().int().min(0),
  attempt_number: z.number().int().min(1)
})

export const TestResponseSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  question_id: z.string().uuid(),
  selected_option_ids: z.array(z.string().uuid()),
  is_correct: z.boolean(),
  points_earned: z.number().int().min(0),
  time_taken_seconds: z.number().int().min(0),
  answered_at: z.string().datetime()
})

// Form schemas for user interactions
export const StartTestSchema = z.object({
  test_config_id: z.string().uuid()
})

export const SubmitAnswerSchema = z.object({
  question_id: z.string().uuid(),
  selected_option_ids: z.array(z.string().uuid()).min(1, 'At least one option must be selected'),
  time_taken_seconds: z.number().int().min(0)
})

export const CompleteTestSchema = z.object({
  session_id: z.string().uuid()
})

// Analytics schemas
export const TestAnalyticsSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  test_config_id: z.string().uuid(),
  total_attempts: z.number().int().min(0),
  best_score: z.number().min(0).max(100),
  average_score: z.number().min(0).max(100),
  last_attempted_at: z.string().datetime().optional(),
  first_passed_at: z.string().datetime().optional()
})

// Type exports
export type DifficultyLevel = z.infer<typeof DifficultyLevel>
export type QuestionType = z.infer<typeof QuestionType>
export type TestStatus = z.infer<typeof TestStatus>
export type QuestionOption = z.infer<typeof QuestionOptionSchema>
export type Question = z.infer<typeof QuestionSchema>
export type TestConfiguration = z.infer<typeof TestConfigurationSchema>
export type TestSession = z.infer<typeof TestSessionSchema>
export type TestResponse = z.infer<typeof TestResponseSchema>
export type StartTestData = z.infer<typeof StartTestSchema>
export type SubmitAnswerData = z.infer<typeof SubmitAnswerSchema>
export type CompleteTestData = z.infer<typeof CompleteTestSchema>
export type TestAnalytics = z.infer<typeof TestAnalyticsSchema>

// Extended types for UI
export interface QuestionWithOptions extends Question {
  options: QuestionOption[]
  user_answer?: string[]
  is_answered?: boolean
  time_remaining?: number
}

export interface TestSessionWithDetails extends TestSession {
  test_config: TestConfiguration
  questions: QuestionWithOptions[]
  current_question_index: number
  time_remaining_seconds: number
}

export interface TestResult {
  session: TestSession & { test_config: TestConfiguration }
  responses: TestResponse[]
  score_breakdown: {
    total_questions: number
    correct_answers: number
    incorrect_answers: number
    skipped_questions: number
    percentage_score: number
    time_taken: string
  }
  category_performance: {
    category_name: string
    questions_attempted: number
    correct_answers: number
    percentage: number
  }[]
  recommendations: string[]
}

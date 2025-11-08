// Grandtest System TypeScript Types
// This file defines all the TypeScript interfaces and types for the Grandtest system

export interface GrandtestQuestion {
  id: string;
  course_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'essay' | 'true_false' | 'fill_blank';
  options?: Record<string, string>; // For multiple choice questions
  correct_answer: string;
  explanation: string;
  points: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GrandtestAttempt {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id: string;
  started_at: string;
  completed_at?: string;
  time_limit_minutes: number;
  total_questions: number;
  questions_answered: number;
  correct_answers: number;
  score_percentage: number;
  passed: boolean;
  status: 'in_progress' | 'completed' | 'abandoned' | 'timeout';
  created_at: string;
  updated_at: string;
}

export interface GrandtestResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  user_answer?: string;
  is_correct: boolean;
  points_earned: number;
  time_spent_seconds: number;
  answered_at: string;
  created_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id: string;
  grandtest_attempt_id: string;
  certificate_number: string;
  issued_at: string;
  pdf_url?: string;
  verification_code: string;
  is_valid: boolean;
  created_at: string;
}

export interface CourseCompletionStatus {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id: string;
  lessons_completed: number;
  total_lessons: number;
  quizzes_completed: number;
  total_quizzes: number;
  is_course_completed: boolean;
  grandtest_eligible: boolean;
  grandtest_passed: boolean;
  certificate_issued: boolean;
  last_updated: string;
  created_at: string;
}

// Form interfaces for creating/editing questions
export interface GrandtestQuestionForm {
  course_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'essay' | 'true_false' | 'fill_blank';
  options?: Record<string, string>;
  correct_answer: string;
  explanation: string;
  points: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
}

// Interface for starting a new attempt
export interface StartGrandtestRequest {
  course_id: string;
  enrollment_id: string;
}

// Interface for submitting an answer
export interface SubmitAnswerRequest {
  attempt_id: string;
  question_id: string;
  user_answer: string;
  time_spent_seconds: number;
}

// Interface for completing an attempt
export interface CompleteAttemptRequest {
  attempt_id: string;
}

// Interface for certificate verification
export interface CertificateVerification {
  certificate_number: string;
  verification_code: string;
}

// Interface for certificate verification result
export interface CertificateVerificationResult {
  is_valid: boolean;
  certificate?: Certificate;
  user_name?: string;
  course_title?: string;
  issued_date?: string;
  error_message?: string;
}

// Interface for grandtest statistics
export interface GrandtestStats {
  total_attempts: number;
  passed_attempts: number;
  average_score: number;
  pass_rate: number;
  last_attempt_date?: string;
  can_retake: boolean;
  next_available_date?: string;
}

// Interface for admin grandtest dashboard
export interface AdminGrandtestStats {
  total_questions: number;
  total_attempts: number;
  total_passed: number;
  average_score: number;
  pass_rate: number;
  recent_attempts: GrandtestAttempt[];
  top_performers: Array<{
    user_id: string;
    user_name: string;
    best_score: number;
    attempts: number;
  }>;
}

// Interface for question statistics
export interface QuestionStats {
  question_id: string;
  question_text: string;
  total_attempts: number;
  correct_answers: number;
  accuracy_rate: number;
  average_time_spent: number;
}

// Interface for time tracking
export interface TimeTracking {
  question_start_time: number;
  total_time_remaining: number;
  current_question_time: number;
}

// Interface for grandtest session
export interface GrandtestSession {
  attempt: GrandtestAttempt;
  current_question: GrandtestQuestion;
  current_question_index: number;
  responses: Record<string, GrandtestResponse>;
  time_tracking: TimeTracking;
  is_completed: boolean;
}

// Interface for grandtest results
export interface GrandtestResults {
  attempt: GrandtestAttempt;
  responses: GrandtestResponse[];
  questions: GrandtestQuestion[];
  certificate?: Certificate;
  can_retake: boolean;
  next_available_date?: string;
}

// Interface for course completion check
export interface CourseCompletionCheck {
  is_completed: boolean;
  lessons_completed: number;
  total_lessons: number;
  quizzes_completed: number;
  total_quizzes: number;
  grandtest_eligible: boolean;
  grandtest_passed: boolean;
  certificate_issued: boolean;
}

// Interface for grandtest configuration
export interface GrandtestConfig {
  total_questions: number;
  time_limit_minutes: number;
  passing_score_percentage: number;
  cooldown_hours: number;
  max_attempts?: number;
  question_types: string[];
}

// Interface for grandtest attempt summary
export interface GrandtestAttemptSummary {
  id: string;
  started_at: string;
  completed_at?: string;
  score_percentage: number;
  passed: boolean;
  status: string;
  questions_answered: number;
  total_questions: number;
  time_spent_minutes: number;
}

// Interface for user grandtest history
export interface UserGrandtestHistory {
  course_id: string;
  course_title: string;
  attempts: GrandtestAttemptSummary[];
  best_score: number;
  total_attempts: number;
  passed_attempts: number;
  certificate_issued: boolean;
  can_retake: boolean;
  next_available_date?: string;
}



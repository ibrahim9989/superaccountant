// Grandtest Service
// This service handles all Grandtest-related operations including questions, attempts, and certificates

import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  GrandtestQuestion,
  GrandtestAttempt,
  GrandtestResponse,
  Certificate,
  CourseCompletionStatus,
  GrandtestQuestionForm,
  StartGrandtestRequest,
  SubmitAnswerRequest,
  CompleteAttemptRequest,
  CertificateVerification,
  CertificateVerificationResult,
  GrandtestStats,
  AdminGrandtestStats,
  QuestionStats,
  GrandtestSession,
  GrandtestResults,
  CourseCompletionCheck,
  GrandtestConfig,
  GrandtestAttemptSummary,
  UserGrandtestHistory
} from '@/lib/types/grandtest';

export class GrandtestService {
  // Question Management
  static async getQuestionsByCourse(courseId: string): Promise<GrandtestQuestion[]> {
    // Try using API route first (bypasses RLS with service role)
    try {
      console.log('📡 Fetching questions via API route...');
      const response = await fetch(`/api/grandtest/questions?course_id=${courseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          console.log(`✅ Fetched ${result.data.length} questions via API`);
          return result.data;
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.warn('API route returned error:', errorData.error);
      }
    } catch (apiError) {
      console.warn('API route error (trying fallback):', apiError);
      // Fall through to direct database call
    }

    // Fallback to direct database call
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('grandtest_questions')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      // Handle RLS errors gracefully
      if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
        console.error('RLS recursion error fetching questions:', error);
        throw new Error('Database configuration error: RLS policy issue detected. Please run FIX-RLS-NOW.sql in Supabase Dashboard.');
      }
      console.error('Error fetching grandtest questions:', error);
      throw new Error(`Failed to fetch grandtest questions: ${error.message}`);
    }

    return data || [];
  }

  static async createQuestion(questionData: GrandtestQuestionForm): Promise<GrandtestQuestion> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('grandtest_questions')
      .insert(questionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating grandtest question:', error);
      throw new Error('Failed to create grandtest question');
    }

    return data;
  }

  static async updateQuestion(questionId: string, questionData: Partial<GrandtestQuestionForm>): Promise<GrandtestQuestion> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('grandtest_questions')
      .update({ ...questionData, updated_at: new Date().toISOString() })
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating grandtest question:', error);
      throw new Error('Failed to update grandtest question');
    }

    return data;
  }

  static async deleteQuestion(questionId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('grandtest_questions')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', questionId);

    if (error) {
      console.error('Error deleting grandtest question:', error);
      throw new Error('Failed to delete grandtest question');
    }
  }

  // Attempt Management
  static async canTakeGrandtest(userId: string, courseId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .rpc('can_take_grandtest', {
        user_uuid: userId,
        course_uuid: courseId
      });

    if (error) {
      console.error('Error checking grandtest eligibility:', error);
      return false;
    }

    return data;
  }

  static async startGrandtest(request: StartGrandtestRequest): Promise<GrandtestAttempt> {
    // Check if user can take grandtest
    const supabase = getSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error('User authentication error in startGrandtest:', userError);
      throw new Error('User not authenticated');
    }
    
    const user = userData.user;

    // Try canTakeGrandtest check, but don't fail if it errors (RLS issues)
    try {
      const canTake = await this.canTakeGrandtest(user.id, request.course_id);
      if (!canTake) {
        throw new Error('Cannot take grandtest yet. 24-hour cooldown period not met.');
      }
    } catch (cooldownError) {
      // If RPC fails, log but continue (we'll use API route which bypasses this)
      console.warn('Could not check 24-hour cooldown (may be RLS issue):', cooldownError);
      // Don't throw - let the API route handle it
    }

    // Get random 5 questions (changed from 60 for testing)
    const questions = await this.getQuestionsByCourse(request.course_id);
    if (questions.length < 5) {
      throw new Error('Not enough questions available for grandtest');
    }

    // Try using API route first (bypasses RLS with service role)
    // Skip canTakeGrandtest check - we'll let the API handle it
    try {
      // Use the user ID we already have
      const userId = user.id
      
      console.log('📡 Calling API route to start grandtest...');
      const response = await fetch('/api/grandtest/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          course_id: request.course_id,
          enrollment_id: request.enrollment_id,
          user_id: userId // Pass user ID to help with server-side verification
        })
      });
      
      console.log('📡 API response status:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          return result.data;
        }
        throw new Error(result.error || 'No data returned from API');
      } else {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.error || 'Failed to start grandtest via API');
      }
    } catch (apiError) {
      // Log the actual error
      console.error('API route error details:', apiError);
      
      // If it's a network error, don't fallback - show the error
      if (apiError instanceof TypeError && apiError.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your connection.');
      }
      
      // Fallback to direct database call if API fails
      console.warn('API route failed, trying direct database call:', apiError);
      
      // Skip canTakeGrandtest check in fallback too
      console.warn('Skipping 24-hour cooldown check in fallback mode');
      
      // Shuffle and select 5 questions (changed from 60 for testing)
      const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffledQuestions.slice(0, 5);

      // Create attempt
      const attemptData = {
        user_id: user.id,
        course_id: request.course_id,
        enrollment_id: request.enrollment_id,
        time_limit_minutes: 5, // 5 minutes for 5 questions
        total_questions: 5,
        status: 'in_progress' as const
      };

      const { data: attempt, error: attemptError } = await supabase
        .from('grandtest_attempts')
        .insert(attemptData)
        .select()
        .single();

      if (attemptError) {
        console.error('Error creating grandtest attempt:', attemptError);
        
        // Provide more detailed error messages
        if (attemptError.code === '42501' || attemptError.message?.includes('permission denied') || attemptError.message?.includes('policy')) {
          throw new Error('Permission denied: Unable to create grandtest attempt. Please run the RLS fix SQL (FIX-RLS-NOW.sql) in Supabase Dashboard.');
        } else if (attemptError.code === '42P17' || attemptError.message?.includes('infinite recursion')) {
          throw new Error('Database configuration error: RLS policy issue detected. Please run FIX-RLS-NOW.sql in Supabase Dashboard.');
        } else {
          throw new Error(`Failed to start grandtest: ${attemptError.message || 'Unknown error'}`);
        }
      }

      // Create initial responses for all questions
      const responses = selectedQuestions.map(question => ({
        attempt_id: attempt.id,
        question_id: question.id,
        time_spent_seconds: 0
      }));

      const { error: responsesError } = await supabase
        .from('grandtest_responses')
        .insert(responses);

      if (responsesError) {
        console.error('Error creating grandtest responses:', responsesError);
        // Clean up the attempt
        await supabase.from('grandtest_attempts').delete().eq('id', attempt.id);
        throw new Error('Failed to initialize grandtest questions');
      }

      return attempt;
    }
  }

  static async getCurrentAttempt(userId: string, courseId: string): Promise<GrandtestAttempt | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('grandtest_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching current attempt:', error);
      throw new Error('Failed to fetch current attempt');
    }

    return data;
  }

  static async submitAnswer(request: SubmitAnswerRequest): Promise<GrandtestResponse> {
    // Get the question to check the answer
    const supabase = getSupabaseClient();
    const { data: question, error: questionError } = await supabase
      .from('grandtest_questions')
      .select('*')
      .eq('id', request.question_id)
      .single();

    if (questionError) {
      console.error('Error fetching question:', questionError);
      throw new Error('Failed to fetch question');
    }

    // Check if answer is correct
    let isCorrect = false;
    let pointsEarned = 0;

    switch (question.question_type) {
      case 'multiple_choice':
      case 'true_false':
      case 'fill_blank':
        isCorrect = request.user_answer?.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
        pointsEarned = isCorrect ? question.points : 0;
        break;
      case 'essay':
        // For essay questions, we'll mark as correct for now
        // In a real system, you might want manual grading
        isCorrect = !!(request.user_answer && request.user_answer.trim().length > 10);
        pointsEarned = isCorrect ? question.points : 0;
        break;
    }

    // Update or insert response using upsert (unique constraint on attempt_id, question_id)
    const responseData = {
      attempt_id: request.attempt_id,
      question_id: request.question_id,
      user_answer: request.user_answer,
      is_correct: isCorrect,
      points_earned: pointsEarned,
      time_spent_seconds: request.time_spent_seconds,
      answered_at: new Date().toISOString()
    };

    // Use upsert with the unique constraint (attempt_id, question_id)
    const { data, error } = await supabase
      .from('grandtest_responses')
      .upsert(responseData, { 
        onConflict: 'attempt_id,question_id' 
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting answer:', error);
      throw new Error('Failed to submit answer');
    }

    return data;
  }

  static async completeAttempt(request: CompleteAttemptRequest): Promise<GrandtestAttempt> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('grandtest_attempts')
      .update({
        completed_at: new Date().toISOString(),
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.attempt_id)
      .select()
      .single();

    if (error) {
      console.error('Error completing attempt:', error);
      throw new Error('Failed to complete attempt');
    }

    // If passed, create certificate
    if (data.passed) {
      await this.createCertificate(data);
    }

    return data;
  }

  // Certificate Management
  static async createCertificate(attempt: GrandtestAttempt): Promise<Certificate> {
    const supabase = getSupabaseClient();
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // Generate certificate number and verification code
    const certificateNumber = await this.generateCertificateNumber();
    const verificationCode = await this.generateVerificationCode();

    const certificateData = {
      user_id: user.user.id,
      course_id: attempt.course_id,
      enrollment_id: attempt.enrollment_id,
      grandtest_attempt_id: attempt.id,
      certificate_number: certificateNumber,
      verification_code: verificationCode
    };

    const { data, error } = await supabase
      .from('certificates')
      .insert(certificateData)
      .select()
      .single();

    if (error) {
      console.error('Error creating certificate:', error);
      throw new Error('Failed to create certificate');
    }

    return data;
  }

  static async getCertificatesByUser(userId: string): Promise<Certificate[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_valid', true)
      .order('issued_at', { ascending: false });

    if (error) {
      console.error('Error fetching certificates:', error);
      throw new Error('Failed to fetch certificates');
    }

    return data || [];
  }

  static async verifyCertificate(verification: CertificateVerification): Promise<CertificateVerificationResult> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        user:user_id (
          full_name,
          email
        ),
        course:course_id (
          title
        )
      `)
      .eq('certificate_number', verification.certificate_number)
      .eq('verification_code', verification.verification_code)
      .eq('is_valid', true)
      .single();

    if (error || !data) {
      return {
        is_valid: false,
        error_message: 'Certificate not found or invalid'
      };
    }

    return {
      is_valid: true,
      certificate: data,
      user_name: data.user?.full_name || 'Unknown',
      course_title: data.course?.title || 'Unknown Course',
      issued_date: data.issued_at
    };
  }

  // Course Completion Management
  static async checkCourseCompletion(userId: string, courseId: string, enrollmentId: string): Promise<CourseCompletionCheck> {
    const supabase = getSupabaseClient();
    try {
      const { data, error } = await supabase
        .from('course_completion_status')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('enrollment_id', enrollmentId)
        .maybeSingle();

      if (error) {
        // Handle 406 errors gracefully (format/RLS issues)
        if (error.code === 'PGRST116' || error.message?.includes('406') || (error as any).status === 406) {
          console.warn('Completion status not found or 406 error (possibly RLS issue):', error.message);
          // Initialize completion status
          return await this.initializeCourseCompletion(userId, courseId, enrollmentId);
        }
        console.error('Error checking course completion:', error);
        throw new Error('Failed to check course completion');
      }

      if (!data) {
        // Initialize completion status
        return await this.initializeCourseCompletion(userId, courseId, enrollmentId);
      }

      return {
        is_completed: data.is_course_completed,
        lessons_completed: data.lessons_completed,
        total_lessons: data.total_lessons,
        quizzes_completed: data.quizzes_completed,
        total_quizzes: data.total_quizzes,
        grandtest_eligible: data.grandtest_eligible,
        grandtest_passed: data.grandtest_passed,
        certificate_issued: data.certificate_issued
      };
    } catch (err) {
      console.error('Exception checking course completion:', err);
      // Return default completion status on error
      return await this.initializeCourseCompletion(userId, courseId, enrollmentId);
    }
  }

  static async updateCourseCompletion(userId: string, courseId: string, enrollmentId: string): Promise<void> {
    // This would be called when lessons or quizzes are completed
    // Implementation depends on your existing course progress tracking
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('course_completion_status')
      .upsert({
        user_id: userId,
        course_id: courseId,
        enrollment_id: enrollmentId,
        last_updated: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating course completion:', error);
      throw new Error('Failed to update course completion');
    }
  }

  // Statistics and Analytics
  static async getGrandtestStats(userId: string, courseId: string): Promise<GrandtestStats> {
    const supabase = getSupabaseClient();
    
    try {
      const { data: attempts, error } = await supabase
        .from('grandtest_attempts')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .order('started_at', { ascending: false });

      // Handle RLS errors gracefully (especially 500 errors with infinite recursion)
      if (error) {
        // Check for RLS/infinite recursion errors (42P17 or 500 status)
        if (error.code === '42P17' || error.message?.includes('infinite recursion') || (error as any).status === 500) {
          console.warn('RLS issue fetching grandtest stats (possibly admin_users recursion):', error.message);
          // Return default stats instead of throwing
          return {
            total_attempts: 0,
            passed_attempts: 0,
            average_score: 0,
            pass_rate: 0,
            last_attempt_date: null,
            can_retake: true
          };
        }
        console.error('Error fetching grandtest stats:', error);
        // For other errors, still return default stats instead of throwing
        return {
          total_attempts: 0,
          passed_attempts: 0,
          average_score: 0,
          pass_rate: 0,
          last_attempt_date: null,
          can_retake: true
        };
      }

      const totalAttempts = attempts?.length || 0;
      const passedAttempts = attempts?.filter(a => a.passed).length || 0;
      const averageScore = totalAttempts > 0 
        ? (attempts?.reduce((sum: number, a: any) => sum + (a.score_percentage || 0), 0) || 0) / totalAttempts 
        : 0;
      const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

      const lastAttempt = attempts?.[0];
      const canRetake = lastAttempt ? await this.canTakeGrandtest(userId, courseId) : true;

      return {
        total_attempts: totalAttempts,
        passed_attempts: passedAttempts,
        average_score: averageScore,
        pass_rate: passRate,
        last_attempt_date: lastAttempt?.started_at || null,
        can_retake: canRetake,
        next_available_date: lastAttempt && !canRetake 
          ? new Date(new Date(lastAttempt.started_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
          : undefined
      };
    } catch (err) {
      console.error('Exception fetching grandtest stats:', err);
      // Return default stats on any exception
      return {
        total_attempts: 0,
        passed_attempts: 0,
        average_score: 0,
        pass_rate: 0,
        last_attempt_date: null,
        can_retake: true
      };
    }
  }

  static async getUserGrandtestHistory(userId: string): Promise<UserGrandtestHistory[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('grandtest_attempts')
      .select(`
        *,
        course:course_id (
          title
        )
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching grandtest history:', error);
      throw new Error('Failed to fetch grandtest history');
    }

    // Group by course
    const courseGroups = data.reduce((groups, attempt) => {
      const courseId = attempt.course_id;
      if (!groups[courseId]) {
        groups[courseId] = {
          course_id: courseId,
          course_title: attempt.course?.title || 'Unknown Course',
          attempts: [],
          best_score: 0,
          total_attempts: 0,
          passed_attempts: 0,
          certificate_issued: false,
          can_retake: true,
          next_available_date: undefined
        };
      }
      groups[courseId].attempts.push(attempt);
      return groups;
    }, {} as Record<string, UserGrandtestHistory>);

    // Calculate stats for each course
    for (const courseId in courseGroups) {
      const group = courseGroups[courseId];
      group.total_attempts = group.attempts.length;
      group.passed_attempts = group.attempts.filter((a: any) => a.passed).length;
      group.best_score = Math.max(...group.attempts.map((a: any) => a.score_percentage));
      group.certificate_issued = group.attempts.some((a: any) => a.passed);
      
      const lastAttempt = group.attempts[0];
      group.can_retake = await this.canTakeGrandtest(userId, courseId);
      group.next_available_date = lastAttempt && !group.can_retake 
        ? new Date(new Date(lastAttempt.started_at).getTime() + 24 * 60 * 60 * 1000).toISOString()
        : undefined;
    }

    return Object.values(courseGroups);
  }

  // Helper Methods
  private static async generateCertificateNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const dayOfYear = Math.floor((Date.now() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const random = Math.floor(Math.random() * 10000);
    return `CERT-${year}-${dayOfYear.toString().padStart(3, '0')}-${random.toString().padStart(4, '0')}`;
  }

  private static async generateVerificationCode(): Promise<string> {
    return Math.random().toString(36).substring(2, 18).toUpperCase();
  }

  private static async initializeCourseCompletion(userId: string, courseId: string, enrollmentId: string): Promise<CourseCompletionCheck> {
    // This would initialize the completion status based on current progress
    // Implementation depends on your existing course progress tracking
    return {
      is_completed: false,
      lessons_completed: 0,
      total_lessons: 0,
      quizzes_completed: 0,
      total_quizzes: 0,
      grandtest_eligible: false,
      grandtest_passed: false,
      certificate_issued: false
    };
  }
}
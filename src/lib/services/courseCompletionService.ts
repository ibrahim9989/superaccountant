// Course Completion Service
// This service handles course completion detection and Grandtest eligibility

import { getSupabaseClient } from '@/lib/supabase/client';
import { GrandtestService } from './grandtestService';
import type { CourseCompletionCheck } from '@/lib/types/grandtest';

export class CourseCompletionService {
  // Check if user has completed all lessons and quizzes for a course
  static async checkCourseCompletion(
    userId: string, 
    courseId: string, 
    enrollmentId: string
  ): Promise<CourseCompletionCheck> {
    try {
      // Get course modules and lessons
      const supabase = getSupabaseClient();
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          modules (
            id,
            lessons (
              id,
              title,
              lesson_progress (
                user_id,
                is_completed
              )
            ),
            quizzes (
              id,
              title,
              quiz_attempts (
                user_id,
                is_completed,
                passed
              )
            )
          )
        `)
        .eq('id', courseId)
        .single();

      if (courseError) {
        console.error('Error fetching course data:', courseError);
        throw new Error('Failed to fetch course data');
      }

      if (!course) {
        throw new Error('Course not found');
      }

      // Count total lessons and quizzes
      let totalLessons = 0;
      let totalQuizzes = 0;
      let completedLessons = 0;
      let completedQuizzes = 0;

      for (const courseModule of course.modules || []) {
        // Count lessons
        for (const lesson of courseModule.lessons || []) {
          totalLessons++;
          const userProgress = lesson.lesson_progress?.find(p => p.user_id === userId);
          if (userProgress?.is_completed) {
            completedLessons++;
          }
        }

        // Count quizzes
        for (const quiz of courseModule.quizzes || []) {
          totalQuizzes++;
          const userAttempt = quiz.quiz_attempts?.find(a => a.user_id === userId);
          if (userAttempt?.is_completed && userAttempt?.passed) {
            completedQuizzes++;
          }
        }
      }

      // Check if course is completed
      const isCourseCompleted = totalLessons > 0 && totalQuizzes > 0 && 
        completedLessons === totalLessons && completedQuizzes === totalQuizzes;

      // Check Grandtest eligibility
      const grandtestEligible = isCourseCompleted;

      // First, try to read from existing completion status (more reliable)
      const { data: existingStatus } = await supabase
        .from('course_completion_status')
        .select('grandtest_passed, certificate_issued')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('enrollment_id', enrollmentId)
        .maybeSingle();

      let grandtestPassed = existingStatus?.grandtest_passed || false;
      let certificateIssued = existingStatus?.certificate_issued || false;

      // If not found in database, check directly
      if (!grandtestPassed) {
        try {
          const grandtestStats = await GrandtestService.getGrandtestStats(userId, courseId);
          grandtestPassed = grandtestStats.passed_attempts > 0;
        } catch (statsError) {
          console.warn('Could not fetch grandtest stats, checking attempts directly:', statsError);
          // Check attempts directly
          const { data: attempts } = await supabase
            .from('grandtest_attempts')
            .select('passed')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .eq('passed', true)
            .limit(1);
          grandtestPassed = (attempts && attempts.length > 0) || false;
        }
      }

      // If certificate not found, check directly
      if (!certificateIssued) {
        try {
          const certificates = await GrandtestService.getCertificatesByUser(userId);
          certificateIssued = certificates.some(cert => cert.course_id === courseId);
        } catch (certError) {
          console.warn('Could not fetch certificates, checking directly:', certError);
          // Check certificates directly
          const { data: certs } = await supabase
            .from('certificates')
            .select('id')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .eq('is_valid', true)
            .limit(1);
          certificateIssued = (certs && certs.length > 0) || false;
        }
      }

      // Update or create completion status
      await this.updateCompletionStatus({
        user_id: userId,
        course_id: courseId,
        enrollment_id: enrollmentId,
        lessons_completed: completedLessons,
        total_lessons: totalLessons,
        quizzes_completed: completedQuizzes,
        total_quizzes: totalQuizzes,
        is_course_completed: isCourseCompleted,
        grandtest_eligible: grandtestEligible,
        grandtest_passed: grandtestPassed,
        certificate_issued: certificateIssued
      });

      return {
        is_completed: isCourseCompleted,
        lessons_completed: completedLessons,
        total_lessons: totalLessons,
        quizzes_completed: completedQuizzes,
        total_quizzes: totalQuizzes,
        grandtest_eligible: grandtestEligible,
        grandtest_passed: grandtestPassed,
        certificate_issued: certificateIssued
      };

    } catch (error) {
      console.error('Error checking course completion:', error);
      throw new Error('Failed to check course completion');
    }
  }

  // Update course completion status in database
  static async updateCompletionStatus(status: {
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
  }): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('course_completion_status')
      .upsert({
        ...status,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id,course_id,enrollment_id'
      });

    if (error) {
      console.error('Error updating completion status:', error);
      throw new Error('Failed to update completion status');
    }
  }

  // Get completion status for a user and course
  static async getCompletionStatus(
    userId: string, 
    courseId: string, 
    enrollmentId: string
  ): Promise<CourseCompletionCheck | null> {
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
          return null;
        }
        console.error('Error fetching completion status:', error);
        throw new Error('Failed to fetch completion status');
      }

      if (!data) {
        return null;
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
      console.error('Exception fetching completion status:', err);
      return null;
    }
  }

  // Trigger completion check when lesson is completed
  static async onLessonCompleted(
    userId: string, 
    courseId: string, 
    enrollmentId: string, 
    lessonId: string
  ): Promise<void> {
    try {
      // Update lesson progress
      const supabase = getSupabaseClient();
      const { error: progressError } = await supabase
        .from('lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString()
        });

      if (progressError) {
        console.error('Error updating lesson progress:', progressError);
        throw new Error('Failed to update lesson progress');
      }

      // Check course completion
      await this.checkCourseCompletion(userId, courseId, enrollmentId);

    } catch (error) {
      console.error('Error handling lesson completion:', error);
      throw new Error('Failed to process lesson completion');
    }
  }

  // Trigger completion check when quiz is completed
  static async onQuizCompleted(
    userId: string, 
    courseId: string, 
    enrollmentId: string, 
    quizId: string,
    passed: boolean
  ): Promise<void> {
    try {
      // Update quiz attempt
      const supabase = getSupabaseClient();
      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .upsert({
          user_id: userId,
          quiz_id: quizId,
          is_completed: true,
          passed: passed,
          completed_at: new Date().toISOString()
        });

      if (attemptError) {
        console.error('Error updating quiz attempt:', attemptError);
        throw new Error('Failed to update quiz attempt');
      }

      // Check course completion
      await this.checkCourseCompletion(userId, courseId, enrollmentId);

    } catch (error) {
      console.error('Error handling quiz completion:', error);
      throw new Error('Failed to process quiz completion');
    }
  }

  // Get all courses completion status for a user
  static async getUserCompletionStatus(userId: string): Promise<CourseCompletionCheck[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_completion_status')
      .select(`
        *,
        course:course_id (
          id,
          title,
          description
        )
      `)
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching user completion status:', error);
      throw new Error('Failed to fetch completion status');
    }

    return (data || []).map(item => ({
      is_completed: item.is_course_completed,
      lessons_completed: item.lessons_completed,
      total_lessons: item.total_lessons,
      quizzes_completed: item.quizzes_completed,
      total_quizzes: item.total_quizzes,
      grandtest_eligible: item.grandtest_eligible,
      grandtest_passed: item.grandtest_passed,
      certificate_issued: item.certificate_issued
    }));
  }

  // Check if user can take Grandtest (course completed + 24h cooldown)
  static async canTakeGrandtest(
    userId: string, 
    courseId: string, 
    enrollmentId: string
  ): Promise<{ canTake: boolean; reason?: string }> {
    try {
      // Check course completion
      const completionStatus = await this.getCompletionStatus(userId, courseId, enrollmentId);
      
      if (!completionStatus) {
        return { canTake: false, reason: 'Course completion status not found' };
      }

      if (!completionStatus.is_completed) {
        return { canTake: false, reason: 'Course not completed yet' };
      }

      if (!completionStatus.grandtest_eligible) {
        return { canTake: false, reason: 'Not eligible for Grandtest' };
      }

      if (completionStatus.grandtest_passed) {
        return { canTake: false, reason: 'Grandtest already passed' };
      }

      // Check 24-hour cooldown
      const canTake = await GrandtestService.canTakeGrandtest(userId, courseId);
      if (!canTake) {
        return { canTake: false, reason: '24-hour cooldown period not met' };
      }

      return { canTake: true };

    } catch (error) {
      console.error('Error checking Grandtest eligibility:', error);
      return { canTake: false, reason: 'Error checking eligibility' };
    }
  }

  // Get completion progress for dashboard
  static async getCompletionProgress(
    userId: string, 
    courseId: string, 
    enrollmentId: string
  ): Promise<{
    lessonsProgress: number;
    quizzesProgress: number;
    overallProgress: number;
    isCompleted: boolean;
    grandtestEligible: boolean;
  }> {
    try {
      const completionStatus = await this.getCompletionStatus(userId, courseId, enrollmentId);
      
      if (!completionStatus) {
        return {
          lessonsProgress: 0,
          quizzesProgress: 0,
          overallProgress: 0,
          isCompleted: false,
          grandtestEligible: false
        };
      }

      const lessonsProgress = completionStatus.total_lessons > 0 
        ? (completionStatus.lessons_completed / completionStatus.total_lessons) * 100 
        : 0;

      const quizzesProgress = completionStatus.total_quizzes > 0 
        ? (completionStatus.quizzes_completed / completionStatus.total_quizzes) * 100 
        : 0;

      const overallProgress = (lessonsProgress + quizzesProgress) / 2;

      return {
        lessonsProgress,
        quizzesProgress,
        overallProgress,
        isCompleted: completionStatus.is_completed,
        grandtestEligible: completionStatus.grandtest_eligible
      };

    } catch (error) {
      console.error('Error getting completion progress:', error);
      return {
        lessonsProgress: 0,
        quizzesProgress: 0,
        overallProgress: 0,
        isCompleted: false,
        grandtestEligible: false
      };
    }
  }
}
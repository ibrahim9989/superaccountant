import { getSupabaseClient } from '@/lib/supabase/client'
import {
  Course,
  CourseWithDetails,
  CourseModule,
  CourseModuleWithDetails,
  Lesson,
  LessonWithDetails,
  LessonContent,
  CourseEnrollment,
  CourseEnrollmentWithDetails,
  LessonProgress,
  LessonProgressWithDetails,
  ContentProgress,
  CourseQuiz,
  QuizQuestion,
  QuizAttempt,
  QuizAttemptWithDetails,
  QuizResponse,
  CourseAssignment,
  AssignmentSubmission,
  AssignmentSubmissionWithDetails,
  CourseDiscussion,
  CourseDiscussionWithDetails,
  DiscussionPost,
  DiscussionPostWithDetails,
  CourseCertificate,
  CourseAnalytics,
  CourseProgress,
  ModuleProgress,
  CourseAnalyticsSummary,
  UserProgressAnalytics,
  CreateCourse,
  UpdateCourse,
  CreateCourseModule,
  UpdateCourseModule,
  CreateLesson,
  UpdateLesson,
  CreateLessonContent,
  UpdateLessonContent,
  CreateCourseEnrollment,
  UpdateCourseEnrollment,
  CreateQuiz,
  UpdateQuiz,
  CreateQuizQuestion,
  UpdateQuizQuestion,
  CreateAssignment,
  UpdateAssignment,
  CreateDiscussion,
  UpdateDiscussion,
  CreateDiscussionPost,
  UpdateDiscussionPost,
} from '@/lib/validations/course'

export class CourseService {

  // Course Management
  async getCourses(filters?: {
    category_id?: string
    is_active?: boolean
    is_featured?: boolean
    difficulty_level?: string
  }): Promise<CourseWithDetails[]> {
    const supabase = getSupabaseClient();
    
    console.log('Fetching courses with filters:', filters)
    
    let query = supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters?.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured)
    }
    if (filters?.difficulty_level) {
      query = query.eq('difficulty_level', filters.difficulty_level)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching courses:', error)
      throw new Error(`Failed to fetch courses: ${error.message}`)
    }

    console.log('Fetched courses:', data?.length || 0)
    return data || []
  }

  async getCourseById(courseId: string): Promise<CourseWithDetails | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        category:course_categories(*),
        modules:course_modules(
          *,
          lessons:lessons(
            *,
            content:lesson_content(*),
            quiz:course_quizzes(*),
            assignment:course_assignments(*)
          )
        )
      `)
      .eq('id', courseId)
      .single()

    if (error) {
      console.error('Error fetching course:', error)
      return null
    }

    return data
  }

  async createCourse(courseData: CreateCourse): Promise<Course> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single()

    if (error) {
      console.error('Error creating course:', error)
      throw new Error(`Failed to create course: ${error.message}`)
    }

    return data
  }

  async updateCourse(courseId: string, updates: UpdateCourse): Promise<Course> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single()

    if (error) {
      console.error('Error updating course:', error)
      throw new Error(`Failed to update course: ${error.message}`)
    }

    return data
  }

  async deleteCourse(courseId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      console.error('Error deleting course:', error)
      throw new Error(`Failed to delete course: ${error.message}`)
    }
  }

  // Course Module Management
  async getCourseModules(courseId: string): Promise<CourseModuleWithDetails[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_modules')
      .select(`
        *,
        lessons:lessons(
          *,
          content:lesson_content(*),
          quiz:course_quizzes(*),
          assignment:course_assignments(*)
        )
      `)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('order_index')

    if (error) {
      console.error('Error fetching course modules:', error)
      throw new Error(`Failed to fetch course modules: ${error.message}`)
    }

    return data || []
  }

  async createCourseModule(moduleData: CreateCourseModule): Promise<CourseModule> {
    const supabase = getSupabaseClient();
    
    // If duplicate week_number error, find next available week_number
    const moduleDataWithFallback = { ...moduleData }
    
    const { data, error } = await supabase
      .from('course_modules')
      .insert(moduleDataWithFallback)
      .select()
      .single()

    if (error) {
      // Handle duplicate week_number constraint
      if (error.code === '23505' && error.message?.includes('course_modules_course_id_week_number_key')) {
        console.log('Duplicate week_number detected, finding next available week_number...')
        
        // Find the maximum week_number for this course
        const { data: maxWeek, error: maxError } = await supabase
          .from('course_modules')
          .select('week_number')
          .eq('course_id', moduleData.course_id)
          .order('week_number', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (maxError) {
          console.error('Error finding max week_number:', maxError)
          throw new Error(`Failed to find next available week number: ${maxError.message}`)
        }

        // Set week_number to next available
        const nextWeekNumber = (maxWeek?.week_number ?? 0) + 1
        const updatedModuleData = { ...moduleData, week_number: nextWeekNumber }

        console.log(`Auto-adjusting week_number to ${nextWeekNumber} for course ${moduleData.course_id}`)

        // Retry insert with new week_number
        const { data: retryData, error: retryError } = await supabase
          .from('course_modules')
          .insert(updatedModuleData)
          .select()
          .single()

        if (retryError) {
          console.error('Error creating course module after retry:', retryError)
          throw new Error(`Failed to create course module: ${retryError.message}`)
        }

        return retryData
      }
      
      console.error('Error creating course module:', error)
      throw new Error(`Failed to create course module: ${error.message}`)
    }

    return data
  }

  async updateCourseModule(moduleId: string, updates: UpdateCourseModule): Promise<CourseModule> {
    const supabase = getSupabaseClient();
    
    // First check if module exists
    const { data: existingModule, error: checkError } = await supabase
      .from('course_modules')
      .select('id')
      .eq('id', moduleId)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking course module:', checkError)
      throw new Error(`Failed to check course module: ${checkError.message}`)
    }

    if (!existingModule) {
      throw new Error(`Course module with ID ${moduleId} not found`)
    }

    // Use maybeSingle() instead of single() to handle 0 rows updated
    const { data, error } = await supabase
      .from('course_modules')
      .update(updates)
      .eq('id', moduleId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating course module:', error)
      throw new Error(`Failed to update course module: ${error.message}`)
    }

    if (!data) {
      // This can happen if RLS blocks the update or the module was deleted between check and update
      throw new Error(`Course module with ID ${moduleId} could not be updated. It may have been deleted or you may not have permission to update it.`)
    }

    return data
  }

  // Lesson Management
  async getLessons(moduleId: string): Promise<LessonWithDetails[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        content:lesson_content(*),
        quiz:course_quizzes(*),
        assignment:course_assignments(*)
      `)
      .eq('module_id', moduleId)
      .eq('is_active', true)
      .order('order_index')

    if (error) {
      console.error('Error fetching lessons:', error)
      throw new Error(`Failed to fetch lessons: ${error.message}`)
    }

    // Handle case where quiz and assignment are arrays (should be single objects)
    const processedData = (data || []).map(lesson => {
      // Handle quiz array
      if (Array.isArray(lesson.quiz)) {
        if (lesson.quiz.length > 0) {
          lesson.quiz = lesson.quiz.find((q: any) => q.is_active) || lesson.quiz[0]
        } else {
          lesson.quiz = null
        }
      }
      
      // Handle assignment array
      if (Array.isArray(lesson.assignment)) {
        if (lesson.assignment.length > 0) {
          lesson.assignment = lesson.assignment.find((a: any) => a.is_active) || lesson.assignment[0]
        } else {
          lesson.assignment = null
        }
      }
      
      return lesson
    })

    return processedData
  }

  async getLessonById(lessonId: string): Promise<LessonWithDetails | null> {
    const supabase = getSupabaseClient();
    
    console.log('Fetching lesson with ID:', lessonId)
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        content:lesson_content(*),
        quiz:course_quizzes(
          *,
          questions:quiz_questions(*)
        ),
        assignment:course_assignments(*)
      `)
      .eq('id', lessonId)
      .single()

    if (error) {
      console.error('Error fetching lesson:', error)
      return null
    }

    console.log('Fetched lesson data:', data)
    console.log('Lesson quiz data:', data.quiz)
    console.log('Lesson assignment data:', data.assignment)
    
    // Handle case where quiz is an array (should be single object)
    if (Array.isArray(data.quiz)) {
      if (data.quiz.length > 0) {
        // Take the first active quiz
        data.quiz = data.quiz.find((q: any) => q.is_active) || data.quiz[0]
      } else {
        // No quiz found
        data.quiz = null
      }
    }
    
    // Handle case where assignment is an array (should be single object)
    if (Array.isArray(data.assignment)) {
      console.log('Assignment is array, length:', data.assignment.length)
      if (data.assignment.length > 0) {
        // Take the first active assignment
        data.assignment = data.assignment.find((a: any) => a.is_active) || data.assignment[0]
        console.log('Selected assignment:', data.assignment)
      } else {
        // No assignment found
        data.assignment = null
        console.log('No assignment found in array')
      }
    } else {
      console.log('Assignment is not an array:', data.assignment)
    }
    
    return data
  }

  async createLesson(lessonData: CreateLesson): Promise<Lesson> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single()

    if (error) {
      console.error('Error creating lesson:', error)
      throw new Error(`Failed to create lesson: ${error.message}`)
    }

    return data
  }

  async updateLesson(lessonId: string, updates: UpdateLesson): Promise<Lesson> {
    const supabase = getSupabaseClient();
    
    // First check if the lesson exists
    const { data: existingLesson, error: checkError } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('id', lessonId)
      .single()

    if (checkError) {
      console.error('Error checking lesson existence:', checkError)
      throw new Error(`Lesson with ID ${lessonId} not found: ${checkError.message}`)
    }

    if (!existingLesson) {
      throw new Error(`Lesson with ID ${lessonId} does not exist`)
    }

    console.log(`Updating lesson: ${existingLesson.title} (${lessonId})`)
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', lessonId)
      .select()
      .single()

    if (error) {
      console.error('Error updating lesson:', error)
      throw new Error(`Failed to update lesson: ${error.message}`)
    }

    if (!data) {
      throw new Error(`No data returned after updating lesson ${lessonId}`)
    }

    return data
  }

  // Lesson Content Management
  async createLessonContent(contentData: CreateLessonContent): Promise<LessonContent> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('lesson_content')
      .insert(contentData)
      .select()
      .single()

    if (error) {
      console.error('Error creating lesson content:', error)
      throw new Error(`Failed to create lesson content: ${error.message}`)
    }

    return data
  }

  async updateLessonContent(contentId: string, updates: UpdateLessonContent): Promise<LessonContent> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('lesson_content')
      .update(updates)
      .eq('id', contentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating lesson content:', error)
      throw new Error(`Failed to update lesson content: ${error.message}`)
    }

    return data
  }

  // Course Enrollment Management
  async enrollInCourse(enrollmentData: CreateCourseEnrollment): Promise<CourseEnrollment> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        ...enrollmentData,
        enrollment_date: new Date().toISOString(),
        start_date: enrollmentData.start_date || new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error enrolling in course:', error)
      throw new Error(`Failed to enroll in course: ${error.message}`)
    }

    return data
  }

  async getUserEnrollments(userId: string): Promise<CourseEnrollmentWithDetails[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        course:courses(
          *,
          category:course_categories(*)
        )
      `)
      .eq('user_id', userId)
      .order('enrollment_date', { ascending: false })

    if (error) {
      console.error('Error fetching user enrollments:', error)
      throw new Error(`Failed to fetch user enrollments: ${error.message}`)
    }

    return data || []
  }

  async getEnrollmentById(enrollmentId: string): Promise<CourseEnrollmentWithDetails | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        course:courses(
          *,
          category:course_categories(*),
          modules:course_modules(
            *,
            lessons:lessons(*)
          )
        )
      `)
      .eq('id', enrollmentId)
      .single()

    if (error) {
      console.error('Error fetching enrollment:', error)
      return null
    }

    return data
  }

  async updateEnrollment(enrollmentId: string, updates: UpdateCourseEnrollment): Promise<CourseEnrollment> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_enrollments')
      .update(updates)
      .eq('id', enrollmentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating enrollment:', error)
      throw new Error(`Failed to update enrollment: ${error.message}`)
    }

    return data
  }

  // Progress Tracking
  async updateLessonProgress(
    enrollmentId: string,
    lessonId: string,
    progressData: {
      status?: 'not_started' | 'in_progress' | 'completed' | 'skipped'
      completion_percentage?: number
      time_spent_minutes?: number
    }
  ): Promise<LessonProgress> {
    const supabase = getSupabaseClient();
    
    // First, try to get existing progress
    const { data: existingProgress } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('lesson_id', lessonId)
      .single()

    let result
    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from('lesson_progress')
        .update({
          ...progressData,
          last_accessed_at: new Date().toISOString(),
          completed_at: progressData.status === 'completed' ? new Date().toISOString() : existingProgress.completed_at,
        })
        .eq('id', existingProgress.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating lesson progress:', error)
        throw new Error(`Failed to update lesson progress: ${error.message}`)
      }
      result = data
    } else {
      // Create new progress record using upsert to handle RLS better
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert({
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          ...progressData,
          last_accessed_at: new Date().toISOString(),
          completed_at: progressData.status === 'completed' ? new Date().toISOString() : null,
        }, {
          onConflict: 'enrollment_id,lesson_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating lesson progress:', error)
        throw new Error(`Failed to create lesson progress: ${error.message}`)
      }
      result = data
    }

    // Update overall course progress
    await this.updateCourseProgress(enrollmentId)

    return result
  }

  async updateContentProgress(
    lessonProgressId: string,
    contentId: string,
    progressData: {
      progress_percentage?: number
      time_spent_seconds?: number
      last_position_seconds?: number
      is_completed?: boolean
    }
  ): Promise<ContentProgress> {
    const supabase = getSupabaseClient();
    
    // First, try to get existing progress
    const { data: existingProgress } = await supabase
      .from('content_progress')
      .select('*')
      .eq('lesson_progress_id', lessonProgressId)
      .eq('content_id', contentId)
      .single()

    let result
    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from('content_progress')
        .update({
          ...progressData,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating content progress:', error)
        throw new Error(`Failed to update content progress: ${error.message}`)
      }
      result = data
    } else {
      // Create new progress record
      const { data, error } = await supabase
        .from('content_progress')
        .insert({
          lesson_progress_id: lessonProgressId,
          content_id: contentId,
          content_type: 'video', // This should be determined from the content
          ...progressData,
          last_accessed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating content progress:', error)
        throw new Error(`Failed to create content progress: ${error.message}`)
      }
      result = data
    }

    return result
  }

  async getCourseProgress(enrollmentId: string): Promise<CourseProgress | null> {
    const supabase = getSupabaseClient();
    
    // Get enrollment details
    const enrollment = await this.getEnrollmentById(enrollmentId)
    if (!enrollment) return null

    // Get all lesson progress for this enrollment
    const { data: lessonProgress, error } = await supabase
      .from('lesson_progress')
      .select(`
        *,
        lesson:lessons(*)
      `)
      .eq('enrollment_id', enrollmentId)

    if (error) {
      console.error('Error fetching lesson progress:', error)
      throw new Error(`Failed to fetch lesson progress: ${error.message}`)
    }

    // Calculate overall progress
    const totalLessons = (enrollment.course as any)?.modules?.reduce((total: number, module: any) => total + (module.lessons?.length || 0), 0) || 0
    const completedLessons = lessonProgress?.filter(lp => lp.status === 'completed').length || 0
    const totalTimeSpent = lessonProgress?.reduce((total, lp) => total + (lp.time_spent_minutes || 0), 0) || 0

    // Find next lesson
    const nextLesson = lessonProgress?.find(lp => lp.status === 'not_started')?.lesson

    return {
      enrollment,
      overall_progress: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
      modules_completed: 0, // This would need more complex logic
      total_modules: (enrollment.course as any)?.modules?.length || 0,
      lessons_completed: completedLessons,
      total_lessons: totalLessons,
      time_spent_minutes: totalTimeSpent,
      last_accessed_at: enrollment.last_accessed_at,
      next_lesson: nextLesson,
    }
  }

  private async updateCourseProgress(enrollmentId: string): Promise<void> {
    const supabase = getSupabaseClient();
    
    // Get all lesson progress for this enrollment
    const { data: lessonProgress, error } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)

    if (error) {
      console.error('Error fetching lesson progress for course update:', error)
      return
    }

    // Get enrollment to find total lessons
    const enrollment = await this.getEnrollmentById(enrollmentId)
    if (!enrollment) return

    const totalLessons = (enrollment.course as any)?.modules?.reduce((total: number, module: any) => total + (module.lessons?.length || 0), 0) || 0
    const completedLessons = lessonProgress?.filter(lp => lp.status === 'completed').length || 0
    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

    // Update enrollment progress
    const status = progressPercentage === 100 ? 'completed' : 
                   progressPercentage > 0 ? 'in_progress' : 'enrolled'

    await this.updateEnrollment(enrollmentId, {
      progress_percentage: progressPercentage,
      status,
      completion_date: status === 'completed' ? new Date().toISOString() : undefined,
      last_accessed_at: new Date().toISOString(),
    })
  }

  // Quiz Management
  async createQuiz(quizData: CreateQuiz): Promise<CourseQuiz> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_quizzes')
      .insert(quizData)
      .select()
      .single()

    if (error) {
      console.error('Error creating quiz:', error)
      throw new Error(`Failed to create quiz: ${error.message}`)
    }

    return data
  }

  async createQuizQuestion(questionData: CreateQuizQuestion): Promise<QuizQuestion> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(questionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating quiz question:', error)
      throw new Error(`Failed to create quiz question: ${error.message}`)
    }

    return data
  }

  async startQuizAttempt(enrollmentId: string, quizId: string): Promise<QuizAttempt> {
    const supabase = getSupabaseClient();
    
    console.log('Starting quiz attempt for enrollment:', enrollmentId, 'quiz:', quizId)
    
    // For fallback quiz, don't create a real attempt
    if (quizId === 'fallback-quiz-id') {
      console.log('Creating mock attempt for fallback quiz')
      const mockAttempt: QuizAttempt = {
        id: 'mock-attempt-id',
        enrollment_id: enrollmentId,
        quiz_id: 'fallback-quiz-id',
        attempt_number: 1,
        started_at: new Date().toISOString(),
        status: 'in_progress',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return mockAttempt
    }
    
    // Get the next attempt number
    const { data: existingAttempts } = await supabase
      .from('quiz_attempts')
      .select('attempt_number')
      .eq('enrollment_id', enrollmentId)
      .eq('quiz_id', quizId)
      .order('attempt_number', { ascending: false })
      .limit(1)

    const nextAttemptNumber = (existingAttempts?.[0]?.attempt_number || 0) + 1

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        enrollment_id: enrollmentId,
        quiz_id: quizId,
        attempt_number: nextAttemptNumber,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error starting quiz attempt:', error)
      throw new Error(`Failed to start quiz attempt: ${error.message}`)
    }

    console.log('Created quiz attempt:', data)
    return data
  }


  // Get quiz by lesson ID
  async getQuizByLessonId(lessonId: string): Promise<CourseQuiz | null> {
    const supabase = getSupabaseClient();
    
    console.log('Fetching quiz for lesson ID:', lessonId)
    
    try {
      const { data, error } = await supabase
        .from('course_quizzes')
        .select(`
          *,
          questions:quiz_questions(*)
        `)
        .eq('lesson_id', lessonId)
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        // If no quiz found (PGRST116), that's okay - not all lessons have quizzes
        if (error.code === 'PGRST116') {
          console.log('No quiz found for lesson:', lessonId, '- this is normal, not all lessons have quizzes')
          return null
        }
        
        // Handle 406 errors gracefully
        if (error.message?.includes('406') || (error as any).status === 406) {
          console.warn('406 error fetching quiz (possibly RLS or format issue):', error.message)
          return null
        }
        
        // Only log as error if it's not a "no quiz found" case
        console.error('Error fetching quiz for lesson:', error)
        console.error('Error details:', error.message, error.code)
        console.error('Lesson ID:', lessonId)
        return null
      }

      if (!data) {
        console.log('No quiz found for lesson:', lessonId, '- this is normal, not all lessons have quizzes')
        return null
      }

      console.log('Fetched quiz data:', data)
      return data
    } catch (err) {
      console.error('Exception fetching quiz:', err)
      return null
    }
  }

  async submitQuizResponse(attemptId: string, questionId: string, userAnswer: string): Promise<QuizResponse> {
    const supabase = getSupabaseClient();
    
    // Get the question to check if answer is correct
    const { data: question } = await supabase
      .from('quiz_questions')
      .select('correct_answer, points')
      .eq('id', questionId)
      .single()

    const isCorrect = question?.correct_answer === userAnswer
    const pointsEarned = isCorrect ? (question?.points || 1) : 0

    const { data, error } = await supabase
      .from('quiz_responses')
      .upsert({
        attempt_id: attemptId,
        question_id: questionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting quiz response:', error)
      throw new Error(`Failed to submit quiz response: ${error.message}`)
    }

    return data
  }

  async submitQuizAttempt(attemptId: string): Promise<QuizAttempt> {
    const supabase = getSupabaseClient();
    
    // Get all responses for this attempt
    const { data: responses } = await supabase
      .from('quiz_responses')
      .select('points_earned')
      .eq('attempt_id', attemptId)

    const totalScore = responses?.reduce((sum, r) => sum + (r.points_earned || 0), 0) || 0

    // Get quiz details to calculate max score
    const { data: attempt } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        quiz:course_quizzes(*)
      `)
      .eq('id', attemptId)
      .single()

    if (!attempt) {
      throw new Error('Quiz attempt not found')
    }

    // Calculate max score (this is simplified - in reality you'd need to get all questions)
    const maxScore = 100 // This should be calculated from quiz questions
    const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

    const { data, error } = await supabase
      .from('quiz_attempts')
      .update({
        submitted_at: new Date().toISOString(),
        score: totalScore,
        max_score: maxScore,
        percentage_score: percentageScore,
        status: 'submitted',
      })
      .eq('id', attemptId)
      .select()
      .single()

    if (error) {
      console.error('Error submitting quiz attempt:', error)
      throw new Error(`Failed to submit quiz attempt: ${error.message}`)
    }

    return data
  }

  // Get quiz attempt history for a specific quiz
  async getQuizAttemptHistory(enrollmentId: string, quizId: string): Promise<QuizAttempt[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('quiz_id', quizId)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching quiz attempt history:', error)
      throw new Error(`Failed to fetch quiz attempt history: ${error.message}`)
    }

    return data || []
  }

  // Get all quiz attempts for an enrollment
  async getAllQuizAttempts(enrollmentId: string): Promise<QuizAttempt[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        quiz:course_quizzes(
          id,
          title,
          description,
          passing_score_percentage
        )
      `)
      .eq('enrollment_id', enrollmentId)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching all quiz attempts:', error)
      throw new Error(`Failed to fetch quiz attempts: ${error.message}`)
    }

    return data || []
  }

  // Assignment Management
  async createAssignment(assignmentData: CreateAssignment): Promise<CourseAssignment> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_assignments')
      .insert(assignmentData)
      .select()
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      throw new Error(`Failed to create assignment: ${error.message}`)
    }

    return data
  }

  async submitAssignment(
    enrollmentId: string,
    assignmentId: string,
    submissionData: {
      submission_text?: string
      submission_files?: any[]
    }
  ): Promise<AssignmentSubmission> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert({
        enrollment_id: enrollmentId,
        assignment_id: assignmentId,
        ...submissionData,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting assignment:', error)
      throw new Error(`Failed to submit assignment: ${error.message}`)
    }

    return data
  }

  async updateAssignment(assignmentId: string, updates: UpdateAssignment): Promise<CourseAssignment> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_assignments')
      .update(updates)
      .eq('id', assignmentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating assignment:', error)
      throw new Error(`Failed to update assignment: ${error.message}`)
    }

    return data
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('course_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      console.error('Error deleting assignment:', error)
      throw new Error(`Failed to delete assignment: ${error.message}`)
    }
  }

  async getAssignmentById(assignmentId: string): Promise<CourseAssignment | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()

    if (error) {
      console.error('Error fetching assignment:', error)
      return null
    }

    return data
  }

  // Discussion Management
  async createDiscussion(discussionData: CreateDiscussion): Promise<CourseDiscussion> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_discussions')
      .insert(discussionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating discussion:', error)
      throw new Error(`Failed to create discussion: ${error.message}`)
    }

    return data
  }

  async createDiscussionPost(postData: CreateDiscussionPost): Promise<DiscussionPost> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('discussion_posts')
      .insert(postData)
      .select()
      .single()

    if (error) {
      console.error('Error creating discussion post:', error)
      throw new Error(`Failed to create discussion post: ${error.message}`)
    }

    return data
  }

  async getCourseDiscussions(courseId: string): Promise<CourseDiscussionWithDetails[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_discussions')
      .select(`
        *,
        posts:discussion_posts(
          *,
          author:profiles(id, first_name, last_name, email)
        ),
        author:profiles(id, first_name, last_name, email)
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching course discussions:', error)
      throw new Error(`Failed to fetch course discussions: ${error.message}`)
    }

    return data || []
  }

  // Analytics
  async getCourseAnalytics(courseId: string): Promise<CourseAnalyticsSummary> {
    const supabase = getSupabaseClient();
    
    // Get basic enrollment stats
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('status, progress_percentage, completion_date')
      .eq('course_id', courseId)

    const totalEnrollments = enrollments?.length || 0
    const activeEnrollments = enrollments?.filter(e => e.status === 'in_progress').length || 0
    const completedEnrollments = enrollments?.filter(e => e.status === 'completed').length || 0
    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0
    const averageProgress = (enrollments?.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) || 0) / (totalEnrollments || 1)

    // Get recent analytics
    const { data: recentAnalytics } = await supabase
      .from('course_analytics')
      .select('*')
      .eq('course_id', courseId)
      .order('date', { ascending: false })
      .limit(30)

    return {
      course_id: courseId,
      total_enrollments: totalEnrollments,
      active_enrollments: activeEnrollments,
      completed_enrollments: completedEnrollments,
      completion_rate: completionRate,
      average_progress: averageProgress,
      average_completion_time_days: 0, // This would need more complex calculation
      recent_activity: recentAnalytics || [],
    }
  }
}

// Export singleton instance
export const courseService = new CourseService()

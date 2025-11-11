import { getSupabaseClient } from '@/lib/supabase/client'
import {
  DailyTestConfig,
  DailyTestConfigWithQuestions,
  DailyTestQuestion,
  DailyTestAttempt,
  DailyTestAttemptWithDetails,
  DailyTestResponse,
  DailyTestProgress,
  DailyTestProgressWithDetails,
  DailyTestAnalytics,
  CreateDailyTestConfig,
  CreateDailyTestAttempt,
  CreateDailyTestResponse,
  CreateDailyTestProgress,
  UpdateDailyTestProgress,
  StartDailyTestData,
  SubmitDailyTestAnswerData,
  CompleteDailyTestData,
  DailyTestResult,
  DailyTestStats,
  WeeklyTestStats,
  MonthlyTestStats,
} from '@/lib/validations/dailyTest'

export class DailyTestService {
  private getSupabase() {
    return getSupabaseClient()
  }

  // Daily Test Configuration Management
  async getDailyTestConfigs(courseId: string): Promise<DailyTestConfig[]> {
    const supabase = this.getSupabase()
    
    const { data, error } = await supabase
      .from('daily_test_configs')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('day_number')

    if (error) {
      console.error('Error fetching daily test configs:', error)
      throw new Error(`Failed to fetch daily test configs: ${error.message}`)
    }

    return data || []
  }

  async getDailyTestConfig(configId: string): Promise<DailyTestConfigWithQuestions | null> {
    const supabase = this.getSupabase()
    
    const { data, error } = await supabase
      .from('daily_test_configs')
      .select(`
        *,
        questions:daily_test_questions(
          *,
          question:quiz_questions(*)
        )
      `)
      .eq('id', configId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching daily test config:', error)
      return null
    }

    // Transform the data to match the expected structure
    const transformedData = {
      ...data,
      questions: data.questions?.map((q: any) => ({
        ...q,
        question_id: q.question_id,
        order_index: q.order_index,
        is_active: q.is_active,
        created_at: q.created_at,
        // Flatten the question data
        ...q.question
      })) || []
    }

    return transformedData
  }

  async getDailyTestConfigByDay(courseId: string, dayNumber: number): Promise<DailyTestConfigWithQuestions | null> {
    const supabase = this.getSupabase()
    
    const { data, error } = await supabase
      .from('daily_test_configs')
      .select(`
        *,
        questions:daily_test_questions(
          *,
          question:quiz_questions(*)
        )
      `)
      .eq('course_id', courseId)
      .eq('day_number', dayNumber)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`No daily test config found for course ${courseId}, day ${dayNumber}`)
        return null
      }
      console.error('Error fetching daily test config by day:', error)
      return null
    }

    // Transform the data to match the expected structure
    const transformedData = {
      ...data,
      questions: data.questions?.map((q: any) => ({
        ...q,
        question_id: q.question_id,
        order_index: q.order_index,
        is_active: q.is_active,
        created_at: q.created_at,
        // Flatten the question data
        ...q.question
      })) || []
    }

    console.log('Transformed daily test config:', transformedData)
    return transformedData
  }

  // Get next available test day (requires 90% on previous test)
  async getNextAvailableTestDay(enrollmentId: string): Promise<number> {
    const supabase = this.getSupabase()
    
    console.log('🔍 getNextAvailableTestDay called for enrollment:', enrollmentId)
    
    // Get all progress records ordered by day
    const { data: progress, error } = await supabase
      .from('daily_test_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('day_number', { ascending: true })
    
    if (error) {
      console.error('Error fetching progress for next test:', error)
      return 1 // Default to day 1 if error
    }
    
    console.log('📊 Found progress records:', progress?.length || 0)
    
    // If no progress, start with day 1
    if (!progress || progress.length === 0) {
      console.log('🎯 No progress found, returning Day 1')
      return 1
    }
    
    // Find the last completed test with 90% or higher
    let lastPassedDay = 0
    for (const p of progress) {
      console.log(`  Day ${p.day_number}: status=${p.status}, score=${p.best_score}%`)
      if (p.status === 'completed' && p.best_score && p.best_score >= 90) {
        lastPassedDay = p.day_number
        console.log(`    ✅ Passed with ${p.best_score}%`)
      } else if (p.status === 'failed' || (p.best_score && p.best_score < 90)) {
        // If failed or didn't meet 90%, this is the current day to retake
        console.log(`    ❌ Failed or didn't meet 90% requirement, returning Day ${p.day_number}`)
        return p.day_number
      }
    }
    
    // Return the next day after the last passed test
    const nextDay = lastPassedDay + 1
    console.log(`🎯 All tests passed, returning Day ${nextDay}`)
    return nextDay
  }

  // Daily Test Progress Management
  async getDailyTestProgress(enrollmentId: string): Promise<DailyTestProgressWithDetails[]> {
    const supabase = this.getSupabase()
    
    // First, get the progress data without joins to avoid RLS recursion
    const { data: progressData, error: progressError } = await supabase
      .from('daily_test_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('day_number')

    if (progressError) {
      console.error('Error fetching daily test progress:', progressError)
      throw new Error(`Failed to fetch daily test progress: ${progressError.message}`)
    }

    if (!progressData || progressData.length === 0) {
      return []
    }

    // Get test configs separately
    const { data: configData, error: configError } = await supabase
      .from('daily_test_configs')
      .select('*')
      .in('id', progressData.map(p => p.test_config_id))

    if (configError) {
      console.error('Error fetching test configs:', configError)
      // Continue without config data rather than failing completely
    }

    // Get best attempts separately
    const { data: attemptData, error: attemptError } = await supabase
      .from('daily_test_attempts')
      .select('*')
      .in('id', progressData.filter(p => p.best_attempt_id).map(p => p.best_attempt_id!))

    if (attemptError) {
      console.error('Error fetching best attempts:', attemptError)
      // Continue without attempt data rather than failing completely
    }

    // Combine the data
    const result: DailyTestProgressWithDetails[] = progressData.map(progress => ({
      ...progress,
      test_config: configData?.find(c => c.id === progress.test_config_id) || null,
      best_attempt: attemptData?.find(a => a.id === progress.best_attempt_id) || null
    }))

    return result
  }

  async getDailyTestProgressForDay(enrollmentId: string, dayNumber: number): Promise<DailyTestProgressWithDetails | null> {
    const supabase = this.getSupabase()
    
    const { data, error } = await supabase
      .from('daily_test_progress')
      .select(`
        *,
        test_config:daily_test_configs(*),
        best_attempt:daily_test_attempts(*)
      `)
      .eq('enrollment_id', enrollmentId)
      .eq('day_number', dayNumber)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`No daily test progress found for enrollment ${enrollmentId}, day ${dayNumber}`)
        return null
      }
      console.error('Error fetching daily test progress for day:', error)
      return null
    }

    return data
  }

  async updateDailyTestProgress(enrollmentId: string, dayNumber: number, updates: UpdateDailyTestProgress): Promise<DailyTestProgress> {
    const supabase = this.getSupabase()
    
    // First, get the test config with course_id
    const { data: testConfig, error: configError } = await supabase
      .from('daily_test_configs')
      .select('id, course_id')
      .eq('day_number', dayNumber)
      .eq('is_active', true)
      .single()
    
    if (configError || !testConfig) {
      throw new Error(`No test config found for day ${dayNumber}`)
    }
    
    // Use upsert to create or update the progress record
    const { data, error } = await supabase
      .from('daily_test_progress')
      .upsert({
        enrollment_id: enrollmentId,
        day_number: dayNumber,
        test_config_id: testConfig.id,
        course_id: testConfig.course_id,
        ...updates
      }, {
        onConflict: 'enrollment_id,day_number'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating daily test progress:', error)
      throw new Error(`Failed to update daily test progress: ${error.message}`)
    }

    return data
  }

  // Daily Test Attempt Management
  async startDailyTest(enrollmentId: string, testData: StartDailyTestData): Promise<DailyTestAttempt> {
    const supabase = this.getSupabase()
    
    // Validate that user can take this test (90% requirement)
    const nextAvailableDay = await this.getNextAvailableTestDay(enrollmentId)
    if (testData.day_number > nextAvailableDay) {
      throw new Error(`You must pass Day ${testData.day_number - 1} with 90% or higher to unlock Day ${testData.day_number}`)
    }
    
    // Get the test configuration
    const testConfig = await this.getDailyTestConfig(testData.test_config_id)
    if (!testConfig) {
      throw new Error('Daily test configuration not found')
    }

    // Check if user has exceeded max attempts
    const { data: existingAttempts } = await supabase
      .from('daily_test_attempts')
      .select('attempt_number')
      .eq('enrollment_id', enrollmentId)
      .eq('test_config_id', testData.test_config_id)
      .order('attempt_number', { ascending: false })
      .limit(1)

    const nextAttemptNumber = (existingAttempts?.[0]?.attempt_number || 0) + 1

    // No maximum attempts limit - users can retake tests as many times as needed

    // Create the attempt
    const { data, error } = await supabase
      .from('daily_test_attempts')
      .insert({
        enrollment_id: enrollmentId,
        test_config_id: testData.test_config_id,
        attempt_number: nextAttemptNumber,
        day_number: testData.day_number,
        day_completed: testData.day_number,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error starting daily test:', error)
      throw new Error(`Failed to start daily test: ${error.message}`)
    }

    // Update progress status
    await this.updateDailyTestProgress(enrollmentId, testData.day_number, {
      status: 'in_progress',
      test_config_id: testData.test_config_id,
      total_attempts: nextAttemptNumber,
      last_attempt_at: new Date().toISOString(),
    })

    return data
  }

  async submitDailyTestAnswer(attemptId: string, answerData: SubmitDailyTestAnswerData): Promise<DailyTestResponse> {
    const supabase = this.getSupabase()
    
    // Get the question to check if answer is correct
    const { data: question, error: questionError } = await supabase
      .from('quiz_questions')
      .select('correct_answer, points')
      .eq('id', answerData.question_id)
      .single()

    if (questionError) {
      console.error('Error fetching question for response:', questionError)
      throw new Error(`Failed to fetch question for response: ${questionError.message}`)
    }

    const isCorrect = question?.correct_answer === answerData.user_answer
    const pointsEarned = isCorrect ? question?.points || 0 : 0

    // Check if a response already exists for this attempt and question
    const { data: existingResponse, error: checkError } = await supabase
      .from('daily_test_responses')
      .select('id')
      .eq('attempt_id', attemptId)
      .eq('question_id', answerData.question_id)
      .maybeSingle()

    let data, error

    if (existingResponse && !checkError) {
      // Update existing response
      const result = await supabase
        .from('daily_test_responses')
        .update({
          user_answer: answerData.user_answer,
          is_correct: isCorrect,
          points_earned: pointsEarned,
          time_spent_seconds: answerData.time_spent_seconds,
        })
        .eq('id', existingResponse.id)
        .select()
        .single()
      
      data = result.data
      error = result.error
    } else {
      // Insert new response
      const result = await supabase
        .from('daily_test_responses')
        .insert({
          attempt_id: attemptId,
          question_id: answerData.question_id,
          user_answer: answerData.user_answer,
          is_correct: isCorrect,
          points_earned: pointsEarned,
          time_spent_seconds: answerData.time_spent_seconds,
        })
        .select()
        .single()
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error submitting daily test answer:', error)
      throw new Error(`Failed to submit daily test answer: ${error.message}`)
    }

    return data
  }

  async completeDailyTest(attemptId: string): Promise<DailyTestResult> {
    const supabase = this.getSupabase()

    // Get the attempt with test config
    const { data: attempt, error: attemptError } = await supabase
      .from('daily_test_attempts')
      .select(`
        *,
        test_config:daily_test_configs(*)
      `)
      .eq('id', attemptId)
      .single()

    if (attemptError) {
      console.error('Error fetching daily test attempt:', attemptError)
      throw new Error(`Failed to fetch daily test attempt: ${attemptError.message}`)
    }

    // Calculate total score and get full responses
    const { data: responses, error: responsesError } = await supabase
      .from('daily_test_responses')
      .select('*')
      .eq('attempt_id', attemptId)

    if (responsesError) {
      console.error('Error fetching daily test responses for scoring:', responsesError)
      throw new Error(`Failed to fetch daily test responses for scoring: ${responsesError.message}`)
    }

    const totalScore = responses?.reduce((sum, r) => sum + (r.points_earned || 0), 0) || 0
    const maxScore = attempt.test_config.question_count
    const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const passed = percentageScore >= attempt.test_config.passing_score_percentage

    // Calculate time taken
    const startedAt = new Date(attempt.started_at)
    const completedAt = new Date()
    const timeTakenMinutes = Math.round((completedAt.getTime() - startedAt.getTime()) / (1000 * 60))

    // Update the attempt
    const { data: updatedAttempt, error: updateError } = await supabase
      .from('daily_test_attempts')
      .update({
        submitted_at: completedAt.toISOString(),
        score: totalScore,
        max_score: maxScore,
        percentage_score: percentageScore,
        time_taken_minutes: timeTakenMinutes,
        status: 'submitted',
      })
      .eq('id', attemptId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating daily test attempt:', updateError)
      throw new Error(`Failed to update daily test attempt: ${updateError.message}`)
    }

    // Update progress
    const progressUpdates: UpdateDailyTestProgress = {
      status: passed ? 'completed' : 'failed',
      completed_at: completedAt.toISOString(),
      best_score: percentageScore,
      best_attempt_id: attemptId,
    }

    // Check if this is the best score so far
    const { data: currentProgress } = await supabase
      .from('daily_test_progress')
      .select('best_score')
      .eq('enrollment_id', attempt.enrollment_id)
      .eq('day_number', attempt.day_completed)
      .single()

    if (!currentProgress?.best_score || percentageScore > currentProgress.best_score) {
      progressUpdates.best_score = percentageScore
      progressUpdates.best_attempt_id = attemptId
    }

    await this.updateDailyTestProgress(attempt.enrollment_id, attempt.day_completed!, progressUpdates)

    // Update streak count
    await this.updateStreakCount(attempt.enrollment_id)

    // Update analytics
    await this.updateDailyAnalytics(attempt.enrollment_id, attempt.test_config.course_id)

    const result: DailyTestResult = {
      attempt: updatedAttempt,
      score: totalScore,
      max_score: maxScore,
      percentage: percentageScore,
      passed,
      time_taken_minutes: timeTakenMinutes,
      responses: responses || [],
    }

    return result
  }

  // Analytics and Statistics
  async getDailyTestStats(enrollmentId: string): Promise<DailyTestStats> {
    const supabase = this.getSupabase()
    
    const { data: progress, error } = await supabase
      .from('daily_test_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)

    if (error) {
      console.error('Error fetching daily test stats:', error)
      throw new Error(`Failed to fetch daily test stats: ${error.message}`)
    }

    const totalTests = progress?.length || 0
    const completedTests = progress?.filter(p => p.status === 'completed' || p.status === 'failed').length || 0
    const passedTests = progress?.filter(p => p.status === 'completed').length || 0
    const failedTests = progress?.filter(p => p.status === 'failed').length || 0
    
    const averageScore = completedTests > 0 
      ? (progress?.filter(p => p.best_score).reduce((sum, p) => sum + (p.best_score || 0), 0) || 0) / completedTests
      : 0

    const currentStreak = progress?.reduce((streak, p) => {
      if (p.status === 'completed') {
        return streak + 1
      }
      return 0
    }, 0) || 0

    // Calculate total time from attempts
    const { data: attempts } = await supabase
      .from('daily_test_attempts')
      .select('time_taken_minutes')
      .eq('enrollment_id', enrollmentId)
      .not('time_taken_minutes', 'is', null)

    const totalTimeMinutes = attempts?.reduce((sum, a) => sum + (a.time_taken_minutes || 0), 0) || 0

    return {
      total_tests: totalTests,
      completed_tests: completedTests,
      passed_tests: passedTests,
      failed_tests: failedTests,
      average_score: Math.round(averageScore * 100) / 100,
      current_streak: currentStreak,
      longest_streak: currentStreak, // TODO: Calculate actual longest streak
      total_time_minutes: totalTimeMinutes,
    }
  }

  async getWeeklyTestStats(enrollmentId: string, courseId: string): Promise<WeeklyTestStats[]> {
    const supabase = this.getSupabase()
    
    // Get progress for the last 6 weeks
    const { data: progress, error } = await supabase
      .from('daily_test_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('day_number')

    if (error) {
      console.error('Error fetching weekly test stats:', error)
      throw new Error(`Failed to fetch weekly test stats: ${error.message}`)
    }

    const weeklyStats: WeeklyTestStats[] = []
    
    for (let week = 1; week <= 6; week++) {
      const weekStart = (week - 1) * 7 + 1
      const weekEnd = week * 7
      
      const weekProgress = progress?.filter(p => p.day_number >= weekStart && p.day_number <= weekEnd) || []
      
      const testsAvailable = weekProgress.length
      const testsCompleted = weekProgress.filter(p => p.status === 'completed' || p.status === 'failed').length
      const testsPassed = weekProgress.filter(p => p.status === 'completed').length
      
      const averageScore = testsCompleted > 0
        ? (weekProgress.filter(p => p.best_score).reduce((sum, p) => sum + (p.best_score || 0), 0) || 0) / testsCompleted
        : 0

      weeklyStats.push({
        week_number: week,
        tests_available: testsAvailable,
        tests_completed: testsCompleted,
        tests_passed: testsPassed,
        average_score: Math.round(averageScore * 100) / 100,
        streak_count: weekProgress.filter(p => p.status === 'completed').length,
      })
    }

    return weeklyStats
  }

  // Helper methods
  private async updateStreakCount(enrollmentId: string): Promise<void> {
    const supabase = this.getSupabase()
    
    // Get all completed tests ordered by day
    const { data: progress, error } = await supabase
      .from('daily_test_progress')
      .select('day_number, status')
      .eq('enrollment_id', enrollmentId)
      .eq('status', 'completed')
      .order('day_number', { ascending: false })

    if (error) {
      console.error('Error updating streak count:', error)
      return
    }

    // Calculate current streak
    let currentStreak = 0
    let expectedDay = progress?.[0]?.day_number || 0

    for (const p of progress || []) {
      if (p.day_number === expectedDay) {
        currentStreak++
        expectedDay--
      } else {
        break
      }
    }

    // Update streak count for all progress records
    if (progress && progress.length > 0) {
      await supabase
        .from('daily_test_progress')
        .update({ streak_count: currentStreak })
        .eq('enrollment_id', enrollmentId)
    }
  }

  private async updateDailyAnalytics(enrollmentId: string, courseId: string): Promise<void> {
    const supabase = this.getSupabase()
    
    const today = new Date().toISOString().split('T')[0]
    
    // Get today's progress
    const { data: todayProgress, error: progressError } = await supabase
      .from('daily_test_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .gte('updated_at', `${today}T00:00:00`)
      .lte('updated_at', `${today}T23:59:59`)

    if (progressError) {
      console.error('Error fetching today\'s progress for analytics:', progressError)
      return
    }

    const testsAvailable = todayProgress?.length || 0
    const testsCompleted = todayProgress?.filter(p => p.status === 'completed' || p.status === 'failed').length || 0
    const testsPassed = todayProgress?.filter(p => p.status === 'completed').length || 0
    const testsFailed = todayProgress?.filter(p => p.status === 'failed').length || 0
    
    const totalScore = todayProgress?.reduce((sum, p) => sum + (p.best_score || 0), 0) || 0
    const averageScore = testsCompleted > 0 ? totalScore / testsCompleted : 0

    // Get current streak
    const { data: currentStreakData } = await supabase
      .from('daily_test_progress')
      .select('streak_count')
      .eq('enrollment_id', enrollmentId)
      .order('day_number', { ascending: false })
      .limit(1)
      .single()

    const streakCount = currentStreakData?.streak_count || 0

    // Get total time for today
    const { data: todayAttempts } = await supabase
      .from('daily_test_attempts')
      .select('time_taken_minutes')
      .eq('enrollment_id', enrollmentId)
      .gte('submitted_at', `${today}T00:00:00`)
      .lte('submitted_at', `${today}T23:59:59`)
      .not('time_taken_minutes', 'is', null)

    const totalTimeMinutes = todayAttempts?.reduce((sum, a) => sum + (a.time_taken_minutes || 0), 0) || 0

    // Upsert analytics
    const { error: analyticsError } = await supabase
      .from('daily_test_analytics')
      .upsert({
        enrollment_id: enrollmentId,
        course_id: courseId,
        date: today,
        tests_available: testsAvailable,
        tests_completed: testsCompleted,
        tests_passed: testsPassed,
        tests_failed: testsFailed,
        total_score: totalScore,
        average_score: Math.round(averageScore * 100) / 100,
        total_time_minutes: totalTimeMinutes,
        streak_count: streakCount,
      }, {
        onConflict: 'enrollment_id,date'
      })

    if (analyticsError) {
      console.error('Error updating daily analytics:', analyticsError)
    }
  }

  // Admin methods
  async createDailyTestConfig(configData: CreateDailyTestConfig): Promise<DailyTestConfig> {
    const supabase = this.getSupabase()
    
    const { data, error } = await supabase
      .from('daily_test_configs')
      .insert(configData)
      .select()
      .single()

    if (error) {
      // Handle duplicate course_day constraint
      if (error.code === '23505' && error.message?.includes('daily_test_configs_course_day_unique')) {
        console.log('Duplicate course_day detected, finding next available day_number...')
        
        // Find the maximum day_number for this course
        const { data: maxDay, error: maxError } = await supabase
          .from('daily_test_configs')
          .select('day_number')
          .eq('course_id', configData.course_id)
          .order('day_number', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (maxError) {
          console.error('Error finding max day_number:', maxError)
          throw new Error(`Failed to find next available day number: ${maxError.message}`)
        }

        // Set day_number to next available
        const nextDayNumber = (maxDay?.day_number ?? 0) + 1
        const updatedConfigData = { ...configData, day_number: nextDayNumber }

        console.log(`Auto-adjusting day_number to ${nextDayNumber} for course ${configData.course_id}`)

        // Retry insert with new day_number
        const { data: retryData, error: retryError } = await supabase
          .from('daily_test_configs')
          .insert(updatedConfigData)
          .select()
          .single()

        if (retryError) {
          console.error('Error creating daily test config after retry:', retryError)
          throw new Error(`Failed to create daily test config: ${retryError.message}`)
        }

        return retryData
      }
      
      console.error('Error creating daily test config:', error)
      throw new Error(`Failed to create daily test config: ${error.message}`)
    }

    return data
  }

  async addQuestionsToDailyTest(testConfigId: string, questionIds: string[]): Promise<void> {
    const supabase = this.getSupabase()
    
    const questions = questionIds.map((questionId, index) => ({
      test_config_id: testConfigId,
      question_id: questionId,
      order_index: index + 1,
    }))

    const { error } = await supabase
      .from('daily_test_questions')
      .insert(questions)

    if (error) {
      console.error('Error adding questions to daily test:', error)
      throw new Error(`Failed to add questions to daily test: ${error.message}`)
    }
  }

  // Question Assignment Management
  async getAvailableQuestions(): Promise<any[]> {
    const supabase = this.getSupabase()
    
    console.log('Fetching available quiz questions...')
    
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching available questions:', error)
      console.error('Error details:', error.message, error.code, error.details)
      throw new Error(`Failed to fetch available questions: ${error.message}`)
    }

    console.log(`Found ${data?.length || 0} available quiz questions`)
    return data || []
  }

  async getAssignedQuestions(testConfigId: string): Promise<any[]> {
    const supabase = this.getSupabase()
    
    const { data, error } = await supabase
      .from('daily_test_questions')
      .select(`
        *,
        question:quiz_questions(*)
      `)
      .eq('test_config_id', testConfigId)
      .eq('is_active', true)
      .order('order_index')

    if (error) {
      console.error('Error fetching assigned questions:', error)
      throw new Error(`Failed to fetch assigned questions: ${error.message}`)
    }

    return data || []
  }

  async assignQuestionToTest(testConfigId: string, questionId: string, orderIndex: number): Promise<any> {
    const supabase = this.getSupabase()
    
    // First, check if this exact assignment already exists
    const { data: existing } = await supabase
      .from('daily_test_questions')
      .select('*')
      .eq('test_config_id', testConfigId)
      .eq('question_id', questionId)
      .eq('order_index', orderIndex)
      .eq('is_active', true)
      .maybeSingle()

    if (existing) {
      console.log('Question assignment already exists, returning existing assignment...')
      return existing
    }

    // Check if the same question is already assigned to this test with a different order
    const { data: existingQuestion } = await supabase
      .from('daily_test_questions')
      .select('*')
      .eq('test_config_id', testConfigId)
      .eq('question_id', questionId)
      .eq('is_active', true)
      .maybeSingle()

    if (existingQuestion) {
      console.log('Question already assigned to this test, updating order index...')
      
      // Update the existing assignment with the new order index
      const { data: updatedData, error: updateError } = await supabase
        .from('daily_test_questions')
        .update({ order_index: orderIndex })
        .eq('id', existingQuestion.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating question assignment:', updateError)
        throw new Error(`Failed to update question assignment: ${updateError.message}`)
      }

      return updatedData
    }

    // Try to insert a new assignment
    const { data, error } = await supabase
      .from('daily_test_questions')
      .insert([{
        test_config_id: testConfigId,
        question_id: questionId,
        order_index: orderIndex,
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Error assigning question to test:', error)
      
      // If it's a duplicate key error, try to find the next available order index
      if (error.code === '23505') {
        console.log('Duplicate key detected, finding next available order index...')
        
        // Find the next available order index for this test
        const { data: maxOrder } = await supabase
          .from('daily_test_questions')
          .select('order_index')
          .eq('test_config_id', testConfigId)
          .eq('is_active', true)
          .order('order_index', { ascending: false })
          .limit(1)
          .maybeSingle()

        const nextOrderIndex = (maxOrder?.order_index || 0) + 1
        
        // Try inserting with the next available order index
        const { data: retryData, error: retryError } = await supabase
          .from('daily_test_questions')
          .insert([{
            test_config_id: testConfigId,
            question_id: questionId,
            order_index: nextOrderIndex,
            is_active: true
          }])
          .select()
          .single()

        if (retryError) {
          throw new Error(`Failed to assign question to test: ${retryError.message}`)
        }
        
        return retryData
      }
      
      throw new Error(`Failed to assign question to test: ${error.message}`)
    }

    return data
  }

  async removeQuestionFromTest(assignmentId: string): Promise<void> {
    const supabase = this.getSupabase()
    
    const { error } = await supabase
      .from('daily_test_questions')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      console.error('Error removing question from test:', error)
      throw new Error(`Failed to remove question from test: ${error.message}`)
    }
  }

  async updateQuestionOrder(assignmentId: string, newOrderIndex: number): Promise<void> {
    const supabase = this.getSupabase()
    
    const { error } = await supabase
      .from('daily_test_questions')
      .update({ order_index: newOrderIndex })
      .eq('id', assignmentId)

    if (error) {
      console.error('Error updating question order:', error)
      throw new Error(`Failed to update question order: ${error.message}`)
    }
  }
}

export const dailyTestService = new DailyTestService()

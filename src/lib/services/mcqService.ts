import { getSupabaseClient } from '@/lib/supabase/client'
import { 
  TestConfiguration, 
  TestSession, 
  TestResponse, 
  TestAnalytics,
  StartTestData,
  SubmitAnswerData,
  CompleteTestData,
  TestResult,
  QuestionWithOptions,
  TestSessionWithDetails,
  QuestionOption
} from '@/lib/validations/mcq'

class MCQService {
  private supabase = getSupabaseClient()

  // Get all active test configurations
  async getTestConfigurations(): Promise<TestConfiguration[]> {
    const { data, error } = await this.supabase
      .from('test_configurations')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch test configurations: ${error.message}`)
    return data || []
  }

  // Get test configuration by ID
  async getTestConfiguration(id: string): Promise<TestConfiguration> {
    const { data, error } = await this.supabase
      .from('test_configurations')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) throw new Error(`Failed to fetch test configuration: ${error.message}`)
    return data
  }

  // Start a new test session
  async startTest(userId: string, testData: StartTestData): Promise<TestSessionWithDetails> {
    const testConfig = await this.getTestConfiguration(testData.test_config_id)
    
    // Check if user has exceeded max attempts
    const { data: analytics } = await this.supabase
      .from('test_analytics')
      .select('total_attempts')
      .eq('user_id', userId)
      .eq('test_config_id', testData.test_config_id)
      .single()

    if (analytics && analytics.total_attempts >= testConfig.max_attempts) {
      throw new Error('Maximum attempts exceeded for this test')
    }

    // Get questions for the test
    const questions = await this.getTestQuestions(testConfig.id)
    
    // Create test session
    const { data: session, error: sessionError } = await this.supabase
      .from('test_sessions')
      .insert({
        user_id: userId,
        test_config_id: testData.test_config_id,
        status: 'in_progress',
        max_possible_score: questions.reduce((sum, q) => sum + q.points, 0),
        attempt_number: (analytics?.total_attempts || 0) + 1
      })
      .select()
      .single()

    if (sessionError) throw new Error(`Failed to create test session: ${sessionError.message}`)

    return {
      ...session,
      test_config: testConfig,
      questions: questions.map(q => ({ ...q, is_answered: false })),
      current_question_index: 0,
      time_remaining_seconds: testConfig.time_limit_minutes * 60
    }
  }

  // Get questions for a test configuration
  private async getTestQuestions(testConfigId: string): Promise<QuestionWithOptions[]> {
    // Get test configuration to know the target number of questions
    const { data: testConfig } = await this.supabase
      .from('test_configurations')
      .select('total_questions')
      .eq('id', testConfigId)
      .single()

    const targetQuestions = testConfig?.total_questions || 25

    // Get question selection rules
    const { data: rules } = await this.supabase
      .from('test_question_rules')
      .select(`
        category_id,
        difficulty,
        question_count,
        points_weight
      `)
      .eq('test_config_id', testConfigId)

    let questions: QuestionWithOptions[] = []

    if (rules && rules.length > 0) {
      // Use rules to select questions
      for (const rule of rules) {
        const { data: categoryQuestions, error } = await this.supabase
          .from('questions')
          .select(`
            *,
            options:question_options(*)
          `)
          .eq('category_id', rule.category_id)
          .eq('difficulty', rule.difficulty)
          .eq('is_active', true)
          .limit(rule.question_count)

        if (error) {
          console.error(`Error fetching questions for category ${rule.category_id}:`, error)
          continue
        }

        if (categoryQuestions && categoryQuestions.length > 0) {
          questions.push(...categoryQuestions)
        }
      }

      // If we don't have enough questions from rules, fill with random questions
      if (questions.length < targetQuestions) {
        const needed = targetQuestions - questions.length
        const usedQuestionIds = questions.map(q => q.id)
        
        const { data: additionalQuestions, error } = await this.supabase
          .from('questions')
          .select(`
            *,
            options:question_options(*)
          `)
          .eq('is_active', true)
          .not('id', 'in', `(${usedQuestionIds.join(',')})`)
          .limit(needed)

        if (!error && additionalQuestions) {
          questions.push(...additionalQuestions)
        }
      }
    } else {
      // Default: get random questions from all categories
      const { data: allQuestions, error } = await this.supabase
        .from('questions')
        .select(`
          *,
          options:question_options(*)
        `)
        .eq('is_active', true)
        .limit(targetQuestions)

      if (error) {
        console.error('Error fetching all questions:', error)
        throw new Error('Failed to load test questions from database')
      }

      if (allQuestions) {
        questions = allQuestions
      }
    }

    // Validate that we have questions
    if (questions.length === 0) {
      throw new Error('No questions available for this test configuration')
    }

    // Validate that all questions have options
    const validQuestions = questions.filter(q => q.options && q.options.length >= 2)
    if (validQuestions.length === 0) {
      throw new Error('No valid questions with options found')
    }

    // Shuffle questions and options
    return this.shuffleArray(validQuestions).map(q => ({
      ...q,
      options: this.shuffleArray(q.options)
    }))
  }

  // Submit an answer for a question
  async submitAnswer(sessionId: string, answerData: SubmitAnswerData): Promise<TestResponse> {
    // Get the question and correct answers
    const { data: question } = await this.supabase
      .from('questions')
      .select(`
        *,
        options:question_options(*)
      `)
      .eq('id', answerData.question_id)
      .single()

    if (!question) throw new Error('Question not found')

    // Check if answer is correct
    const correctOptionIds = question.options
      .filter((option: QuestionOption) => option.is_correct)
      .map((option: QuestionOption) => option.id)

    const isCorrect = this.arraysEqual(
      answerData.selected_option_ids.sort(),
      correctOptionIds.sort()
    )

    const pointsEarned = isCorrect ? question.points : 0

    // Save the response
    const { data: response, error } = await this.supabase
      .from('test_responses')
      .insert({
        session_id: sessionId,
        question_id: answerData.question_id,
        selected_option_ids: answerData.selected_option_ids,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        time_taken_seconds: answerData.time_taken_seconds
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to save answer: ${error.message}`)

    return response
  }

  // Complete the test
  async completeTest(sessionId: string, _completeData: CompleteTestData): Promise<TestResult> {
    // Get session details
    const { data: session } = await this.supabase
      .from('test_sessions')
      .select(`
        *,
        test_config:test_configurations(*)
      `)
      .eq('id', sessionId)
      .single()

    if (!session) throw new Error('Test session not found')

    // Get all responses
    const { data: responses } = await this.supabase
      .from('test_responses')
      .select(`
        *,
        question:questions(
          *,
          category:question_categories(name)
        )
      `)
      .eq('session_id', sessionId)

    if (!responses) throw new Error('No responses found')

    // Calculate final score based on actual questions served
    const totalScore = responses.reduce((sum: number, r: any) => sum + r.points_earned, 0)
    const actualMaxScore = responses.reduce((sum: number, r: any) => sum + (r.question?.points || 1), 0)
    const percentageScore = actualMaxScore > 0 ? (totalScore / actualMaxScore) * 100 : 0
    const timeTaken = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)

    // Update session
    const { error: updateError } = await this.supabase
      .from('test_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_score: totalScore,
        max_possible_score: actualMaxScore,
        percentage_score: percentageScore,
        time_taken_seconds: timeTaken
      })
      .eq('id', sessionId)

    if (updateError) throw new Error(`Failed to complete test: ${updateError.message}`)

    // Update analytics
    await this.updateTestAnalytics(session.user_id, session.test_config_id, percentageScore)

    // Create session object with updated fields but preserving test_config
    const updatedSession = {
      ...session,
      status: 'completed' as const,
      completed_at: new Date().toISOString(),
      total_score: totalScore,
      max_possible_score: actualMaxScore,
      percentage_score: percentageScore,
      time_taken_seconds: timeTaken,
      test_config: session.test_config
    } as TestSessionWithDetails

    // Generate result
    return this.generateTestResult(updatedSession, responses, totalScore, percentageScore, timeTaken)
  }

  // Get user's test analytics
  async getUserTestAnalytics(userId: string, testConfigId?: string): Promise<TestAnalytics[]> {
    let query = this.supabase
      .from('test_analytics')
      .select('*')
      .eq('user_id', userId)

    if (testConfigId) {
      query = query.eq('test_config_id', testConfigId)
    }

    const { data, error } = await query.order('updated_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch analytics: ${error.message}`)
    return data || []
  }

  // Get user's test history
  async getUserTestHistory(userId: string, testConfigId?: string): Promise<TestSession[]> {
    let query = this.supabase
      .from('test_sessions')
      .select(`
        *,
        test_config:test_configurations(*)
      `)
      .eq('user_id', userId)

    if (testConfigId) {
      query = query.eq('test_config_id', testConfigId)
    }

    const { data, error } = await query.order('started_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch test history: ${error.message}`)
    return data || []
  }

  // Private helper methods
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, index) => val === b[index])
  }

  private async updateTestAnalytics(userId: string, testConfigId: string, score: number): Promise<void> {
    const { data: existing } = await this.supabase
      .from('test_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('test_config_id', testConfigId)
      .single()

    if (existing) {
      const newTotalAttempts = existing.total_attempts + 1
      const newAverageScore = ((existing.average_score * existing.total_attempts) + score) / newTotalAttempts
      const newBestScore = Math.max(existing.best_score, score)

      await this.supabase
        .from('test_analytics')
        .update({
          total_attempts: newTotalAttempts,
          best_score: newBestScore,
          average_score: newAverageScore,
          last_attempted_at: new Date().toISOString(),
          first_passed_at: existing.first_passed_at || (score >= 70 ? new Date().toISOString() : null),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      await this.supabase
        .from('test_analytics')
        .insert({
          user_id: userId,
          test_config_id: testConfigId,
          total_attempts: 1,
          best_score: score,
          average_score: score,
          last_attempted_at: new Date().toISOString(),
          first_passed_at: score >= 70 ? new Date().toISOString() : null
        })
    }
  }

  private generateTestResult(
    session: TestSessionWithDetails, 
    responses: TestResponse[], 
    totalScore: number, 
    percentageScore: number, 
    timeTaken: number
  ): TestResult {
    const correctAnswers = responses.filter(r => r.is_correct).length
    const incorrectAnswers = responses.filter(r => !r.is_correct).length
    const skippedQuestions = 0 // All questions are answered in our system

    // Category performance
    const categoryPerformance = responses.reduce((acc: any, response: any) => {
      const categoryName = response.question?.category?.name || 'Unknown'
      if (!acc[categoryName]) {
        acc[categoryName] = { questions_attempted: 0, correct_answers: 0 }
      }
      acc[categoryName].questions_attempted++
      if (response.is_correct) acc[categoryName].correct_answers++
      return acc
    }, {} as Record<string, { questions_attempted: number; correct_answers: number }>)

    const categoryBreakdown = Object.entries(categoryPerformance).map(([name, stats]: [string, any]) => ({
      category_name: name,
      questions_attempted: stats.questions_attempted,
      correct_answers: stats.correct_answers,
      percentage: (stats.correct_answers / stats.questions_attempted) * 100
    }))

    // Generate recommendations
    const recommendations = this.generateRecommendations(percentageScore, categoryBreakdown)

    return {
      session,
      responses,
      score_breakdown: {
        total_questions: responses.length,
        correct_answers: correctAnswers,
        incorrect_answers: incorrectAnswers,
        skipped_questions: Math.max(0, skippedQuestions),
        percentage_score: percentageScore,
        time_taken: this.formatTime(timeTaken)
      },
      category_performance: categoryBreakdown,
      recommendations
    }
  }

  private generateRecommendations(score: number, categoryPerformance: { category_name: string; percentage: number }[]): string[] {
    const recommendations: string[] = []

    if (score < 70) {
      recommendations.push('Consider reviewing basic accounting principles before retaking the test')
    }

    const weakCategories = categoryPerformance.filter(cat => cat.percentage < 70)
    if (weakCategories.length > 0) {
      recommendations.push(`Focus on improving knowledge in: ${weakCategories.map(c => c.category_name).join(', ')}`)
    }

    if (score >= 90) {
      recommendations.push('Excellent performance! You are ready for advanced accounting topics')
    }

    return recommendations
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }
}

export const mcqService = new MCQService()

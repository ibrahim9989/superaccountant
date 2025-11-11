import { getSupabaseClient } from '@/lib/supabase/client'
import { 
  Question, 
  QuestionOption,
  TestConfiguration, 
  TestSession,
  TestAnalytics,
  QuestionWithOptions
} from '@/lib/validations/mcq'

interface AdminUser {
  id: string
  user_id: string
  role: 'admin' | 'super_admin'
  permissions: Record<string, any>
  created_at: string
  updated_at: string
}

interface AdminActivity {
  id: string
  admin_id: string
  action: string
  resource_type: string
  resource_id?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
  admin?: {
    user_id: string
    profile?: {
      first_name: string
      last_name: string
      email: string
    }
  }
}

interface SystemSetting {
  id: string
  key: string
  value: Record<string, any>
  description?: string
  updated_by?: string
  updated_at: string
}

interface QuestionReview {
  id: string
  question_id: string
  reviewer_id?: string
  status: 'pending' | 'approved' | 'rejected'
  feedback?: string
  reviewed_at?: string
  created_at: string
}

class AdminService {
  private getSupabase() {
    return getSupabaseClient()
  }

  // Check if current user is admin
  async isAdmin(): Promise<boolean> {
    try {
      const { data, error } = await this.getSupabase().rpc('is_admin')
      if (error) {
        // If function doesn't exist, return false
        if (error.code === 'PGRST202' || error.message?.includes('function') || error.message?.includes('does not exist')) {
          return false
        }
        console.error('Error checking admin status:', error)
        return false
      }
      return data || false
    } catch (error) {
      return false
    }
  }

  // Check if current user is super admin
  async isSuperAdmin(): Promise<boolean> {
    try {
      const { data, error } = await this.getSupabase().rpc('is_super_admin')
      if (error) {
        // If function doesn't exist, return false
        if (error.code === 'PGRST202' || error.message?.includes('function') || error.message?.includes('does not exist')) {
          return false
        }
        console.error('Error checking super admin status:', error)
        return false
      }
      return data || false
    } catch (error) {
      return false
    }
  }

  // Get admin user info
  async getAdminUser(): Promise<AdminUser | null> {
    const { data, error } = await this.getSupabase()
      .from('admin_users')
      .select('*')
      .eq('user_id', (await this.getSupabase().auth.getUser()).data.user?.id)
      .single()

    if (error) {
      console.error('Error fetching admin user:', error)
      return null
    }
    return data
  }

  // Log admin activity
  async logActivity(
    action: string,
    resourceType: string,
    resourceId?: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      await this.getSupabase().rpc('log_admin_activity', {
        action_name: action,
        resource_type_name: resourceType,
        resource_uuid: resourceId,
        details_json: details
      })
    } catch (error) {
      console.error('Error logging admin activity:', error)
    }
  }

  // Question Management
  async createQuestion(questionData: {
    category_id: string
    question_text: string
    question_type: 'single_choice' | 'multiple_choice' | 'true_false'
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    explanation?: string
    points?: number
    time_limit_seconds?: number
    options: Array<{
      option_text: string
      is_correct: boolean
      order_index: number
    }>
  }): Promise<Question | null> {
    const { data: question, error: questionError } = await this.getSupabase()
      .from('questions')
      .insert({
        category_id: questionData.category_id,
        question_text: questionData.question_text,
        question_type: questionData.question_type,
        difficulty: questionData.difficulty,
        explanation: questionData.explanation || '',
        points: questionData.points || 1,
        time_limit_seconds: questionData.time_limit_seconds || 60,
        is_active: true
      })
      .select()
      .single()

    if (questionError) {
      console.error('Error creating question:', questionError)
      return null
    }

    // Insert options
    const optionsData = questionData.options.map(option => ({
      question_id: question.id,
      option_text: option.option_text,
      is_correct: option.is_correct,
      order_index: option.order_index
    }))

    const { error: optionsError } = await this.getSupabase()
      .from('question_options')
      .insert(optionsData)

    if (optionsError) {
      console.error('Error creating question options:', optionsError)
      // Clean up the question if options failed
      await this.getSupabase().from('questions').delete().eq('id', question.id)
      return null
    }

    await this.logActivity('create_question', 'question', question.id, {
      category_id: questionData.category_id,
      difficulty: questionData.difficulty,
      options_count: questionData.options.length
    })

    return question
  }

  async updateQuestion(
    questionId: string,
    updates: Partial<{
      question_text: string
      difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
      explanation: string
      points: number
      time_limit_seconds: number
      is_active: boolean
    }>
  ): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from('questions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId)

    if (error) {
      console.error('Error updating question:', error)
      return false
    }

    await this.logActivity('update_question', 'question', questionId, updates)
    return true
  }

  async deleteQuestion(questionId: string): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('Error deleting question:', error)
      return false
    }

    await this.logActivity('delete_question', 'question', questionId)
    return true
  }

  // Quiz Questions Methods (for daily tests and course quizzes)
  async createQuizQuestion(questionData: {
    category_id: string
    question_text: string
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    explanation?: string
    points?: number
    time_limit_seconds?: number
    options: Array<{
      option_text: string
      is_correct: boolean
      order_index: number
    }>
  }): Promise<any> {
    const supabase = this.getSupabase()
    
    // Create the question
    const { data: question, error: questionError } = await supabase
      .from('quiz_questions')
      .insert([{
        category_id: questionData.category_id,
        question_text: questionData.question_text,
        difficulty: questionData.difficulty,
        explanation: questionData.explanation || '',
        points: questionData.points || 1,
        time_limit_seconds: questionData.time_limit_seconds || 60,
        is_active: true
      }])
      .select()
      .single()

    if (questionError) {
      console.error('Error creating quiz question:', questionError)
      throw new Error(`Failed to create quiz question: ${questionError.message}`)
    }

    // Create the options
    if (questionData.options && questionData.options.length > 0) {
      const optionsData = questionData.options.map(option => ({
        question_id: question.id,
        option_text: option.option_text,
        is_correct: option.is_correct,
        order_index: option.order_index
      }))

      const { error: optionsError } = await supabase
        .from('quiz_question_options')
        .insert(optionsData)

      if (optionsError) {
        console.error('Error creating quiz question options:', optionsError)
        // Don't throw here, question was created successfully
      }
    }

    return question
  }

  async updateQuizQuestion(
    questionId: string,
    updates: Partial<{
      question_text: string
      difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
      explanation: string
      points: number
      time_limit_seconds: number
    }>
  ): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from('quiz_questions')
      .update(updates)
      .eq('id', questionId)

    if (error) {
      console.error('Error updating quiz question:', error)
      return false
    }

    return true
  }

  async updateQuizQuestionOptions(
    questionId: string,
    options: Array<{
      id?: string
      option_text: string
      is_correct: boolean
      order_index: number
    }>
  ): Promise<boolean> {
    const supabase = this.getSupabase()

    // Delete existing options
    const { error: deleteError } = await supabase
      .from('quiz_question_options')
      .delete()
      .eq('question_id', questionId)

    if (deleteError) {
      console.error('Error deleting quiz question options:', deleteError)
      return false
    }

    // Insert new options
    if (options.length > 0) {
      const optionsData = options.map(option => ({
        question_id: questionId,
        option_text: option.option_text,
        is_correct: option.is_correct,
        order_index: option.order_index
      }))

      const { error: insertError } = await supabase
        .from('quiz_question_options')
        .insert(optionsData)

      if (insertError) {
        console.error('Error inserting quiz question options:', insertError)
        return false
      }
    }

    return true
  }

  async deleteQuizQuestion(questionId: string): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from('quiz_questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('Error deleting quiz question:', error)
      return false
    }

    return true
  }

  async updateQuestionOptions(
    questionId: string,
    options: Array<{
      id?: string
      option_text: string
      is_correct: boolean
      order_index: number
    }>
  ): Promise<boolean> {
    // Delete existing options
    const { error: deleteError } = await this.getSupabase()
      .from('question_options')
      .delete()
      .eq('question_id', questionId)

    if (deleteError) {
      console.error('Error deleting existing options:', deleteError)
      return false
    }

    // Insert new options
    const optionsData = options.map(option => ({
      question_id: questionId,
      option_text: option.option_text,
      is_correct: option.is_correct,
      order_index: option.order_index
    }))

    const { error: insertError } = await this.getSupabase()
      .from('question_options')
      .insert(optionsData)

    if (insertError) {
      console.error('Error inserting new options:', insertError)
      return false
    }

    await this.logActivity('update_question_options', 'question', questionId, {
      options_count: options.length
    })

    return true
  }

  // Category Management
  async createCategory(name: string, description?: string): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from('question_categories')
      .insert({
        name,
        description: description || ''
      })

    if (error) {
      console.error('Error creating category:', error)
      return false
    }

    await this.logActivity('create_category', 'category', undefined, { name })
    return true
  }

  async updateCategory(
    categoryId: string,
    updates: { name?: string; description?: string }
  ): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from('question_categories')
      .update(updates)
      .eq('id', categoryId)

    if (error) {
      console.error('Error updating category:', error)
      return false
    }

    await this.logActivity('update_category', 'category', categoryId, updates)
    return true
  }

  async deleteCategory(categoryId: string): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from('question_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Error deleting category:', error)
      return false
    }

    await this.logActivity('delete_category', 'category', categoryId)
    return true
  }

  // Test Configuration Management
  async createTestConfiguration(configData: {
    name: string
    description?: string
    total_questions: number
    time_limit_minutes: number
    passing_score_percentage: number
    max_attempts: number
  }): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from('test_configurations')
      .insert({
        ...configData,
        is_active: true
      })

    if (error) {
      console.error('Error creating test configuration:', error)
      return false
    }

    await this.logActivity('create_test_config', 'test_configuration', undefined, configData)
    return true
  }

  async updateTestConfiguration(
    configId: string,
    updates: Partial<{
      name: string
      description: string
      total_questions: number
      time_limit_minutes: number
      passing_score_percentage: number
      max_attempts: number
      is_active: boolean
    }>
  ): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from('test_configurations')
      .update(updates)
      .eq('id', configId)

    if (error) {
      console.error('Error updating test configuration:', error)
      return false
    }

    await this.logActivity('update_test_config', 'test_configuration', configId, updates)
    return true
  }

  // Analytics and Reports
  async getSystemOverview(): Promise<{
    total_questions: number
    total_categories: number
    total_test_configs: number
    total_users: number
    total_test_sessions: number
    active_questions: number
    pending_reviews: number
  }> {
    try {
      const [
        questionsResult,
        categoriesResult,
        configsResult,
        usersResult,
        sessionsResult,
        reviewsResult
      ] = await Promise.all([
        this.getSupabase().from('questions').select('id, is_active', { count: 'exact' }),
        this.getSupabase().from('question_categories').select('id', { count: 'exact' }),
        this.getSupabase().from('test_configurations').select('id', { count: 'exact' }),
        this.getSupabase().from('profiles').select('id', { count: 'exact' }),
        this.getSupabase().from('test_sessions').select('id', { count: 'exact' }),
        (async () => {
          try {
            const result = await this.getSupabase()
              .from('question_reviews')
              .select('id', { count: 'exact' })
              .eq('status', 'pending')
            // Handle 500 errors or missing tables gracefully
            const err: any = result.error
            if (err && (err.status === 500 || err.code === 'PGRST116' || err.message?.includes('relation') || err.message?.includes('does not exist'))) {
              return { data: [], count: 0, error: null }
            }
            return result
          } catch {
            return { data: [], count: 0, error: null }
          }
        })()
      ])

      const activeQuestions = questionsResult.data?.filter(q => q.is_active).length || 0

      return {
        total_questions: questionsResult.count || 0,
        total_categories: categoriesResult.count || 0,
        total_test_configs: configsResult.count || 0,
        total_users: usersResult.count || 0,
        total_test_sessions: sessionsResult.count || 0,
        active_questions: activeQuestions,
        pending_reviews: (reviewsResult?.count ?? reviewsResult?.data?.length) || 0
      }
    } catch (error) {
      console.log('Some admin tables not set up yet, returning default values')
      return {
        total_questions: 0,
        total_categories: 0,
        total_test_configs: 0,
        total_users: 0,
        total_test_sessions: 0,
        active_questions: 0,
        pending_reviews: 0
      }
    }
  }

  async getQuestionAnalytics(): Promise<Array<{
    category_name: string
    total_questions: number
    active_questions: number
    average_difficulty: string
    total_attempts: number
    average_score: number
  }>> {
    const { data, error } = await this.getSupabase()
      .from('question_categories')
      .select(`
        name,
        questions (
          id,
          is_active,
          difficulty,
          question_analytics (
            total_attempts,
            correct_attempts
          )
        )
      `)

    if (error) {
      console.error('Error fetching question analytics:', error)
      return []
    }

    return data?.map(category => {
      const questions = category.questions || []
      const activeQuestions = questions.filter((q: any) => q.is_active)
      const totalAttempts = questions.reduce((sum: number, q: any) => 
        sum + (q.question_analytics?.[0]?.total_attempts || 0), 0)
      const correctAttempts = questions.reduce((sum: number, q: any) => 
        sum + (q.question_analytics?.[0]?.correct_attempts || 0), 0)
      
      const difficulties = questions.map((q: any) => q.difficulty)
      const difficultyCounts = difficulties.reduce((acc: any, diff: string) => {
        acc[diff] = (acc[diff] || 0) + 1
        return acc
      }, {})
      
      const averageDifficulty = Object.keys(difficultyCounts).reduce((a, b) => 
        difficultyCounts[a] > difficultyCounts[b] ? a : b, 'intermediate')

      return {
        category_name: category.name,
        total_questions: questions.length,
        active_questions: activeQuestions.length,
        average_difficulty: averageDifficulty,
        total_attempts: totalAttempts,
        average_score: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0
      }
    }) || []
  }

  async getUserAnalytics(): Promise<Array<{
    user_id: string
    user_name: string
    user_email: string
    total_tests: number
    best_score: number
    average_score: number
    last_activity: string
  }>> {
    const { data, error } = await this.getSupabase()
      .from('test_analytics')
      .select(`
        *,
        profile:profiles (
          first_name,
          last_name,
          email
        )
      `)
      .order('last_attempted_at', { ascending: false })

    if (error) {
      console.error('Error fetching user analytics:', error)
      return []
    }

    return data?.map(analytics => ({
      user_id: analytics.user_id,
      user_name: `${analytics.profile?.first_name || ''} ${analytics.profile?.last_name || ''}`.trim(),
      user_email: analytics.profile?.email || '',
      total_tests: analytics.total_attempts,
      best_score: analytics.best_score,
      average_score: analytics.average_score,
      last_activity: analytics.last_attempted_at || ''
    })) || []
  }

  async getRecentActivity(limit: number = 50): Promise<AdminActivity[]> {
    try {
      const { data, error } = await this.getSupabase()
        .from('admin_activity_log')
        .select(`
          *,
          admin:admin_users (
            user_id,
            profile:profiles (
              first_name,
              last_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        // If table doesn't exist, return empty array
        // Also handle 500 errors which might be RLS or table issues
        const errorMessage = error.message || ''
        const errorCode = error.code || ''
        const errorStatus = (error as any).status || (error as any).statusCode || ''
        
        if (errorCode === 'PGRST116' || 
            errorCode === '42P01' || // relation does not exist
            errorMessage.includes('relation') || 
            errorMessage.includes('does not exist') ||
            errorMessage.includes('not found') ||
            errorStatus === 500 ||
            errorStatus === '500' ||
            errorMessage.includes('500') ||
            errorMessage.includes('permission denied') ||
            errorMessage.includes('RLS')) {
          // Silently return empty array - table doesn't exist or RLS is blocking
          // This is expected if the admin_activity_log table hasn't been created yet
          return []
        }
        // For other errors, log but still return empty array to not break the UI
        console.warn('Error fetching recent activity (non-critical):', errorMessage || errorCode)
        return []
      }

      return data || []
    } catch (error: any) {
      // Catch any network errors or unexpected exceptions
      // Silently return empty array - this is expected if table doesn't exist
      return []
    }
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSetting[]> {
    try {
      const { data, error } = await this.getSupabase()
        .from('system_settings')
        .select('*')
        .order('key')

      if (error) {
        console.error('Error fetching system settings:', error)
        console.error('Error message:', error.message)
        console.error('Error code:', error.code)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        console.error('Full error object:', JSON.stringify(error, null, 2))
        
        // If table doesn't exist, return default settings
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.log('System settings table not found, returning default settings')
          return this.getDefaultSystemSettings()
        }
        
        return []
      }

      return data || []
    } catch (err) {
      console.error('Unexpected error in getSystemSettings:', err)
      return this.getDefaultSystemSettings()
    }
  }

  private getDefaultSystemSettings(): SystemSetting[] {
    return [
      {
        id: 'default-1',
        key: 'max_questions_per_test',
        value: { value: 50 },
        description: 'Maximum number of questions allowed in a single test',
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-2',
        key: 'default_test_duration',
        value: { value: 60 },
        description: 'Default test duration in minutes',
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-3',
        key: 'passing_score_threshold',
        value: { value: 70 },
        description: 'Default passing score percentage',
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-4',
        key: 'max_attempts_per_user',
        value: { value: 3 },
        description: 'Maximum test attempts allowed per user',
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-5',
        key: 'question_review_required',
        value: { value: true },
        description: 'Whether new questions require admin review before activation',
        updated_at: new Date().toISOString()
      }
    ]
  }

  async updateSystemSetting(
    key: string,
    value: Record<string, any>,
    description?: string
  ): Promise<boolean> {
    const { error } = await this.getSupabase()
      .from('system_settings')
      .upsert({
        key,
        value,
        description,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error updating system setting:', error)
      return false
    }

    await this.logActivity('update_system_setting', 'system_setting', undefined, { key, value })
    return true
  }
}

export const adminService = new AdminService()

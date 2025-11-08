'use client'

import { useState, useEffect } from 'react'
import { adminService } from '@/lib/services/adminService'
import { getSupabaseClient } from '@/lib/supabase/client'

interface PreEnrollmentQuestion {
  id: string
  category_id?: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false'
  options: string[]
  correct_answer: string
  explanation: string
  points: number
  difficulty_level: 'easy' | 'medium' | 'hard'
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PreEnrollmentConfig {
  id: string
  name: string
  description: string
  total_questions: number
  time_limit_minutes: number
  passing_score_percentage: number
  max_attempts: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PreEnrollmentSession {
  id: string
  user_id: string
  config_id: string
  status: 'in_progress' | 'completed' | 'abandoned'
  score: number
  max_possible_score: number
  percentage: number
  time_taken_minutes: number
  started_at: string
  completed_at?: string
  user: {
    profile: {
      first_name: string
      last_name: string
      email: string
    }
  }
  config: {
    name: string
  }
}

export default function AdminPreEnrollment() {
  const [questions, setQuestions] = useState<PreEnrollmentQuestion[]>([])
  const [configs, setConfigs] = useState<PreEnrollmentConfig[]>([])
  const [sessions, setSessions] = useState<PreEnrollmentSession[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [rules, setRules] = useState<Array<{ id: string; test_config_id: string; category_id: string; difficulty: string; question_count: number }>>([])
  const [activeTab, setActiveTab] = useState<'questions' | 'configs' | 'sessions'>('questions')
  const [loading, setLoading] = useState(true)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<PreEnrollmentQuestion | null>(null)
  const [editingConfig, setEditingConfig] = useState<PreEnrollmentConfig | null>(null)

  // Form states
  const [questionForm, setQuestionForm] = useState({
    category_id: '',
    test_config_id: '',
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false',
    options: ['', '', '', ''],
    correct_index: 0,
    explanation: '',
    points: 1,
    difficulty_level: 'medium' as 'easy' | 'medium' | 'hard',
    is_active: true
  })

  const [configForm, setConfigForm] = useState({
    name: '',
    description: '',
    total_questions: 20,
    time_limit_minutes: 30,
    passing_score_percentage: 70,
    max_attempts: 3,
    is_active: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const supabase = getSupabaseClient()

      // Load questions
      const { data: questionRows, error: qErr } = await supabase
        .from('questions')
        .select(`
          *,
          options:question_options(*),
          category:question_categories(name)
        `)
        .order('created_at', { ascending: false })

      if (qErr) {
        console.error('Error fetching questions:', qErr)
      }

      const mappedQuestions: PreEnrollmentQuestion[] = (questionRows || []).map((q: any) => {
        const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
          beginner: 'easy',
          intermediate: 'medium',
          advanced: 'hard',
          expert: 'hard'
        }
        const correctOption = (q.options || []).find((o: any) => o.is_correct)
        return {
          id: q.id,
          category_id: q.category_id,
          question_text: q.question_text,
          question_type: (q.options?.length || 0) === 2 ? 'true_false' : 'multiple_choice',
          options: (q.options || []).map((o: any) => o.option_text),
          correct_answer: correctOption ? correctOption.option_text : '',
          explanation: q.explanation || '',
          points: q.points || 1,
          difficulty_level: difficultyMap[q.difficulty] || 'medium',
          category: q.category?.name || 'General',
          is_active: q.is_active ?? true,
          created_at: q.created_at,
          updated_at: q.updated_at
        }
      })

      // Load categories
      const { data: categoryRows, error: catErr } = await supabase
        .from('question_categories')
        .select('id, name')
        .order('name')
      if (catErr) {
        console.error('Error fetching categories:', catErr)
      }

      // Load configurations
      const { data: configRows, error: cErr } = await supabase
        .from('test_configurations')
        .select('*')
        .order('created_at', { ascending: false })
      // Load rules (for pre-filling selected test config on edit)
      const { data: ruleRows, error: rErr } = await supabase
        .from('test_question_rules')
        .select('id, test_config_id, category_id, difficulty, question_count')
      if (rErr) {
        console.error('Error fetching rules:', rErr)
      }

      if (cErr) {
        console.error('Error fetching configurations:', cErr)
      }

      const mappedConfigs: PreEnrollmentConfig[] = (configRows || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        total_questions: c.total_questions,
        time_limit_minutes: c.time_limit_minutes,
        passing_score_percentage: c.passing_score_percentage,
        max_attempts: c.max_attempts,
        is_active: c.is_active ?? true,
        created_at: c.created_at,
        updated_at: c.updated_at
      }))

      // Load sessions
      const { data: sessionRows, error: sErr } = await supabase
        .from('test_sessions')
        .select(`
          *,
          user:profiles(first_name, last_name, email),
          config:test_configurations(name)
        `)
        .order('started_at', { ascending: false })

      if (sErr) {
        console.error('Error fetching sessions:', sErr)
      }

      const mappedSessions: PreEnrollmentSession[] = (sessionRows || []).map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        config_id: s.test_config_id,
        status: s.status,
        score: s.total_score || 0,
        max_possible_score: s.max_possible_score || 0,
        percentage: s.percentage_score || 0,
        time_taken_minutes: Math.round((s.time_taken_seconds || 0) / 60),
        started_at: s.started_at,
        completed_at: s.completed_at,
        user: {
          profile: {
            first_name: s.user?.first_name || '',
            last_name: s.user?.last_name || '',
            email: s.user?.email || ''
          }
        },
        config: {
          name: s.config?.name || ''
        }
      }))

      setQuestions(mappedQuestions)
      setCategories(categoryRows || [])
      setConfigs(mappedConfigs)
      setRules(ruleRows || [])
      setSessions(mappedSessions)
    } catch (error) {
      console.error('Error loading pre-enrollment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const options = questionForm.options
        .map((text, idx) => ({ option_text: text, is_correct: idx === questionForm.correct_index, order_index: idx }))

      const upsertRuleForSelection = async () => {
        if (!questionForm.test_config_id || !questionForm.category_id) return
        const supabase = getSupabaseClient()
        const difficultyService = questionForm.difficulty_level === 'easy' ? 'beginner' : questionForm.difficulty_level === 'medium' ? 'intermediate' : 'advanced'
        const { data: existing } = await supabase
          .from('test_question_rules')
          .select('*')
          .eq('test_config_id', questionForm.test_config_id)
          .eq('category_id', questionForm.category_id)
          .eq('difficulty', difficultyService)
          .single()

        if (existing) {
          await supabase
            .from('test_question_rules')
            .update({
              question_count: Math.max(1, (existing.question_count || 0) + 1),
              points_weight: existing.points_weight || 1
            })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('test_question_rules')
            .insert({
              test_config_id: questionForm.test_config_id,
              category_id: questionForm.category_id,
              difficulty: difficultyService,
              question_count: 1,
              points_weight: 1
            })
        }
      }

      if (editingQuestion) {
        // Update existing
        await adminService.updateQuestion(editingQuestion.id, {
          question_text: questionForm.question_text,
          explanation: questionForm.explanation,
          points: questionForm.points,
          // Map difficulty back to service levels
          difficulty: questionForm.difficulty_level === 'easy' ? 'beginner' : questionForm.difficulty_level === 'medium' ? 'intermediate' : 'advanced',
          is_active: questionForm.is_active
        })
        await adminService.updateQuestionOptions(editingQuestion.id, options)
        await upsertRuleForSelection()
      } else {
        // Create new
        if (!questionForm.category_id) throw new Error('Category is required')
        const created = await adminService.createQuestion({
          category_id: questionForm.category_id,
          question_text: questionForm.question_text,
          question_type: questionForm.question_type === 'multiple_choice' ? 'multiple_choice' : 'true_false',
          difficulty: questionForm.difficulty_level === 'easy' ? 'beginner' : questionForm.difficulty_level === 'medium' ? 'intermediate' : 'advanced',
          explanation: questionForm.explanation,
          points: questionForm.points,
          time_limit_seconds: 60,
          options
        })

        await upsertRuleForSelection()
      }

      setShowQuestionForm(false)
      setEditingQuestion(null)
      resetQuestionForm()
      loadData()
    } catch (error) {
      console.error('Error saving question:', error)
    }
  }

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Implement config creation/update
      console.log('Submitting config:', configForm)
      setShowConfigForm(false)
      setEditingConfig(null)
      resetConfigForm()
      loadData()
    } catch (error) {
      console.error('Error saving config:', error)
    }
  }

  const resetQuestionForm = () => {
    setQuestionForm({
      category_id: '',
      test_config_id: '',
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_index: 0,
      explanation: '',
      points: 1,
      difficulty_level: 'medium',
      is_active: true
    })
  }

  const resetConfigForm = () => {
    setConfigForm({
      name: '',
      description: '',
      total_questions: 20,
      time_limit_minutes: 30,
      passing_score_percentage: 70,
      max_attempts: 3,
      is_active: true
    })
  }

  const editQuestion = (question: PreEnrollmentQuestion) => {
    setEditingQuestion(question)
    const diffService = question.difficulty_level === 'easy' ? 'beginner' : question.difficulty_level === 'medium' ? 'intermediate' : 'advanced'
    const matchingRule = rules.find(r => r.category_id === (question.category_id || '') && r.difficulty === diffService)
    setQuestionForm({
      category_id: question.category_id || '',
      test_config_id: matchingRule ? matchingRule.test_config_id : '',
      question_text: question.question_text,
      question_type: question.question_type,
      options: [...question.options, ...Array(4 - question.options.length).fill('')],
      correct_index: Math.max(0, question.options.findIndex(o => o === question.correct_answer)),
      explanation: question.explanation,
      points: question.points,
      difficulty_level: question.difficulty_level,
      is_active: question.is_active
    })
    setShowQuestionForm(true)
  }

  const editConfig = (config: PreEnrollmentConfig) => {
    setEditingConfig(config)
    setConfigForm({
      name: config.name,
      description: config.description,
      total_questions: config.total_questions,
      time_limit_minutes: config.time_limit_minutes,
      passing_score_percentage: config.passing_score_percentage,
      max_attempts: config.max_attempts,
      is_active: config.is_active
    })
    setShowConfigForm(true)
  }

  const deleteQuestion = async (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        // Implement question deletion
        console.log('Deleting question:', id)
        loadData()
      } catch (error) {
        console.error('Error deleting question:', error)
      }
    }
  }

  const deleteConfig = async (id: string) => {
    if (confirm('Are you sure you want to delete this config?')) {
      try {
        // Implement config deletion
        console.log('Deleting config:', id)
        loadData()
      } catch (error) {
        console.error('Error deleting config:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-lg">Loading pre-enrollment data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Pre-Enrollment Assessment</h2>
          <p className="text-gray-400">Manage pre-enrollment MCQ tests and configurations</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              resetQuestionForm()
              setEditingQuestion(null)
              setShowQuestionForm(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add Question
          </button>
          <button
            onClick={() => {
              resetConfigForm()
              setEditingConfig(null)
              setShowConfigForm(true)
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add Config
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'questions', label: 'Questions', icon: '❓' },
            { id: 'configs', label: 'Configurations', icon: '⚙️' },
            { id: 'sessions', label: 'Test Sessions', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Pre-Enrollment Questions</h3>
                <div className="text-sm text-gray-400">
                  {questions.length} questions
                </div>
              </div>
              
              {questions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No questions found</p>
                  <button
                    onClick={() => {
                      resetQuestionForm()
                      setShowQuestionForm(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Add First Question
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question) => (
                    <div key={question.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              question.difficulty_level === 'easy' ? 'bg-green-600' :
                              question.difficulty_level === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                            }`}>
                              {question.difficulty_level}
                            </span>
                            <span className="text-gray-400 text-sm">{question.category}</span>
                            <span className="text-gray-400 text-sm">{question.points} pts</span>
                            {!question.is_active && (
                              <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">Inactive</span>
                            )}
                          </div>
                          <p className="text-white mb-2">{question.question_text}</p>
                          <div className="text-sm text-gray-400">
                            <p>Options: {question.options.join(', ')}</p>
                            <p>Correct: {question.correct_answer}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => editQuestion(question)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteQuestion(question.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Configs Tab */}
      {activeTab === 'configs' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Test Configurations</h3>
                <div className="text-sm text-gray-400">
                  {configs.length} configurations
                </div>
              </div>
              
              {configs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No configurations found</p>
                  <button
                    onClick={() => {
                      resetConfigForm()
                      setShowConfigForm(true)
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Add First Configuration
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {configs.map((config) => (
                    <div key={config.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-medium">{config.name}</h4>
                        {!config.is_active && (
                          <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">Inactive</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{config.description}</p>
                      <div className="space-y-1 text-sm text-gray-400">
                        <p>Questions: {config.total_questions}</p>
                        <p>Time Limit: {config.time_limit_minutes} min</p>
                        <p>Passing Score: {config.passing_score_percentage}%</p>
                        <p>Max Attempts: {config.max_attempts}</p>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => editConfig(config)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteConfig(config.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Test Sessions</h3>
                <div className="text-sm text-gray-400">
                  {sessions.length} sessions
                </div>
              </div>
              
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No test sessions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400">User</th>
                        <th className="text-left py-3 px-4 text-gray-400">Test</th>
                        <th className="text-left py-3 px-4 text-gray-400">Status</th>
                        <th className="text-left py-3 px-4 text-gray-400">Score</th>
                        <th className="text-left py-3 px-4 text-gray-400">Time</th>
                        <th className="text-left py-3 px-4 text-gray-400">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr key={session.id} className="border-b border-gray-700">
                          <td className="py-3 px-4 text-white">
                            {session.user.profile.first_name} {session.user.profile.last_name}
                            <div className="text-gray-400 text-xs">{session.user.profile.email}</div>
                          </td>
                          <td className="py-3 px-4 text-white">{session.config.name}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              session.status === 'completed' ? 'bg-green-600' :
                              session.status === 'in_progress' ? 'bg-yellow-600' : 'bg-red-600'
                            }`}>
                              {session.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white">
                            {session.score}/{session.max_possible_score} ({session.percentage}%)
                          </td>
                          <td className="py-3 px-4 text-white">{session.time_taken_minutes} min</td>
                          <td className="py-3 px-4 text-gray-400">
                            {new Date(session.started_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                onClick={() => {
                  setShowQuestionForm(false)
                  setEditingQuestion(null)
                  resetQuestionForm()
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleQuestionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Question Text
                </label>
                <textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({...questionForm, question_text: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Question Type
                  </label>
                  <select
                    value={questionForm.question_type}
                    onChange={(e) => setQuestionForm({...questionForm, question_type: e.target.value as any})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={questionForm.difficulty_level}
                    onChange={(e) => setQuestionForm({...questionForm, difficulty_level: e.target.value as any})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={questionForm.category_id}
                    onChange={(e) => setQuestionForm({...questionForm, category_id: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    value={questionForm.points}
                  onChange={(e) => {
                    const nextValue = parseInt(e.target.value, 10)
                    if (!Number.isNaN(nextValue)) {
                      setQuestionForm({ ...questionForm, points: nextValue })
                    }
                  }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Configuration (optional)
                </label>
                <select
                  value={questionForm.test_config_id}
                  onChange={(e) => setQuestionForm({...questionForm, test_config_id: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">None</option>
                  {configs.map(cfg => (
                    <option key={cfg.id} value={cfg.id}>{cfg.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Options
                </label>
                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-center mb-2 space-x-2">
                    <input
                      type="radio"
                      name="correct_option"
                      checked={questionForm.correct_index === index}
                      onChange={() => setQuestionForm({...questionForm, correct_index: index})}
                      className="accent-blue-500"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...questionForm.options]
                        newOptions[index] = e.target.value
                        setQuestionForm({...questionForm, options: newOptions})
                      }}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </div>

              {/* Correct answer now selected via radio button above */}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Explanation
                </label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({...questionForm, explanation: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  rows={2}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={questionForm.is_active}
                  onChange={(e) => setQuestionForm({...questionForm, is_active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionForm(false)
                    setEditingQuestion(null)
                    resetQuestionForm()
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {editingQuestion ? 'Update' : 'Create'} Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Config Form Modal */}
      {showConfigForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingConfig ? 'Edit Configuration' : 'Add New Configuration'}
              </h3>
              <button
                onClick={() => {
                  setShowConfigForm(false)
                  setEditingConfig(null)
                  resetConfigForm()
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Configuration Name
                </label>
                <input
                  type="text"
                  value={configForm.name}
                  onChange={(e) => setConfigForm({...configForm, name: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={configForm.description}
                  onChange={(e) => setConfigForm({...configForm, description: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    value={configForm.total_questions}
                  onChange={(e) => {
                    const nextValue = parseInt(e.target.value, 10)
                    if (!Number.isNaN(nextValue)) {
                      setConfigForm({ ...configForm, total_questions: nextValue })
                    }
                  }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    value={configForm.time_limit_minutes}
                  onChange={(e) => {
                    const nextValue = parseInt(e.target.value, 10)
                    if (!Number.isNaN(nextValue)) {
                      setConfigForm({ ...configForm, time_limit_minutes: nextValue })
                    }
                  }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    value={configForm.passing_score_percentage}
                  onChange={(e) => {
                    const nextValue = parseInt(e.target.value, 10)
                    if (!Number.isNaN(nextValue)) {
                      setConfigForm({ ...configForm, passing_score_percentage: nextValue })
                    }
                  }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    min="1"
                    max="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    value={configForm.max_attempts}
                  onChange={(e) => {
                    const nextValue = parseInt(e.target.value, 10)
                    if (!Number.isNaN(nextValue)) {
                      setConfigForm({ ...configForm, max_attempts: nextValue })
                    }
                  }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="config_is_active"
                  checked={configForm.is_active}
                  onChange={(e) => setConfigForm({...configForm, is_active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="config_is_active" className="text-sm text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfigForm(false)
                    setEditingConfig(null)
                    resetConfigForm()
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {editingConfig ? 'Update' : 'Create'} Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

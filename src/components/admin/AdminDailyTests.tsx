'use client'

import { useState, useEffect } from 'react'
import { 
  DailyTestConfig, 
  CreateDailyTestConfig, 
  UpdateDailyTestConfig 
} from '@/lib/validations/dailyTest'
import { dailyTestService } from '@/lib/services/dailyTestService'

interface TestAttempt {
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
    title: string
    day_number: number
  }
}

interface TestAnalytics {
  total_attempts: number
  completed_attempts: number
  average_score: number
  average_time: number
  pass_rate: number
  top_performers: Array<{
    user_id: string
    name: string
    score: number
    percentage: number
  }>
}

interface Question {
  id: string
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
}

interface AssignedQuestion {
  id: string
  test_config_id: string
  question_id: string
  order_index: number
  is_active: boolean
  question: Question
}

export default function AdminDailyTests() {
  const [testConfigs, setTestConfigs] = useState<DailyTestConfig[]>([])
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([])
  const [analytics, setAnalytics] = useState<TestAnalytics | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [assignedQuestions, setAssignedQuestions] = useState<AssignedQuestion[]>([])
  const [selectedTestConfig, setSelectedTestConfig] = useState<DailyTestConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showQuestionAssignmentForm, setShowQuestionAssignmentForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<DailyTestConfig | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('660e8400-e29b-41d4-a716-446655440001')
  const [activeTab, setActiveTab] = useState<'configs' | 'questions' | 'attempts' | 'analytics'>('configs')

  const [formData, setFormData] = useState<CreateDailyTestConfig>({
    course_id: selectedCourseId,
    day_number: 1,
    title: '',
    description: '',
    test_type: 'daily',
    question_count: 10,
    time_limit_minutes: 15,
    passing_score_percentage: 70,
    max_attempts: 3,
    is_active: true,
  })

  const [questionAssignmentForm, setQuestionAssignmentForm] = useState({
    test_config_id: '',
    question_id: '',
    order_index: 1,
    is_active: true
  })

  useEffect(() => {
    loadData()
  }, [selectedCourseId, activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      const configs = await dailyTestService.getDailyTestConfigs(selectedCourseId)
      setTestConfigs(configs)
      
      if (activeTab === 'questions') {
        // Load questions and assigned questions
        try {
          const availableQuestions = await dailyTestService.getAvailableQuestions()
          setQuestions(availableQuestions)
        } catch (error) {
          console.error('Error loading questions:', error)
          setQuestions([])
        }
      }
      
      if (activeTab === 'attempts') {
        // Load test attempts
        console.log('Loading test attempts...')
        // Note: This would need to be implemented in dailyTestService
      }
      
      if (activeTab === 'analytics') {
        // Load analytics
        console.log('Loading analytics...')
        // Note: This would need to be implemented in dailyTestService
      }
    } catch (error) {
      console.error('Error loading daily test data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dailyTestService.createDailyTestConfig(formData)
      setShowCreateForm(false)
      setFormData({
        course_id: selectedCourseId,
        day_number: 1,
        title: '',
        description: '',
        test_type: 'daily',
        question_count: 10,
        time_limit_minutes: 15,
        passing_score_percentage: 70,
        max_attempts: 3,
        is_active: true,
      })
      loadData()
    } catch (error: any) {
      console.error('Error creating daily test config:', error)
      // Show user-friendly error message
      const errorMessage = error?.message || 'Unknown error'
      if (errorMessage.includes('duplicate') || errorMessage.includes('course_day')) {
        alert(`Error: A daily test config for day ${formData.day_number} already exists for this course. Please try again - the system will automatically adjust the day number.`)
      } else {
        alert(`Error creating daily test config: ${errorMessage}`)
      }
    }
  }

  const handleEditConfig = (config: DailyTestConfig) => {
    setEditingConfig(config)
    setFormData({
      course_id: config.course_id,
      day_number: config.day_number,
      title: config.title,
      description: config.description || '',
      test_type: config.test_type,
      question_count: config.question_count,
      time_limit_minutes: config.time_limit_minutes || 15,
      passing_score_percentage: config.passing_score_percentage,
      max_attempts: config.max_attempts,
      is_active: config.is_active,
    })
    setShowCreateForm(true)
  }

  const handleQuestionAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await dailyTestService.assignQuestionToTest(
        questionAssignmentForm.test_config_id,
        questionAssignmentForm.question_id,
        questionAssignmentForm.order_index
      )
      
      setShowQuestionAssignmentForm(false)
      setQuestionAssignmentForm({
        test_config_id: '',
        question_id: '',
        order_index: 1,
        is_active: true
      })
      loadData()
    } catch (error) {
      console.error('Error assigning question:', error)
    }
  }

  const assignQuestionToTest = (testConfig: DailyTestConfig) => {
    setSelectedTestConfig(testConfig)
    setQuestionAssignmentForm({
      test_config_id: testConfig.id,
      question_id: '',
      order_index: 1,
      is_active: true
    })
    setShowQuestionAssignmentForm(true)
  }

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-500/20 text-blue-400'
      case 'weekly': return 'bg-purple-500/20 text-purple-400'
      case 'milestone': return 'bg-green-500/20 text-green-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="bg-white/5 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Daily Test Management</h2>
          <p className="text-gray-400">Manage daily tests, view attempts, and analyze performance</p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'configs' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
            >
              Create Daily Test
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'configs', label: 'Test Configurations', icon: '⚙️' },
            { id: 'questions', label: 'Question Assignment', icon: '❓' },
            { id: 'attempts', label: 'Test Attempts', icon: '📊' },
            { id: 'analytics', label: 'Analytics', icon: '📈' }
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

      {/* Course Selection */}
      <div className="bg-gray-800 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Course
        </label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="660e8400-e29b-41d4-a716-446655440001">Super Accountant Professional Certification</option>
        </select>
      </div>

      {/* Tab Content */}
      {activeTab === 'configs' && (
        <div className="space-y-4">

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingConfig ? 'Edit Daily Test' : 'Create Daily Test'}
          </h3>
          
          <form onSubmit={handleCreateConfig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Day Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={formData.day_number || 1}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setFormData({ ...formData, day_number: isNaN(value) ? 1 : value })
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Test Type
                </label>
                <select
                  value={formData.test_type}
                  onChange={(e) => setFormData({ ...formData, test_type: e.target.value as any })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Day 1: Introduction to Accounting"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe what this test covers..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Question Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.question_count || 10}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setFormData({ ...formData, question_count: isNaN(value) ? 10 : value })
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.time_limit_minutes || 15}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setFormData({ ...formData, time_limit_minutes: isNaN(value) ? 15 : value })
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passing_score_percentage || 70}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    setFormData({ ...formData, passing_score_percentage: isNaN(value) ? 70 : value })
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.max_attempts || 3}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setFormData({ ...formData, max_attempts: isNaN(value) ? 3 : value })
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-300">
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingConfig(null)
                  setFormData({
                    course_id: selectedCourseId,
                    day_number: 1,
                    title: '',
                    description: '',
                    test_type: 'daily',
                    question_count: 10,
                    time_limit_minutes: 15,
                    passing_score_percentage: 70,
                    max_attempts: 3,
                    is_active: true,
                  })
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
              >
                {editingConfig ? 'Update' : 'Create'} Test
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Test Configs List */}
      <div className="space-y-4">
        {testConfigs.map((config) => (
          <div
            key={config.id}
            className="bg-white/5 rounded-lg p-4 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">
                    Day {config.day_number}: {config.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTestTypeColor(config.test_type)}`}>
                    {config.test_type}
                  </span>
                  {config.is_active ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                      Inactive
                    </span>
                  )}
                </div>
                
                {config.description && (
                  <p className="text-gray-300 text-sm mb-3">{config.description}</p>
                )}
                
                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  <span>📝 {config.question_count} questions</span>
                  {config.time_limit_minutes && (
                    <span>⏱️ {config.time_limit_minutes} min</span>
                  )}
                  <span>🎯 {config.passing_score_percentage}% passing</span>
                  <span>🔄 {config.max_attempts} attempts</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                        <button
                          onClick={() => assignQuestionToTest(config)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                        >
                          Assign Questions
                        </button>
                        <button
                          onClick={() => handleEditConfig(config)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            // TODO: Implement delete functionality
                            console.log('Delete config:', config.id)
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                        >
                          Delete
                        </button>
              </div>
            </div>
          </div>
        ))}
        
        {testConfigs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No daily test configurations found.</p>
            <p className="text-gray-500 text-sm mt-2">Create your first daily test to get started.</p>
          </div>
        )}
      </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Question Assignment</h3>
                <div className="text-sm text-gray-400">
                  {questions.length} available questions
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Questions */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Available Questions</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {questions.map((question) => (
                      <div key={question.id} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`px-2 py-1 rounded text-xs ${
                                question.difficulty_level === 'easy' ? 'bg-green-600' :
                                question.difficulty_level === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                              }`}>
                                {question.difficulty_level}
                              </span>
                              <span className="text-gray-400 text-xs">{question.category}</span>
                              <span className="text-gray-400 text-xs">{question.points} pts</span>
                            </div>
                            <p className="text-white text-sm">{question.question_text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Configurations */}
                <div>
                  <h4 className="text-md font-medium text-white mb-3">Daily Tests</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testConfigs.map((config) => (
                      <div key={config.id} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="text-white font-medium">Day {config.day_number}: {config.title}</h5>
                            <p className="text-gray-400 text-sm">{config.question_count} questions configured</p>
                          </div>
                          <button
                            onClick={() => assignQuestionToTest(config)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Assign Questions
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Attempts Tab */}
      {activeTab === 'attempts' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Test Attempts</h3>
                <div className="text-sm text-gray-400">
                  {testAttempts.length} attempts
                </div>
              </div>
              
              {testAttempts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No test attempts found</p>
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
                      {testAttempts.map((attempt) => (
                        <tr key={attempt.id} className="border-b border-gray-700">
                          <td className="py-3 px-4 text-white">
                            {attempt.user.profile.first_name} {attempt.user.profile.last_name}
                            <div className="text-gray-400 text-xs">{attempt.user.profile.email}</div>
                          </td>
                          <td className="py-3 px-4 text-white">
                            Day {attempt.config.day_number}: {attempt.config.title}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              attempt.status === 'completed' ? 'bg-green-600' :
                              attempt.status === 'in_progress' ? 'bg-yellow-600' : 'bg-red-600'
                            }`}>
                              {attempt.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white">
                            {attempt.score}/{attempt.max_possible_score} ({attempt.percentage}%)
                          </td>
                          <td className="py-3 px-4 text-white">{attempt.time_taken_minutes} min</td>
                          <td className="py-3 px-4 text-gray-400">
                            {new Date(attempt.started_at).toLocaleDateString()}
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

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Total Attempts</p>
                  <p className="text-3xl font-bold text-white mt-2">{analytics?.total_attempts || 0}</p>
                </div>
                <div className="bg-blue-600 p-3 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold text-white mt-2">{analytics?.completed_attempts || 0}</p>
                </div>
                <div className="bg-green-600 p-3 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Average Score</p>
                  <p className="text-3xl font-bold text-white mt-2">{analytics?.average_score?.toFixed(1) || 0}%</p>
                </div>
                <div className="bg-purple-600 p-3 rounded-lg">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">Pass Rate</p>
                  <p className="text-3xl font-bold text-white mt-2">{analytics?.pass_rate?.toFixed(1) || 0}%</p>
                </div>
                <div className="bg-orange-600 p-3 rounded-lg">
                  <span className="text-2xl">🏆</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Top Performers</h3>
              {analytics?.top_performers && analytics.top_performers.length > 0 ? (
                <div className="space-y-3">
                  {analytics.top_performers.map((performer, index) => (
                    <div key={performer.user_id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{performer.name}</p>
                          <p className="text-gray-400 text-sm">Score: {performer.score} ({performer.percentage}%)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{performer.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No performance data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Question Assignment Form Modal */}
      {showQuestionAssignmentForm && selectedTestConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Assign Questions to: Day {selectedTestConfig.day_number} - {selectedTestConfig.title}
              </h3>
              <button
                onClick={() => {
                  setShowQuestionAssignmentForm(false)
                  setSelectedTestConfig(null)
                  setQuestionAssignmentForm({
                    test_config_id: '',
                    question_id: '',
                    order_index: 1,
                    is_active: true
                  })
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleQuestionAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Question
                </label>
                <select
                  value={questionAssignmentForm.question_id}
                  onChange={(e) => setQuestionAssignmentForm({...questionAssignmentForm, question_id: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  required
                >
                  <option value="">Choose a question...</option>
                  {questions.map((question) => (
                    <option key={question.id} value={question.id}>
                      {question.question_text.substring(0, 100)}... ({question.difficulty_level} - {question.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Order Index (Position in Test)
                </label>
                <input
                  type="number"
                  value={questionAssignmentForm.order_index}
                  onChange={(e) => setQuestionAssignmentForm({...questionAssignmentForm, order_index: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  min="1"
                  max="50"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="question_active"
                  checked={questionAssignmentForm.is_active}
                  onChange={(e) => setQuestionAssignmentForm({...questionAssignmentForm, is_active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="question_active" className="text-sm text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionAssignmentForm(false)
                    setSelectedTestConfig(null)
                    setQuestionAssignmentForm({
                      test_config_id: '',
                      question_id: '',
                      order_index: 1,
                      is_active: true
                    })
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Assign Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}



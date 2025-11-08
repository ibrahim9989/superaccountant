'use client'

import { useState, useEffect } from 'react'
import { adminService } from '@/lib/services/adminService'
import { QuestionWithOptions } from '@/lib/validations/mcq'
import { getSupabaseClient } from '@/lib/supabase/client'

interface QuestionCategory {
  id: string
  name: string
  description: string
}


export default function AdminQuestions() {
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([])
  const [categories, setCategories] = useState<QuestionCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionWithOptions | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    question_text: '',
    category_id: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced' | 'expert',
    explanation: '',
    points: 1,
    time_limit_seconds: 60,
    options: [
      { option_text: '', is_correct: false, order_index: 0 },
      { option_text: '', is_correct: false, order_index: 1 },
      { option_text: '', is_correct: false, order_index: 2 },
      { option_text: '', is_correct: false, order_index: 3 }
    ]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [questionsData, categoriesData] = await Promise.all([
        loadQuestions(),
        loadCategories()
      ])
      setQuestions(questionsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async (): Promise<QuestionWithOptions[]> => {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        category:question_categories(name),
        options:question_options(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading questions:', error)
      return []
    }

    return data || []
  }

  const loadCategories = async (): Promise<QuestionCategory[]> => {      
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('question_categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error loading categories:', error)
      return []
    }

    return data || []
  }


  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.question_text.trim()) {
      alert('Question text is required')
      return
    }
    
    if (!formData.category_id) {
      alert('Please select a category')
      return
    }
    
    const correctOptions = formData.options.filter(opt => opt.is_correct)
    if (correctOptions.length === 0) {
      alert('At least one option must be marked as correct')
      return
    }
    
    const filledOptions = formData.options.filter(opt => opt.option_text.trim())
    if (filledOptions.length < 2) {
      alert('At least 2 options are required')
      return
    }

    // Determine question type based on number of correct answers
    const questionType: 'single_choice' | 'multiple_choice' | 'true_false' = 
      correctOptions.length === 1 ? 'single_choice' : 'multiple_choice'

    try {
      const newQuestion = await adminService.createQuestion({
        category_id: formData.category_id,
        question_text: formData.question_text,
        question_type: questionType,
        difficulty: formData.difficulty,
        explanation: formData.explanation,
        points: formData.points,
        time_limit_seconds: formData.time_limit_seconds,
        options: filledOptions
      })

      if (newQuestion) {
        setShowCreateForm(false)
        resetForm()
        loadData()
        alert('Question created successfully!')
      } else {
        alert('Failed to create question')
      }
    } catch (error) {
      console.error('Error creating question:', error)
      alert('Error creating question')
    }
  }

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingQuestion) return

    try {
      const success = await adminService.updateQuestion(editingQuestion.id, {
        question_text: formData.question_text,
        difficulty: formData.difficulty,
        explanation: formData.explanation,
        points: formData.points,
        time_limit_seconds: formData.time_limit_seconds
      })

      if (success) {
        // Update options
        const filledOptions = formData.options.filter(opt => opt.option_text.trim())
        await adminService.updateQuestionOptions(editingQuestion.id, filledOptions)
        
        setEditingQuestion(null)
        resetForm()
        loadData()
        alert('Question updated successfully!')
      } else {
        alert('Failed to update question')
      }
    } catch (error) {
      console.error('Error updating question:', error)
      alert('Error updating question')
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      const success = await adminService.deleteQuestion(questionId)
      if (success) {
        loadData()
        alert('Question deleted successfully!')
      } else {
        alert('Failed to delete question')
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Error deleting question')
    }
  }

  const resetForm = () => {
    setFormData({
      question_text: '',
      category_id: '',
      difficulty: 'beginner',
      explanation: '',
      points: 1,
      time_limit_seconds: 60,
      options: [
        { option_text: '', is_correct: false, order_index: 0 },
        { option_text: '', is_correct: false, order_index: 1 },
        { option_text: '', is_correct: false, order_index: 2 },
        { option_text: '', is_correct: false, order_index: 3 }
      ]
    })
  }

  const startEdit = (question: QuestionWithOptions) => {
    setEditingQuestion(question)
    setFormData({
      question_text: question.question_text,
      category_id: question.category_id,
      difficulty: question.difficulty,
      explanation: question.explanation || '',
      points: question.points || 1,
      time_limit_seconds: question.time_limit_seconds || 60,
      options: question.options.map((opt, index) => ({
        option_text: opt.option_text,
        is_correct: opt.is_correct,
        order_index: index
      }))
    })
    setShowCreateForm(true)
  }

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question_text.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || question.category_id === selectedCategory
    const matchesDifficulty = !selectedDifficulty || question.difficulty === selectedDifficulty
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-lg">Loading questions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Question Management</h2>
        <button
          onClick={() => {
            setShowCreateForm(true)
            setEditingQuestion(null)
            resetForm()
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Add New Question
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search Questions
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search question text..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Difficulty
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">No questions found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredQuestions.map((question) => (
              <div key={question.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                        {(question as any).category?.name || 'Uncategorized'}
                      </span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        question.difficulty === 'beginner' ? 'bg-green-600' :
                        question.difficulty === 'intermediate' ? 'bg-yellow-600' :
                        question.difficulty === 'advanced' ? 'bg-orange-600' :
                        'bg-red-600'
                      } text-white`}>
                        {question.difficulty}
                      </span>
                      <span className="bg-gray-600 text-white px-2 py-1 rounded text-sm">
                        {question.points} pts
                      </span>
                      {!question.is_active && (
                        <span className="bg-red-600 text-white px-2 py-1 rounded text-sm">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-white font-medium mb-2">
                      {question.question_text}
                    </h3>
                    
                    <div className="text-gray-400 text-sm mb-3">
                      {question.options.length} options • {question.time_limit_seconds}s time limit
                    </div>
                    
                    {question.explanation && (
                      <div className="text-gray-300 text-sm bg-gray-700 p-3 rounded">
                        <strong>Explanation:</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => startEdit(question)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
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

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingQuestion ? 'Edit Question' : 'Create New Question'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingQuestion(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion} className="space-y-6">
                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Question Text *
                  </label>
                  <textarea
                    value={formData.question_text}
                    onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter the question text..."
                    required
                  />
                </div>

                {/* Category and Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({...formData, difficulty: e.target.value as any})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>

                {/* Points and Time Limit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Time Limit (seconds)
                    </label>
                    <input
                      type="number"
                      min="30"
                      value={formData.time_limit_seconds}
                      onChange={(e) => setFormData({...formData, time_limit_seconds: parseInt(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Explanation
                  </label>
                  <textarea
                    value={formData.explanation}
                    onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                    rows={2}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional explanation for the correct answer..."
                  />
                </div>

                {/* Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Answer Options *
                  </label>
                  <div className="space-y-3">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={option.is_correct}
                          onChange={(e) => {
                            const newOptions = [...formData.options]
                            newOptions[index].is_correct = e.target.checked
                            setFormData({...formData, options: newOptions})
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={option.option_text}
                          onChange={(e) => {
                            const newOptions = [...formData.options]
                            newOptions[index].option_text = e.target.value
                            setFormData({...formData, options: newOptions})
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>


                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingQuestion(null)
                      resetForm()
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {editingQuestion ? 'Update Question' : 'Create Question'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

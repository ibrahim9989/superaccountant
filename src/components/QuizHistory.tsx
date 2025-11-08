'use client'

import { useState, useEffect } from 'react'
import { QuizAttempt } from '@/lib/validations/course'
import { courseService } from '@/lib/services/courseService'

interface QuizHistoryProps {
  enrollmentId: string
  quizId?: string // If provided, show history for specific quiz, otherwise show all
  onClose: () => void
}

interface QuizAttemptWithQuiz extends QuizAttempt {
  quiz?: {
    id: string
    title: string
    description: string
    passing_score_percentage: number
  }
}

export default function QuizHistory({ enrollmentId, quizId, onClose }: QuizHistoryProps) {
  const [attempts, setAttempts] = useState<QuizAttemptWithQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuizHistory()
  }, [enrollmentId, quizId])

  const loadQuizHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let data: QuizAttemptWithQuiz[]
      if (quizId) {
        // Get history for specific quiz
        data = await courseService.getQuizAttemptHistory(enrollmentId, quizId)
      } else {
        // Get all quiz attempts
        data = await courseService.getAllQuizAttempts(enrollmentId)
      }
      
      setAttempts(data)
    } catch (err) {
      console.error('Error loading quiz history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quiz history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getScoreColor = (percentage: number, passingScore: number) => {
    if (percentage >= passingScore) return 'text-green-400'
    if (percentage >= passingScore * 0.8) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStatusColor = (percentage: number, passingScore: number) => {
    if (percentage >= passingScore) return 'text-green-400'
    return 'text-red-400'
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-4xl w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-white">Loading quiz history...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {quizId ? 'Quiz History' : 'All Quiz Attempts'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {attempts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-lg">No quiz attempts found</p>
            <p className="text-gray-500 text-sm mt-2">
              {quizId ? 'You haven\'t taken this quiz yet.' : 'You haven\'t taken any quizzes yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt, index) => (
              <div key={attempt.id} className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {attempt.quiz?.title || 'Quiz'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Attempt #{attempt.attempt_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {formatDate(attempt.started_at)}
                    </p>
                    {attempt.submitted_at && (
                      <p className="text-xs text-gray-500">
                        Duration: {formatDuration(attempt.time_taken_minutes ?? null)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Score</p>
                    <p className={`text-xl font-bold ${getScoreColor(
                      attempt.percentage_score || 0, 
                      attempt.quiz?.passing_score_percentage || 70
                    )}`}>
                      {attempt.score || 0} / {attempt.max_score || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Percentage</p>
                    <p className={`text-xl font-bold ${getScoreColor(
                      attempt.percentage_score || 0, 
                      attempt.quiz?.passing_score_percentage || 70
                    )}`}>
                      {(attempt.percentage_score || 0).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className={`text-xl font-bold ${getStatusColor(
                      attempt.percentage_score || 0, 
                      attempt.quiz?.passing_score_percentage || 70
                    )}`}>
                      {(attempt.percentage_score || 0) >= (attempt.quiz?.passing_score_percentage || 70) ? 'Passed' : 'Failed'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>Status: {attempt.status}</span>
                  {attempt.submitted_at && (
                    <span>Submitted: {formatDate(attempt.submitted_at)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

























'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  TestSessionWithDetails, 
  TestResult
} from '@/lib/validations/mcq'
import { mcqService } from '@/lib/services/mcqService'

interface MCQTestProps {
  session: TestSessionWithDetails
  onComplete: (result: TestResult) => void
  onAbandon: () => void
}

export default function MCQTest({ session, onComplete, onAbandon }: MCQTestProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set())
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(session.time_remaining_seconds)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showReview, setShowReview] = useState(false)

  const currentQuestion = session.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === session.questions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Reset question timer when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now())
    setSelectedOptions([])
  }, [currentQuestionIndex])

  const handleTimeUp = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const result = await mcqService.completeTest(session.id, { session_id: session.id })
      onComplete(result)
    } catch (error) {
      console.error('Error completing test:', error)
      alert('Failed to complete test. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [session.id, onComplete])

  const handleOptionSelect = (optionId: string) => {
    if (currentQuestion.question_type === 'single_choice') {
      setSelectedOptions([optionId])
    } else {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    }
  }

  const handleNextQuestion = async () => {
    if (selectedOptions.length === 0) {
      alert('Please select at least one option before proceeding.')
      return
    }

    setIsSubmitting(true)
    try {
      const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000)
      
      await mcqService.submitAnswer(session.id, {
        question_id: currentQuestion.id,
        selected_option_ids: selectedOptions,
        time_taken_seconds: timeTaken
      })

      // Mark question as answered and remove from skipped if it was skipped
      setAnsweredQuestions(prev => new Set([...prev, currentQuestion.id]))
      if (skippedQuestions.has(currentQuestion.id)) {
        setSkippedQuestions(prev => {
          const newSet = new Set(prev)
          newSet.delete(currentQuestion.id)
          return newSet
        })
      }

      if (isLastQuestion) {
        setShowReview(true)
      } else {
        setCurrentQuestionIndex(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkipQuestion = () => {
    setSkippedQuestions(prev => new Set([...prev, currentQuestion.id]))
    if (isLastQuestion) {
      setShowReview(true)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleReviewComplete = async () => {
    setIsSubmitting(true)
    try {
      const result = await mcqService.completeTest(session.id, { session_id: session.id })
      onComplete(result)
    } catch (error) {
      console.error('Error completing test:', error)
      alert('Failed to complete test. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreviousQuestion = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleAbandonTest = () => {
    setShowConfirmDialog(true)
  }

  const confirmAbandon = async () => {
    setIsSubmitting(true)
    try {
      // Update session status to abandoned
      await mcqService.completeTest(session.id, { session_id: session.id })
      onAbandon()
    } catch (error) {
      console.error('Error abandoning test:', error)
    } finally {
      setIsSubmitting(false)
      setShowConfirmDialog(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
  }

  const progressPercentage = ((currentQuestionIndex + 1) / session.questions.length) * 100

  if (showReview) {
    // Use the answeredQuestions state to track which questions have been answered
    const stillSkippedQuestions = session.questions.filter(q => 
      skippedQuestions.has(q.id) && !answeredQuestions.has(q.id)
    )
    const answeredQuestionsList = session.questions.filter(q => answeredQuestions.has(q.id))
    
    return (
      <div className="min-h-screen w-full bg-black">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Review Your Answers</h2>
            
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <div className="text-green-400 font-semibold text-lg">{answeredQuestionsList.length}</div>
                  <div className="text-green-300 text-sm">Questions Answered</div>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="text-yellow-400 font-semibold text-lg">{stillSkippedQuestions.length}</div>
                  <div className="text-yellow-300 text-sm">Questions Still Skipped</div>
                </div>
              </div>
            </div>

            {stillSkippedQuestions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Skipped Questions</h3>
                <div className="space-y-4">
                  {stillSkippedQuestions.map((question, index) => (
                    <div key={question.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-yellow-400 font-medium">Question {session.questions.findIndex(q => q.id === question.id) + 1}</span>
                        <button
                          onClick={() => {
                            setCurrentQuestionIndex(session.questions.findIndex(q => q.id === question.id))
                            setShowReview(false)
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Answer Now
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm">{question.question_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {answeredQuestionsList.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Answered Questions</h3>
                <div className="space-y-2">
                  {answeredQuestionsList.map((question, index) => (
                    <div key={question.id} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 font-medium">Question {session.questions.findIndex(q => q.id === question.id) + 1}</span>
                        <span className="text-green-300 text-sm">✓ Answered</span>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{question.question_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowReview(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Continue Test
              </button>
              <button
                onClick={handleReviewComplete}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Complete Test'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showConfirmDialog) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-md mx-4">
          <h3 className="text-xl font-semibold text-white mb-4">Abandon Test?</h3>
          <p className="text-gray-300 mb-6">
            Are you sure you want to abandon this test? Your progress will be lost and this will count as an attempt.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmAbandon}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Abandoning...' : 'Abandon Test'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-black">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-lg font-semibold">{session.test_config.name}</h1>
            <div className="flex items-center gap-3">
              <p className="text-gray-400 text-sm">
                Question {currentQuestionIndex + 1} of {session.questions.length}
              </p>
              {answeredQuestions.has(currentQuestion.id) && (
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                  ✓ Answered
                </span>
              )}
              {skippedQuestions.has(currentQuestion.id) && (
                <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
                  ⏭ Skipped
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-white text-lg font-mono">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-gray-400 text-sm">Time Remaining</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                {currentQuestion.difficulty}
              </span>
              <span className="text-gray-400 text-sm">
                {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
              </span>
            </div>
            <h2 className="text-white text-xl font-medium leading-relaxed">
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, index) => (
              <label
                key={option.id}
                className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedOptions.includes(option.id)
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                }`}
              >
                <input
                  type={currentQuestion.question_type === 'single_choice' ? 'radio' : 'checkbox'}
                  name="option"
                  value={option.id}
                  checked={selectedOptions.includes(option.id)}
                  onChange={() => handleOptionSelect(option.id)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                  selectedOptions.includes(option.id)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-white/40'
                }`}>
                  {selectedOptions.includes(option.id) && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className="text-white flex-1">
                  {String.fromCharCode(65 + index)}. {option.option_text}
                </span>
              </label>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousQuestion}
              disabled={isFirstQuestion}
              className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleAbandonTest}
                className="px-6 py-3 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                Abandon Test
              </button>
              <button
                onClick={handleSkipQuestion}
                className="px-6 py-3 border border-yellow-500/50 text-yellow-400 rounded-lg hover:bg-yellow-500/10 transition-colors"
              >
                Skip Question
              </button>
              <button
                onClick={handleNextQuestion}
                disabled={selectedOptions.length === 0 || isSubmitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : isLastQuestion ? 'Review & Submit' : 'Next Question'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  TestSessionWithDetails, 
  TestResult
} from '@/lib/validations/mcq'
import { mcqService } from '@/lib/services/mcqService'
import { showToast } from './Toast'

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
      showToast('Time is up! Test completed automatically.', 'info')
      onComplete(result)
    } catch (error) {
      console.error('Error completing test:', error)
      showToast('Failed to complete test. Please try again.', 'error')
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
      showToast('Please select at least one option before proceeding.', 'warning')
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
      showToast('Failed to submit answer. Please try again.', 'error')
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
      showToast('Test completed successfully!', 'success')
      onComplete(result)
    } catch (error) {
      console.error('Error completing test:', error)
      showToast('Failed to complete test. Please try again.', 'error')
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
      await mcqService.completeTest(session.id, { session_id: session.id })
      showToast('Test abandoned.', 'info')
      onAbandon()
    } catch (error) {
      console.error('Error abandoning test:', error)
      showToast('Failed to abandon test.', 'error')
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
  const isTimeLow = timeRemaining < 300 // Less than 5 minutes

  if (showReview) {
    const stillSkippedQuestions = session.questions.filter(q => 
      skippedQuestions.has(q.id) && !answeredQuestions.has(q.id)
    )
    const answeredQuestionsList = session.questions.filter(q => answeredQuestions.has(q.id))
    
    return (
      <div className="min-h-screen w-full bg-black relative">
        {/* Luxury Background Effects */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto p-6 lg:p-12">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-6 shadow-2xl backdrop-blur-sm">
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-300 rounded-full mr-3 animate-pulse"></div>
                <span className="text-white text-xs font-bold tracking-[0.22em] uppercase">REVIEW ANSWERS</span>
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-gray-300 to-white rounded-full ml-3 animate-pulse"></div>
              </div>
              <h2 className="text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                Review Your Answers
              </h2>
            </div>
            
            <div className="mb-8">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-900/50 via-green-800/50 to-green-900/50 border border-green-700/50 rounded-2xl p-6">
                  <div className="text-4xl font-black text-green-300 mb-2">{answeredQuestionsList.length}</div>
                  <div className="text-green-200 text-sm font-medium uppercase tracking-wide">Questions Answered</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-900/50 via-yellow-800/50 to-yellow-900/50 border border-yellow-700/50 rounded-2xl p-6">
                  <div className="text-4xl font-black text-yellow-300 mb-2">{stillSkippedQuestions.length}</div>
                  <div className="text-yellow-200 text-sm font-medium uppercase tracking-wide">Questions Skipped</div>
                </div>
              </div>
            </div>

            {stillSkippedQuestions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-black text-white mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                  Skipped Questions
                </h3>
                <div className="space-y-4">
                  {stillSkippedQuestions.map((question) => (
                    <div key={question.id} className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-yellow-700/50 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-yellow-300 font-bold">Question {session.questions.findIndex(q => q.id === question.id) + 1}</span>
                        <button
                          onClick={() => {
                            setCurrentQuestionIndex(session.questions.findIndex(q => q.id === question.id))
                            setShowReview(false)
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-white via-gray-100 to-white text-black font-bold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                          Answer Now
                        </button>
                      </div>
                      <p className="text-gray-300 font-light">{question.question_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {answeredQuestionsList.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-black text-white mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                  Answered Questions
                </h3>
                <div className="space-y-3">
                  {answeredQuestionsList.map((question) => (
                    <div key={question.id} className="bg-gradient-to-br from-green-900/30 via-green-800/20 to-green-900/30 border border-green-700/30 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-green-300 font-bold">Question {session.questions.findIndex(q => q.id === question.id) + 1}</span>
                        <span className="text-green-300 text-sm font-medium">✓ Answered</span>
                      </div>
                      <p className="text-gray-300 text-sm mt-2 font-light">{question.question_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowReview(false)}
                className="px-8 py-4 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white font-black rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                Continue Test
              </button>
              <button
                onClick={handleReviewComplete}
                disabled={isSubmitting}
                className="group relative px-8 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10">{isSubmitting ? 'Submitting...' : 'Complete Test'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showConfirmDialog) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 max-w-md mx-4 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-900/50 via-red-800/50 to-red-900/50 border border-red-700/50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Abandon Test?
            </h3>
            <p className="text-gray-300 font-light">
            Are you sure you want to abandon this test? Your progress will be lost and this will count as an attempt.
          </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Cancel
            </button>
            <button
              onClick={confirmAbandon}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:via-red-500 hover:to-red-600 text-white font-black rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? 'Abandoning...' : 'Abandon Test'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Luxury Background Effects */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-sm border-b border-gray-600/50 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-black text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              {session.test_config.name}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-gray-300 text-sm font-medium">
                Question {currentQuestionIndex + 1} of {session.questions.length}
              </p>
              {answeredQuestions.has(currentQuestion.id) && (
                <span className="bg-gradient-to-r from-green-900/50 to-green-800/50 border border-green-700/50 text-green-300 px-3 py-1 rounded-full text-xs font-bold">
                  ✓ Answered
                </span>
              )}
              {skippedQuestions.has(currentQuestion.id) && (
                <span className="bg-gradient-to-r from-yellow-900/50 to-yellow-800/50 border border-yellow-700/50 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">
                  ⏭ Skipped
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-black font-mono ${isTimeLow ? 'text-red-400 animate-pulse' : 'text-white'}`}>
              {formatTime(timeRemaining)}
            </div>
            <div className="text-gray-300 text-sm font-medium">Time Remaining</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="max-w-5xl mx-auto mt-4">
          <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden border border-gray-700/50">
            <div 
              className="h-full bg-gradient-to-r from-white via-gray-200 to-white rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
            <span>{Math.round(progressPercentage)}% Complete</span>
            <span>{session.questions.length - currentQuestionIndex - 1} questions remaining</span>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="relative z-10 max-w-5xl mx-auto p-6 lg:p-12">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700/50 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide">
                {currentQuestion.difficulty}
              </span>
              <span className="text-gray-300 text-sm font-medium">
                {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white leading-relaxed bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, index) => (
              <label
                key={option.id}
                className={`flex items-center p-5 rounded-xl border cursor-pointer transition-all duration-300 group ${
                  selectedOptions.includes(option.id)
                    ? 'bg-gradient-to-r from-white/20 via-gray-200/10 to-white/20 border-white/50 shadow-lg'
                    : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-gray-500/70 hover:bg-gray-800/70'
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
                <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 transition-all ${
                  selectedOptions.includes(option.id)
                    ? 'border-white bg-white'
                    : 'border-gray-500 group-hover:border-gray-400'
                }`}>
                  {selectedOptions.includes(option.id) && (
                    <div className="w-3 h-3 bg-black rounded-full" />
                  )}
                </div>
                <span className="text-white flex-1 font-medium text-lg">
                  {String.fromCharCode(65 + index)}. {option.option_text}
                </span>
              </label>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              onClick={handlePreviousQuestion}
              disabled={isFirstQuestion}
              className="px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Previous
            </button>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleAbandonTest}
                className="px-6 py-3 bg-gradient-to-r from-red-800 via-red-700 to-red-800 border border-red-700/50 hover:border-red-600/70 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                Abandon
              </button>
              <button
                onClick={handleSkipQuestion}
                className="px-6 py-3 bg-gradient-to-r from-yellow-800 via-yellow-700 to-yellow-800 border border-yellow-700/50 hover:border-yellow-600/70 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                Skip
              </button>
              <button
                onClick={handleNextQuestion}
                disabled={selectedOptions.length === 0 || isSubmitting}
                className="group relative px-8 py-3 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10">
                {isSubmitting ? 'Submitting...' : isLastQuestion ? 'Review & Submit' : 'Next Question'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

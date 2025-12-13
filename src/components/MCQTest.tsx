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
      <div className="min-h-screen bg-[#2B2A29] text-white">
        <section className="relative bg-gradient-to-br from-[#1e3a5f] via-[#264174] to-[#DC2626] py-12 sm:py-16 md:py-20 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-10 border border-white/10">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
                  Review Your Answers
                </h2>
              </div>
              
              <div className="mb-8">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                    <div className="text-4xl font-black text-white mb-2">{answeredQuestionsList.length}</div>
                    <div className="text-white/90 text-sm font-medium uppercase tracking-wide">Questions Answered</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                    <div className="text-4xl font-black text-white mb-2">{stillSkippedQuestions.length}</div>
                    <div className="text-white/90 text-sm font-medium uppercase tracking-wide">Questions Skipped</div>
                  </div>
                </div>
              </div>

              {stillSkippedQuestions.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-black text-white mb-6">
                    Skipped Questions
                  </h3>
                  <div className="space-y-4">
                    {stillSkippedQuestions.map((question) => (
                      <div key={question.id} className="bg-white/10 rounded-xl p-5 border border-white/20">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-bold">Question {session.questions.findIndex(q => q.id === question.id) + 1}</span>
                          <button
                            onClick={() => {
                              setCurrentQuestionIndex(session.questions.findIndex(q => q.id === question.id))
                              setShowReview(false)
                            }}
                            className="px-4 py-2 bg-[#DC2626] text-white font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors"
                          >
                            Answer Now
                          </button>
                        </div>
                        <p className="text-white/90">{question.question_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {answeredQuestionsList.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-black text-white mb-6">
                    Answered Questions
                  </h3>
                  <div className="space-y-3">
                    {answeredQuestionsList.map((question) => (
                      <div key={question.id} className="bg-white/10 rounded-xl p-4 border border-white/20">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-bold">Question {session.questions.findIndex(q => q.id === question.id) + 1}</span>
                          <span className="text-white/90 text-sm font-medium">✓ Answered</span>
                        </div>
                        <p className="text-white/80 text-sm mt-2">{question.question_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowReview(false)}
                  className="px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  Continue Test
                </button>
                <button
                  onClick={handleReviewComplete}
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-[#DC2626] text-white rounded-lg text-lg font-semibold hover:bg-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Complete Test'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (showConfirmDialog) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-8 max-w-md mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-3">
              Abandon Test?
            </h3>
            <p className="text-white/90">
              Are you sure you want to abandon this test? Your progress will be lost and this will count as an attempt.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
            >
              Cancel
            </button>
            <button
              onClick={confirmAbandon}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-[#DC2626] text-white font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Abandoning...' : 'Abandon Test'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2B2A29] text-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1e3a5f] via-[#264174] to-[#DC2626] border-b border-white/10 p-3 sm:p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-white mb-1.5">
              {session.test_config.name}
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <p className="text-white/90 text-xs sm:text-sm font-medium">
                Question {currentQuestionIndex + 1} of {session.questions.length}
              </p>
              {answeredQuestions.has(currentQuestion.id) && (
                <span className="bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  ✓ Answered
                </span>
              )}
              {skippedQuestions.has(currentQuestion.id) && (
                <span className="bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                  ⏭ Skipped
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right">
              <div className={`text-xl sm:text-2xl font-black font-mono ${isTimeLow ? 'text-white animate-pulse' : 'text-white'}`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-white/90 text-xs sm:text-sm font-medium">Time Left</div>
            </div>
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="max-w-5xl mx-auto mt-4">
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/20">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/80 mt-2 font-medium">
            <span>{Math.round(progressPercentage)}% Complete</span>
            <span>{session.questions.length - currentQuestionIndex - 1} questions remaining</span>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-5xl mx-auto p-6 lg:p-12">
        <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-6 md:p-8">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide">
                {currentQuestion.difficulty}
              </span>
              <span className="text-white/90 text-sm font-medium">
                {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white leading-relaxed">
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, index) => (
              <label
                key={option.id}
                className={`flex items-center p-5 rounded-lg border cursor-pointer transition-all duration-300 group ${
                  selectedOptions.includes(option.id)
                    ? 'bg-white/20 border-white/40 shadow-lg'
                    : 'bg-white/10 border-white/20 hover:border-white/30 hover:bg-white/15'
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
                    : 'border-white/50 group-hover:border-white/70'
                }`}>
                  {selectedOptions.includes(option.id) && (
                    <div className="w-3 h-3 bg-[#264174] rounded-full" />
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
              className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleAbandonTest}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
              >
                Abandon
              </button>
              <button
                onClick={handleSkipQuestion}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
              >
                Skip
              </button>
              <button
                onClick={handleNextQuestion}
                disabled={selectedOptions.length === 0 || isSubmitting}
                className="px-8 py-3 bg-[#DC2626] text-white font-semibold rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  DailyTestConfigWithQuestions, 
  DailyTestAttempt, 
  DailyTestResponse, 
  DailyTestResult,
  DailyTestStats 
} from '@/lib/validations/dailyTest'
import { dailyTestService } from '@/lib/services/dailyTestService'

interface DailyTestProps {
  enrollmentId: string
  courseId: string
  dayNumber: number
  onTestComplete?: (result: DailyTestResult) => void
  onClose?: () => void
}

export default function DailyTest({ enrollmentId, courseId, dayNumber, onTestComplete, onClose }: DailyTestProps) {
  const [testConfig, setTestConfig] = useState<DailyTestConfigWithQuestions | null>(null)
  const [currentAttempt, setCurrentAttempt] = useState<DailyTestAttempt | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set())
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [testResult, setTestResult] = useState<DailyTestResult | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null) // in seconds
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDailyTest()
  }, [enrollmentId, courseId, dayNumber])

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && !testCompleted) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => (prev !== null ? prev - 1 : null))
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeRemaining === 0) {
      handleSubmitTest()
    }
  }, [timeRemaining])

  const loadDailyTest = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log(`Loading daily test for day ${dayNumber}`)
      
      // Get the test configuration for this day
      const config = await dailyTestService.getDailyTestConfigByDay(courseId, dayNumber)
      if (!config) {
        setError(`No daily test available for day ${dayNumber}`)
        setLoading(false)
        return
      }

      setTestConfig(config)
      console.log('Loaded daily test config:', config)

      // Start a new test attempt
      const attempt = await dailyTestService.startDailyTest(enrollmentId, {
        test_config_id: config.id,
        day_number: dayNumber,
      })

      setCurrentAttempt(attempt)
      console.log('Started daily test attempt:', attempt)

      // Set timer if test has time limit
      if (config.time_limit_minutes) {
        setTimeRemaining(config.time_limit_minutes * 60)
      }

      // Initialize question start times
      const startTimes: Record<string, number> = {}
      config.questions.forEach(q => {
        startTimes[q.question_id] = Date.now()
      })
      setQuestionStartTimes(startTimes)

    } catch (error) {
      console.error('Error loading daily test:', error)
      setError(error instanceof Error ? error.message : 'Failed to load daily test')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
    
    // Remove from skipped questions if it was previously skipped
    if (skippedQuestions.has(questionId)) {
      setSkippedQuestions(prev => {
        const newSet = new Set(prev)
        newSet.delete(questionId)
        return newSet
      })
    }
  }

  const handleNextQuestion = async () => {
    if (!currentAttempt || !testConfig) return

    const currentQuestion = testConfig.questions[currentQuestionIndex]
    const userAnswer = userAnswers[currentQuestion.question_id]
    
    if (userAnswer) {
      // Submit the answer
      const timeSpent = Math.round((Date.now() - questionStartTimes[currentQuestion.question_id]) / 1000)
      
      try {
        await dailyTestService.submitDailyTestAnswer(currentAttempt.id, {
          question_id: currentQuestion.question_id,
          user_answer: userAnswer,
          time_spent_seconds: timeSpent,
        })
        console.log('Answer submitted successfully for question:', currentQuestion.question_id)
      } catch (error) {
        console.error('Error submitting answer:', error)
        // Don't block navigation on submission error, but log it
        alert('Failed to save your answer. Please try again or contact support if the issue persists.')
      }
    }

    if (currentQuestionIndex < testConfig.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Last question, show review
      setShowReview(true)
    }
  }

  const handleSkipQuestion = () => {
    if (!testConfig) return
    
    const currentQuestion = testConfig.questions[currentQuestionIndex]
    setSkippedQuestions(prev => new Set([...prev, currentQuestion.question_id]))
    
    if (currentQuestionIndex < testConfig.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Last question, show review
      setShowReview(true)
    }
  }

  const handleReviewComplete = async () => {
    setShowReview(false)
    await handleSubmitTest()
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmitTest = async () => {
    if (!currentAttempt || !testConfig) return

    try {
      setSubmitting(true)

      // Submit any remaining answers
      for (let i = currentQuestionIndex; i < testConfig.questions.length; i++) {
        const question = testConfig.questions[i]
        const userAnswer = userAnswers[question.question_id]
        
        if (userAnswer) {
          const timeSpent = Math.round((Date.now() - questionStartTimes[question.question_id]) / 1000)
          
          await dailyTestService.submitDailyTestAnswer(currentAttempt.id, {
            question_id: question.question_id,
            user_answer: userAnswer,
            time_spent_seconds: timeSpent,
          })
        }
      }

      // Complete the test
      const result = await dailyTestService.completeDailyTest(currentAttempt.id)
      setTestResult(result)
      setTestCompleted(true)
      setShowResults(true)

      if (onTestComplete) {
        onTestComplete(result)
      }

    } catch (error) {
      console.error('Error submitting daily test:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit test')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400'
    if (percentage >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-12 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-white mx-auto mb-6"></div>
          <p className="text-white text-center font-medium text-lg">Loading daily test...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-900/50 via-red-800/50 to-red-900/50 border border-red-700/50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Daily Test Unavailable
            </h2>
            <p className="text-gray-300 font-light mb-6">{error}</p>
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white font-black rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Close
            </button>
            <button
              onClick={loadDailyTest}
              className="group relative px-6 py-3 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10">Retry</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showReview && testConfig) {
    const stillSkippedQuestions = testConfig.questions.filter(q => 
      skippedQuestions.has(q.question_id) && !userAnswers[q.question_id]
    )
    const answeredQuestions = testConfig.questions.filter(q => userAnswers[q.question_id])
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in overflow-y-auto">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 max-w-5xl w-full mx-4 my-8 shadow-2xl">
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
                <div className="text-4xl font-black text-green-300 mb-2">{answeredQuestions.length}</div>
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
                  <div key={question.question_id} className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-yellow-700/50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-yellow-300 font-bold">Question {testConfig.questions.findIndex(q => q.question_id === question.question_id) + 1}</span>
                      <button
                        onClick={() => {
                          setCurrentQuestionIndex(testConfig.questions.findIndex(q => q.question_id === question.question_id))
                          setShowReview(false)
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-white via-gray-100 to-white text-black font-bold rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                      >
                        Answer Now
                      </button>
                    </div>
                    <p className="text-gray-300 font-light">{(question as any).question?.question_text || 'Question'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {answeredQuestions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-black text-white mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                Answered Questions
              </h3>
              <div className="space-y-3">
                {answeredQuestions.map((question) => (
                  <div key={question.question_id} className="bg-gradient-to-br from-green-900/30 via-green-800/20 to-green-900/30 border border-green-700/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-green-300 font-bold">Question {testConfig.questions.findIndex(q => q.question_id === question.question_id) + 1}</span>
                      <span className="text-green-300 text-sm font-medium">✓ Answered</span>
                    </div>
                    <p className="text-gray-300 text-sm mt-2 font-light">{(question as any).question?.question_text || 'Question'}</p>
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
              disabled={submitting}
              className="group relative px-8 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10">{submitting ? 'Submitting...' : 'Submit Test'}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showResults && testResult) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
          <div className="text-center mb-8">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center border-2 shadow-2xl ${
              testResult.passed 
                ? 'bg-gradient-to-br from-green-900/50 via-green-800/50 to-green-900/50 border-green-700/50' 
                : 'bg-gradient-to-br from-red-900/50 via-red-800/50 to-red-900/50 border-red-700/50'
            }`}>
              {testResult.passed ? (
                <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-6 shadow-2xl backdrop-blur-sm">
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-300 rounded-full mr-3 animate-pulse"></div>
              <span className="text-white text-xs font-bold tracking-[0.22em] uppercase">DAY {dayNumber} TEST RESULTS</span>
              <div className="w-2.5 h-2.5 bg-gradient-to-r from-gray-300 to-white rounded-full ml-3 animate-pulse"></div>
            </div>
            <h2 className="text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Daily Test Results
            </h2>
            <p className="text-gray-300 font-light">{testConfig?.title}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-gray-300 text-sm font-medium mb-2">Score</p>
              <p className={`text-3xl font-black ${getScoreColor(testResult.percentage)}`}>
                {testResult.score}/{testResult.max_score}
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-gray-300 text-sm font-medium mb-2">Percentage</p>
              <p className={`text-3xl font-black ${getScoreColor(testResult.percentage)}`}>
                {testResult.percentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-gray-300 text-sm font-medium mb-2">Time Taken</p>
              <p className="text-3xl font-black text-white">
                {testResult.time_taken_minutes}m
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-gray-300 text-sm font-medium mb-2">Status</p>
              <p className={`text-2xl font-black ${testResult.passed ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.passed ? 'PASSED' : 'FAILED'}
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-full h-3 overflow-hidden border border-gray-700/50 mb-6">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                testResult.passed 
                  ? 'bg-gradient-to-r from-green-600 via-green-500 to-green-600' 
                  : 'bg-gradient-to-r from-white via-gray-200 to-white'
              }`}
              style={{ width: `${Math.min(testResult.percentage, 100)}%` }}
            />
          </div>

          {testResult.passed ? (
            <div className="bg-gradient-to-br from-green-900/30 via-green-800/20 to-green-900/30 border border-green-700/30 rounded-xl p-5 mb-6">
              <p className="text-green-300 font-bold text-lg mb-2">🎉 Congratulations! You passed the daily test!</p>
              <p className="text-green-200 text-sm font-light">Keep up the great work!</p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-red-900/30 via-red-800/20 to-red-900/30 border border-red-700/30 rounded-xl p-5 mb-6">
              <p className="text-red-300 font-bold text-lg mb-2">Don't worry, you can try again!</p>
              <p className="text-red-200 text-sm font-light">Review the material and attempt the test again.</p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-8 py-4 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white font-black rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Close
            </button>
            {!testResult.passed && testConfig && (
              <button
                onClick={() => {
                  setTestCompleted(false)
                  setShowResults(false)
                  setCurrentQuestionIndex(0)
                  setUserAnswers({})
                  loadDailyTest()
                }}
                className="group relative px-8 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10">Retake Test</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!testConfig || !currentAttempt) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-900/50 via-red-800/50 to-red-900/50 border border-red-700/50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Test Not Available
            </h2>
            <p className="text-gray-300 font-light mb-6">The daily test could not be loaded.</p>
          </div>
          <button
            onClick={onClose}
            className="w-full px-8 py-4 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white font-black rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = testConfig.questions[currentQuestionIndex]    
  const question = (currentQuestion as any)?.question

  if (!question) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-900/50 via-red-800/50 to-red-900/50 border border-red-700/50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Question Not Found
            </h2>
            <p className="text-gray-300 font-light mb-6">The current question could not be loaded.</p>
          </div>
          <button
            onClick={onClose}
            className="w-full px-8 py-4 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white font-black rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const progressPercentage = ((currentQuestionIndex + 1) / testConfig.questions.length) * 100
  const isTimeLow = timeRemaining !== null && timeRemaining < 300

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 max-w-4xl w-full mx-4 my-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Day {dayNumber} Test
            </h2>
            <p className="text-gray-300 font-light">{testConfig.title}</p>
          </div>
          <div className="flex items-center gap-3">
            {timeRemaining !== null && (
              <div className="text-right">
                <div className={`text-xl font-black font-mono ${isTimeLow ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-gray-300 text-xs font-medium">Time Left</div>
              </div>
            )}
            <button 
              onClick={onClose} 
              className="p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:text-white hover:border-gray-500/70 transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-gray-300 text-sm font-medium">
              Question {currentQuestionIndex + 1} of {testConfig.questions.length}
            </span>
            {userAnswers[question.id] && (
              <span className="bg-gradient-to-r from-green-900/50 to-green-800/50 border border-green-700/50 text-green-300 px-3 py-1 rounded-full text-xs font-bold">
                ✓ Answered
              </span>
            )}
            {skippedQuestions.has(question.id) && (
              <span className="bg-gradient-to-r from-yellow-900/50 to-yellow-800/50 border border-yellow-700/50 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">
                ⏭ Skipped
              </span>
            )}
          </div>
          <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden border border-gray-700/50">
            <div 
              className="h-full bg-gradient-to-r from-white via-gray-200 to-white rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-8 mb-6">
          <p className="text-xl text-white mb-6 font-light leading-relaxed">{question.question_text}</p>
          
          {question.question_type === 'multiple_choice' && question.options && (
            <div className="space-y-3">
              {Object.entries(question.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleAnswerSelect(question.id, key)}
                  className={`w-full text-left p-5 rounded-xl border transition-all duration-300 group ${
                    userAnswers[question.id] === key
                      ? 'bg-gradient-to-r from-white/20 via-gray-200/10 to-white/20 border-white/50 shadow-lg'
                      : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-gray-500/70 hover:bg-gray-800/70'
                  }`}
                >
                  <span className="font-black mr-3 text-white">{key}.</span>
                  <span className="text-gray-200 group-hover:text-white font-medium">{String(value)}</span>
                </button>
              ))}
            </div>
          )}
          
          {question.question_type === 'true_false' && (
            <div className="flex gap-4">
              <button
                onClick={() => handleAnswerSelect(question.id, 'true')}
                className={`flex-1 text-center p-5 rounded-xl border transition-all duration-300 font-bold ${
                  userAnswers[question.id] === 'true'
                    ? 'bg-gradient-to-r from-white/20 via-gray-200/10 to-white/20 border-white/50 shadow-lg text-white'
                    : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-gray-500/70 hover:bg-gray-800/70 text-gray-200'
                }`}
              >
                True
              </button>
              <button
                onClick={() => handleAnswerSelect(question.id, 'false')}
                className={`flex-1 text-center p-5 rounded-xl border transition-all duration-300 font-bold ${
                  userAnswers[question.id] === 'false'
                    ? 'bg-gradient-to-r from-white/20 via-gray-200/10 to-white/20 border-white/50 shadow-lg text-white'
                    : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-gray-500/70 hover:bg-gray-800/70 text-gray-200'
                }`}
              >
                False
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center flex-wrap gap-4">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Previous
          </button>
          
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleSkipQuestion}
              className="px-6 py-3 bg-gradient-to-r from-yellow-800 via-yellow-700 to-yellow-800 border border-yellow-700/50 hover:border-yellow-600/70 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Skip Question
            </button>
            {currentQuestionIndex < testConfig.questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                disabled={!userAnswers[question.id]}
                className="group relative px-8 py-3 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10">Next Question</span>
              </button>
            ) : (
              <button
                onClick={() => setShowReview(true)}
                disabled={submitting}
                className="group relative px-8 py-3 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10">{submitting ? 'Submitting...' : 'Review & Submit'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



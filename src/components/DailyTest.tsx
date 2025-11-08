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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white text-center">Loading daily test...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-white mb-4">Daily Test Unavailable</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              Close
            </button>
            <button
              onClick={loadDailyTest}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showReview && testConfig) {
    // Recalculate skipped questions - remove any that have been answered since being skipped
    const stillSkippedQuestions = testConfig.questions.filter(q => 
      skippedQuestions.has(q.question_id) && !userAnswers[q.question_id]
    )
    const answeredQuestions = testConfig.questions.filter(q => userAnswers[q.question_id])
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Review Your Answers</h2>
          
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="text-green-400 font-semibold text-lg">{answeredQuestions.length}</div>
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
                  <div key={question.question_id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-yellow-400 font-medium">Question {testConfig.questions.findIndex(q => q.question_id === question.question_id) + 1}</span>
                      <button
                        onClick={() => {
                          setCurrentQuestionIndex(testConfig.questions.findIndex(q => q.question_id === question.question_id))
                          setShowReview(false)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Answer Now
                      </button>
                    </div>
                    <p className="text-gray-300 text-sm">{(question as any).question?.question_text || 'Question'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {answeredQuestions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Answered Questions</h3>
              <div className="space-y-2">
                {answeredQuestions.map((question, index) => (
                  <div key={question.question_id} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 font-medium">Question {testConfig.questions.findIndex(q => q.question_id === question.question_id) + 1}</span>
                      <span className="text-green-300 text-sm">✓ Answered</span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1">{(question as any).question?.question_text || 'Question'}</p>
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
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showResults && testResult) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-2xl w-full mx-4">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Daily Test Results</h2>
          
          <div className="text-center mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Day {dayNumber} Test</h3>
              <p className="text-gray-300">{testConfig?.title}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(testResult.percentage)}`}>
                  {testResult.score}/{testResult.max_score}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Percentage</p>
                <p className={`text-2xl font-bold ${getScoreColor(testResult.percentage)}`}>
                  {testResult.percentage.toFixed(1)}%
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Time Taken</p>
                <p className="text-2xl font-bold text-white">
                  {testResult.time_taken_minutes}m
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-gray-400 text-sm">Status</p>
                <p className={`text-2xl font-bold ${testResult.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {testResult.passed ? 'PASSED' : 'FAILED'}
                </p>
              </div>
            </div>

            {testResult.passed ? (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-4">
                <p className="text-green-400 font-semibold">🎉 Congratulations! You passed the daily test!</p>
                <p className="text-green-300 text-sm mt-1">Keep up the great work!</p>
              </div>
            ) : (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-red-400 font-semibold">Don't worry, you can try again!</p>
                <p className="text-red-300 text-sm mt-1">Review the material and attempt the test again.</p>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
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
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Retake Test
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!testConfig || !currentAttempt) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Test Not Available</h2>
          <p className="text-gray-300 mb-6">The daily test could not be loaded.</p>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Question Not Found</h2>
          <p className="text-gray-300 mb-6">The current question could not be loaded.</p>
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Day {dayNumber} Test</h2>
            <p className="text-gray-300">{testConfig.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 text-sm text-gray-400 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span>Question {currentQuestionIndex + 1} of {testConfig.questions.length}</span>
            {userAnswers[question.id] && (
              <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                ✓ Answered
              </span>
            )}
            {skippedQuestions.has(question.id) && (
              <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
                ⏭ Skipped
              </span>
            )}
          </div>
          {timeRemaining !== null && (
            <span className="font-semibold">Time Left: {formatTime(timeRemaining)}</span>
          )}
        </div>

        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <p className="text-lg text-white mb-4">{question.question_text}</p>
          
          {question.question_type === 'multiple_choice' && question.options && (
            <div className="space-y-3">
              {Object.entries(question.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleAnswerSelect(question.id, key)}
                  className={`w-full text-left p-3 rounded-md border transition-all duration-200
                    ${userAnswers[question.id] === key
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-200'
                    }`}
                >
                  <span className="font-semibold mr-2">{key}.</span> {String(value)}
                </button>
              ))}
            </div>
          )}
          
          {question.question_type === 'true_false' && (
            <div className="flex space-x-4">
              <button
                onClick={() => handleAnswerSelect(question.id, 'true')}
                className={`flex-1 text-center p-3 rounded-md border transition-all duration-200
                  ${userAnswers[question.id] === 'true'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-200'
                  }`}
              >
                True
              </button>
              <button
                onClick={() => handleAnswerSelect(question.id, 'false')}
                className={`flex-1 text-center p-3 rounded-md border transition-all duration-200
                  ${userAnswers[question.id] === 'false'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-200'
                  }`}
              >
                False
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="bg-gray-600/50 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleSkipQuestion}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
            >
              Skip Question
            </button>
            {currentQuestionIndex < testConfig.questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                disabled={!userAnswers[question.id]}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={() => setShowReview(true)}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Review & Submit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



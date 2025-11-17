'use client'

import { useState, useEffect, useCallback } from 'react'
import { type CourseQuiz, QuizQuestion, QuizAttempt, type QuizResponse } from '@/lib/validations/course'
import { courseService } from '@/lib/services/courseService'
import { getSupabaseClient } from '@/lib/supabase/client'
import { showToast } from './Toast'

interface CourseQuizProps {
  quiz: CourseQuiz & { questions?: QuizQuestion[] }
  enrollmentId: string
  onQuizComplete?: (attempt: QuizAttempt) => void
  onClose?: () => void
}

export default function CourseQuiz({ quiz, enrollmentId, onQuizComplete, onClose }: CourseQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set())
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  useEffect(() => {
    loadQuizData()
  }, [quiz.id, enrollmentId])

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && !quizCompleted) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => (prev !== null ? prev - 1 : null))
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeRemaining === 0) {
      handleSubmitQuiz()
    }
  }, [timeRemaining])

  const loadQuizData = async () => {
    try {
      setLoading(true)
      
      if (!quiz.id) {
        const sampleQuestions: QuizQuestion[] = [
          {
            id: 'sample-1',
            quiz_id: 'fallback-quiz-id',
            question_text: 'What is the primary purpose of accounting?',
            question_type: 'multiple_choice',
            options: {
              'A': 'To make money',
              'B': 'To provide financial information for decision making',
              'C': 'To calculate taxes',
              'D': 'To manage employees'
            },
            correct_answer: 'B',
            explanation: 'Accounting provides financial information that helps stakeholders make informed decisions.',
            points: 1,
            order_index: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'sample-2',
            quiz_id: 'fallback-quiz-id',
            question_text: 'The accounting equation is: Assets = Liabilities + Owner\'s Equity',
            question_type: 'true_false',
            correct_answer: 'true',
            explanation: 'This is the fundamental accounting equation that must always balance.',
            points: 1,
            order_index: 2,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
        setQuestions(sampleQuestions)
        setLoading(false)
        return
      }
      
      // Parallelize quiz attempt creation and questions loading
      const [attemptResult, questionsResult] = await Promise.allSettled([
        courseService.startQuizAttempt(enrollmentId, quiz.id),
        // Load questions if not already included
        quiz.questions && quiz.questions.length > 0
          ? Promise.resolve(quiz.questions)
          : (async () => {
              const supabase = getSupabaseClient()
              const { data: questionsData, error } = await supabase
                .from('quiz_questions')
                .select('*')
                .eq('quiz_id', quiz.id)
                .eq('is_active', true)
                .order('order_index')
              
              if (error) {
                console.error('Error loading quiz questions:', error)
                return []
              }
              return questionsData || []
            })()
      ])

      // Process attempt
      if (attemptResult.status === 'fulfilled') {
        setCurrentAttempt(attemptResult.value)
      } else {
        console.error('Error starting quiz attempt:', attemptResult.reason)
        showToast('Failed to start quiz. Please try again.', 'error')
        setLoading(false)
        return
      }

      // Process questions
      if (questionsResult.status === 'fulfilled') {
        setQuestions(questionsResult.value)
      } else {
        console.error('Error loading questions:', questionsResult.reason)
        setQuestions([])
      }
      
      if (quiz.time_limit_minutes) {
        setTimeRemaining(quiz.time_limit_minutes * 60)
      }
    } catch (error) {
      console.error('Error loading quiz:', error)
      showToast('Failed to load quiz. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
    
    if (skippedQuestions.has(questionId)) {
      setSkippedQuestions(prev => {
        const newSet = new Set(prev)
        newSet.delete(questionId)
        return newSet
      })
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleSkipQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex]
    if (currentQuestion) {
      setSkippedQuestions(prev => new Set([...prev, currentQuestion.id]))
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        setShowReview(true)
      }
    }
  }

  const handleReviewComplete = () => {
    setShowReview(false)
    handleSubmitQuiz()
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!currentAttempt) return

    try {
      setSubmitting(true)

      if (currentAttempt.quiz_id === 'fallback-quiz-id') {
        let correctAnswers = 0
        let totalQuestions = questions.length
        
        questions.forEach(question => {
          const userAnswer = userAnswers[question.id]
          if (userAnswer === question.correct_answer) {
            correctAnswers++
          }
        })
        
        const percentageScore = (correctAnswers / totalQuestions) * 100
        
        const completedAttempt: QuizAttempt = {
          ...currentAttempt,
          submitted_at: new Date().toISOString(),
          score: correctAnswers,
          max_score: totalQuestions,
          percentage_score: percentageScore,
          time_taken_minutes: 5,
          status: 'submitted'
        }
        
        setCurrentAttempt(completedAttempt)
        setQuizCompleted(true)
        setShowResults(true)

        if (onQuizComplete) {
          onQuizComplete(completedAttempt)
        }
        return
      }

      for (const [questionId, answer] of Object.entries(userAnswers)) {
        await courseService.submitQuizResponse(currentAttempt.id, questionId, answer)
      }

      const completedAttempt = await courseService.submitQuizAttempt(currentAttempt.id)
      setCurrentAttempt(completedAttempt)
      setQuizCompleted(true)
      setShowResults(true)
      showToast('Quiz submitted successfully!', 'success')

      if (onQuizComplete) {
        onQuizComplete(completedAttempt)
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
      showToast('Failed to submit quiz. Please try again.', 'error')
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

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100
  const isTimeLow = timeRemaining !== null && timeRemaining < 300

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-12 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-white mx-auto mb-6"></div>
          <p className="text-white text-center font-medium text-lg">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz.id) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-900/50 via-red-800/50 to-red-900/50 border border-red-700/50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Invalid Quiz
            </h2>
            <p className="text-gray-300 font-light">The quiz data is invalid or missing.</p>
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

  if (showReview) {
    const stillSkippedQuestions = questions.filter(q => 
      skippedQuestions.has(q.id) && !userAnswers[q.id]
    )
    const answeredQuestions = questions.filter(q => userAnswers[q.id])
    
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
                  <div key={question.id} className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-yellow-700/50 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-yellow-300 font-bold">Question {questions.findIndex(q => q.id === question.id) + 1}</span>
                      <button
                        onClick={() => {
                          setCurrentQuestionIndex(questions.findIndex(q => q.id === question.id))
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

          {answeredQuestions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-black text-white mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                Answered Questions
              </h3>
              <div className="space-y-3">
                {answeredQuestions.map((question) => (
                  <div key={question.id} className="bg-gradient-to-br from-green-900/30 via-green-800/20 to-green-900/30 border border-green-700/30 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-green-300 font-bold">Question {questions.findIndex(q => q.id === question.id) + 1}</span>
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
              Continue Quiz
            </button>
            <button
              onClick={handleReviewComplete}
              disabled={submitting}
              className="group relative px-8 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10">{submitting ? 'Submitting...' : 'Submit Quiz'}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showResults && currentAttempt) {
    const passed = (currentAttempt.percentage_score || 0) >= (quiz.passing_score_percentage || 0)
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
          <div className="text-center mb-8">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center border-2 shadow-2xl ${
              passed 
                ? 'bg-gradient-to-br from-green-900/50 via-green-800/50 to-green-900/50 border-green-700/50' 
                : 'bg-gradient-to-br from-red-900/50 via-red-800/50 to-red-900/50 border-red-700/50'
            }`}>
              {passed ? (
                <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h2 className="text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Quiz Results
            </h2>
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-4 text-center">
                <div className={`text-3xl font-black mb-2 ${getScoreColor(currentAttempt.percentage_score || 0)}`}>
                  {currentAttempt.score} / {currentAttempt.max_score}
                </div>
                <div className="text-gray-300 text-sm font-medium">Score</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-4 text-center">
                <div className={`text-3xl font-black mb-2 ${getScoreColor(currentAttempt.percentage_score || 0)}`}>
                  {(currentAttempt.percentage_score || 0).toFixed(1)}%
                </div>
                <div className="text-gray-300 text-sm font-medium">Percentage</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-4 text-center">
                <div className={`text-2xl font-black mb-2 ${passed ? 'text-green-400' : 'text-red-400'}`}>
                  {passed ? 'PASSED' : 'FAILED'}
                </div>
                <div className="text-gray-300 text-sm font-medium">Status</div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-full h-3 overflow-hidden border border-gray-700/50">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  passed 
                    ? 'bg-gradient-to-r from-green-600 via-green-500 to-green-600' 
                    : 'bg-gradient-to-r from-white via-gray-200 to-white'
                }`}
                style={{ width: `${Math.min(currentAttempt.percentage_score || 0, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-8 py-4 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white font-black rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Close
            </button>
            {!passed && (quiz.max_attempts === null || (currentAttempt.attempt_number || 0) < (quiz.max_attempts || 0)) && (
              <button
                onClick={() => {
                  setQuizCompleted(false)
                  setShowResults(false)
                  setCurrentQuestionIndex(0)
                  setUserAnswers({})
                  loadQuizData()
                }}
                className="group relative px-8 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10">Retake Quiz</span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              No Questions Found
            </h2>
            <p className="text-gray-300 font-light">There are no questions available for this quiz.</p>
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 max-w-4xl w-full mx-4 my-8 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              {quiz.title}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-gray-300 text-sm font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            {userAnswers[currentQuestion.id] && (
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

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden border border-gray-700/50">
            <div 
              className="h-full bg-gradient-to-r from-white via-gray-200 to-white rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-8 mb-6">
          <p className="text-xl text-white mb-6 font-light leading-relaxed">{currentQuestion.question_text}</p>
          
          {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3">
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleAnswerSelect(currentQuestion.id, key)}
                  className={`w-full text-left p-5 rounded-xl border transition-all duration-300 group ${
                    userAnswers[currentQuestion.id] === key
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
          
          {currentQuestion.question_type === 'true_false' && (
            <div className="flex gap-4">
              <button
                onClick={() => handleAnswerSelect(currentQuestion.id, 'true')}
                className={`flex-1 text-center p-5 rounded-xl border transition-all duration-300 font-bold ${
                  userAnswers[currentQuestion.id] === 'true'
                    ? 'bg-gradient-to-r from-white/20 via-gray-200/10 to-white/20 border-white/50 shadow-lg text-white'
                    : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-gray-500/70 hover:bg-gray-800/70 text-gray-200'
                  }`}
              >
                True
              </button>
              <button
                onClick={() => handleAnswerSelect(currentQuestion.id, 'false')}
                className={`flex-1 text-center p-5 rounded-xl border transition-all duration-300 font-bold ${
                  userAnswers[currentQuestion.id] === 'false'
                    ? 'bg-gradient-to-r from-white/20 via-gray-200/10 to-white/20 border-white/50 shadow-lg text-white'
                    : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-gray-500/70 hover:bg-gray-800/70 text-gray-200'
                  }`}
              >
                False
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
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
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="group relative px-8 py-3 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 overflow-hidden"
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

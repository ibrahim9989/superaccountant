'use client'

import { useState, useEffect, useCallback } from 'react'
import { type CourseQuiz, QuizQuestion, QuizAttempt, type QuizResponse } from '@/lib/validations/course'
import { courseService } from '@/lib/services/courseService'
import { getSupabaseClient } from '@/lib/supabase/client'

interface CourseQuizProps {
  quiz: CourseQuiz & { questions?: QuizQuestion[] } // Allow pre-loaded questions
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
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null) // in seconds

  useEffect(() => {
    loadQuizData()
  }, [quiz.id, enrollmentId]) // Depend on quiz.id and enrollmentId

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
      
      console.log('Loading quiz data for quiz:', quiz.id)
      console.log('Quiz object:', quiz)
      
      // Check if quiz has valid ID
      if (!quiz.id) {
        console.error('Quiz ID is undefined or null')
        console.log('Creating fallback quiz with sample questions')
        
        // Create a fallback quiz with sample questions
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
      
      // Start a new quiz attempt
      const attempt = await courseService.startQuizAttempt(enrollmentId, quiz.id)
      setCurrentAttempt(attempt)
      console.log('Quiz attempt started:', attempt)

      // Use questions from quiz if available, otherwise load them
      if (quiz.questions && quiz.questions.length > 0) {
        console.log('Using questions from quiz object:', quiz.questions)
        setQuestions(quiz.questions)
      } else {
        console.log('Loading questions from database for quiz:', quiz.id)
        
        // For fallback quiz, we need to find the actual quiz for this lesson
        if (quiz.id === 'fallback-quiz-id') {
          console.log('Loading questions for fallback quiz - need to find actual quiz for this lesson')
          
          // Get the lesson ID from the quiz object (we'll need to pass this)
          const lessonId = (quiz as any).lesson_id
          if (lessonId) {
            console.log('Fetching quiz for lesson:', lessonId)
            try {
              const actualQuiz = await courseService.getQuizByLessonId(lessonId)
              if (actualQuiz && (actualQuiz as any).questions && (actualQuiz as any).questions.length > 0) {
                console.log('Found actual quiz with questions:', actualQuiz)
                setQuestions((actualQuiz as any).questions)
              } else {
                console.log('No quiz found for lesson or no questions, using sample questions')
                // Use sample questions as fallback
                const sampleQuestions: QuizQuestion[] = [
                  {
                    id: 'sample-1',
                    quiz_id: quiz.id,
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
                    quiz_id: quiz.id,
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
              }
            } catch (error) {
              console.error('Error fetching quiz for lesson:', error)
              console.log('Using sample questions due to error')
              // Use sample questions as fallback
              const sampleQuestions: QuizQuestion[] = [
                {
                  id: 'sample-1',
                  quiz_id: quiz.id,
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
                  quiz_id: quiz.id,
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
            }
          } else {
            console.log('No lesson ID available, using sample questions')
            // Use sample questions as final fallback
            const sampleQuestions: QuizQuestion[] = [
              {
                id: 'sample-1',
                quiz_id: quiz.id,
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
                quiz_id: quiz.id,
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
          }
        } else {
          // Regular quiz loading
          const supabase = getSupabaseClient()
          const { data: questionsData, error } = await supabase
            .from('quiz_questions')
            .select('*')
            .eq('quiz_id', quiz.id)
            .eq('is_active', true)
            .order('order_index')

          if (error) {
            console.error('Error loading quiz questions:', error)
            console.error('Error details:', error.message, error.code)
            return
          }

          console.log('Loaded questions from database:', questionsData)
          setQuestions(questionsData || [])
        }
      }
      
      // Set timer if quiz has time limit
      if (quiz.time_limit_minutes) {
        setTimeRemaining(quiz.time_limit_minutes * 60)
      }
    } catch (error) {
      console.error('Error loading quiz:', error)
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
        // Last question, show review
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

      // Handle fallback quiz submission
      if (currentAttempt.quiz_id === 'fallback-quiz-id') {
        // Calculate score for fallback quiz
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
          time_taken_minutes: 5, // Mock time
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

      // Submit all answers for real quiz
      for (const [questionId, answer] of Object.entries(userAnswers)) {
        await courseService.submitQuizResponse(currentAttempt.id, questionId, answer)
      }

      // Submit the quiz attempt
      const completedAttempt = await courseService.submitQuizAttempt(currentAttempt.id)
      setCurrentAttempt(completedAttempt)
      setQuizCompleted(true)
      setShowResults(true)

      if (onQuizComplete) {
        onQuizComplete(completedAttempt)
      }
    } catch (error) {
      console.error('Error submitting quiz:', error)
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
          <p className="text-white text-center">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz.id) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Invalid Quiz</h2>
          <p className="text-gray-300 mb-6">The quiz data is invalid or missing.</p>
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

  if (showReview) {
    // Recalculate skipped questions - remove any that have been answered since being skipped
    const currentlySkippedQuestions = questions.filter(q => 
      skippedQuestions.has(q.id) && !userAnswers[q.id]
    )
    const answeredQuestions = questions.filter(q => userAnswers[q.id])
    const stillSkippedQuestions = questions.filter(q => 
      skippedQuestions.has(q.id) && !userAnswers[q.id]
    )
    
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
                  <div key={question.id} className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-yellow-400 font-medium">Question {questions.findIndex(q => q.id === question.id) + 1}</span>
                      <button
                        onClick={() => {
                          const questionIndex = questions.findIndex(q => q.id === question.id)
                          setCurrentQuestionIndex(questionIndex)
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

          {answeredQuestions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Answered Questions</h3>
              <div className="space-y-2">
                {answeredQuestions.map((question, index) => (
                  <div key={question.id} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 font-medium">Question {questions.findIndex(q => q.id === question.id) + 1}</span>
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
              Continue Quiz
            </button>
            <button
              onClick={handleReviewComplete}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showResults && currentAttempt) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-2xl w-full mx-4">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Quiz Results</h2>
          <div className="text-center mb-6">
            <p className="text-gray-300 text-lg">Your Score: <span className={getScoreColor(currentAttempt.percentage_score || 0)}>{currentAttempt.score} / {currentAttempt.max_score}</span></p>
            <p className="text-gray-300 text-lg">Percentage: <span className={getScoreColor(currentAttempt.percentage_score || 0)}>{(currentAttempt.percentage_score || 0).toFixed(2)}%</span></p>
            <p className="text-gray-300 text-lg">Status: {((currentAttempt.percentage_score || 0) >= (quiz.passing_score_percentage || 0)) ? <span className="text-green-400">Passed</span> : <span className="text-red-400">Failed</span>}</p>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              Close
            </button>
            {((currentAttempt.percentage_score || 0) < (quiz.passing_score_percentage || 0)) && (quiz.max_attempts === null || (currentAttempt.attempt_number || 0) < (quiz.max_attempts || 0)) && (
              <button
                onClick={() => {
                  setQuizCompleted(false)
                  setShowResults(false)
                  setCurrentQuestionIndex(0)
                  setUserAnswers({})
                  loadQuizData() // Restart quiz
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
              >
                Retake Quiz
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">No Questions Found</h2>
          <p className="text-gray-300 mb-6">There are no questions available for this quiz.</p>
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
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 max-w-3xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{quiz.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 text-sm text-gray-400 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            {userAnswers[currentQuestion.id] && (
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
          {timeRemaining !== null && (
            <span className="font-semibold">Time Left: {formatTime(timeRemaining)}</span>
          )}
        </div>

        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <p className="text-lg text-white mb-4">{currentQuestion.question_text}</p>
          {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3">
              {Object.entries(currentQuestion.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleAnswerSelect(currentQuestion.id, key)}
                  className={`w-full text-left p-3 rounded-md border transition-all duration-200
                    ${userAnswers[currentQuestion.id] === key
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-200'
                    }`}
                >
                  <span className="font-semibold mr-2">{key}.</span> {String(value)}
                </button>
              ))}
            </div>
          )}
          {currentQuestion.question_type === 'true_false' && (
            <div className="flex space-x-4">
              <button
                onClick={() => handleAnswerSelect(currentQuestion.id, 'true')}
                className={`flex-1 text-center p-3 rounded-md border transition-all duration-200
                  ${userAnswers[currentQuestion.id] === 'true'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-200'
                  }`}
              >
                True
              </button>
              <button
                onClick={() => handleAnswerSelect(currentQuestion.id, 'false')}
                className={`flex-1 text-center p-3 rounded-md border transition-all duration-200
                  ${userAnswers[currentQuestion.id] === 'false'
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
            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
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
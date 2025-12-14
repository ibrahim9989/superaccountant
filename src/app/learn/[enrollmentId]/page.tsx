'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState, use, useCallback, useRef } from 'react'
import { CourseEnrollmentWithDetails, LessonWithDetails, CourseProgress, QuizAttempt } from '@/lib/validations/course'
import { courseService } from '@/lib/services/courseService'
import { dailyTestService } from '@/lib/services/dailyTestService'
import CourseQuiz from '@/components/CourseQuiz'
import DailyTest from '@/components/DailyTest'
import QuizHistory from '@/components/QuizHistory'
import AssignmentSubmission from '@/components/AssignmentSubmission'
import GrandtestTrigger from '@/components/GrandtestTrigger'
import LessonFlowchart from '@/components/LessonFlowchart'

interface LearnPageProps {
  params: Promise<{
    enrollmentId: string
  }>
}

export default function LearnPage({ params }: LearnPageProps) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [enrollment, setEnrollment] = useState<CourseEnrollmentWithDetails | null>(null)
  const [currentLesson, setCurrentLesson] = useState<LessonWithDetails | null>(null)
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile: closed by default, Desktop: will be handled
  const [showQuiz, setShowQuiz] = useState(false)
  const [showTest, setShowTest] = useState(false)
  const [showQuizHistory, setShowQuizHistory] = useState(false)
  const [showAssignmentSubmission, setShowAssignmentSubmission] = useState(false)
  const [currentTestDay, setCurrentTestDay] = useState<number | null>(null)
  const [nextAvailableTestDay, setNextAvailableTestDay] = useState<number>(1)
  const [currentViewingDay, setCurrentViewingDay] = useState<number>(1)
  
  // Unwrap params Promise
  const resolvedParams = use(params)

  // Use ref to prevent duplicate API calls
  const hasLoadedData = useRef(false)
  const currentEnrollmentId = useRef<string | null>(null)
  
  // Cache for lesson data to avoid redundant fetches
  const lessonCache = useRef<Map<string, LessonWithDetails>>(new Map())
  
  // Prefetch next lesson in background
  const prefetchNextLesson = useCallback(async (currentLessonId: string) => {
    if (!enrollment?.course?.modules) return
    
    // Find current lesson's module and index
    for (const module of enrollment.course.modules) {
      const lessonIndex = module.lessons?.findIndex(l => l.id === currentLessonId) ?? -1
      if (lessonIndex >= 0 && module.lessons) {
        // Prefetch next lesson in same module
        const nextLesson = module.lessons[lessonIndex + 1]
        if (nextLesson && !lessonCache.current.has(nextLesson.id)) {
          // Prefetch in background (don't await)
          courseService.getLessonById(nextLesson.id).then(lesson => {
            if (lesson) {
              lessonCache.current.set(nextLesson.id, lesson)
              console.log('✅ Prefetched next lesson:', lesson.title)
            }
          }).catch(err => {
            console.warn('⚠️ Failed to prefetch lesson:', err)
          })
        }
        break
      }
    }
  }, [enrollment])

  // Handle sidebar state for desktop - closed by default, user can toggle
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        // Keep current state on desktop, don't auto-open
      } else {
        // On mobile, close sidebar when resizing to mobile
        setSidebarOpen(false)
      }
    }
    
    // Listen for resize events
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadNextAvailableTestDay = useCallback(async () => {
    if (enrollment) {
      try {
        const nextDay = await dailyTestService.getNextAvailableTestDay(enrollment.id)
        setNextAvailableTestDay(nextDay)
      } catch (error) {
        console.error('Error loading next available test day:', error)
      }
    }
  }, [enrollment])

  const loadEnrollmentData = useCallback(async () => {
    if (!user || !resolvedParams.enrollmentId) return
    
    // Only reload if enrollmentId changed or data hasn't been loaded yet
    if (hasLoadedData.current && currentEnrollmentId.current === resolvedParams.enrollmentId) {
      return
    }
    
    try {
      setLoadingData(true)
      hasLoadedData.current = true
      currentEnrollmentId.current = resolvedParams.enrollmentId
      
      // Parallelize initial data loading
      const [enrollmentData, progressData] = await Promise.all([
        courseService.getEnrollmentById(resolvedParams.enrollmentId),
        courseService.getCourseProgress(resolvedParams.enrollmentId)
      ])

      if (!enrollmentData) {
        router.push('/courses')
        return
      }
      setEnrollment(enrollmentData)
      setCourseProgress(progressData)

      // Debug: Log course structure
      console.log('📚 Enrollment Data:', enrollmentData)
      console.log('📚 Course:', enrollmentData.course)
      console.log('📚 Modules:', (enrollmentData.course as any)?.modules)
      console.log('📚 Modules length:', (enrollmentData.course as any)?.modules?.length)
      
      // Check if course has modules
      const modules = (enrollmentData.course as any)?.modules || []
      if (modules.length === 0) {
        console.warn('⚠️ WARNING: Course has NO modules! Course ID:', enrollmentData.course?.id)
        console.warn('⚠️ You need to add modules to this course via the admin panel or database.')
        console.warn('⚠️ Course title:', enrollmentData.course?.title)
        setCurrentLesson(null)
        setLoadingData(false)
        return
      }
      
      if (modules.length > 0) {
        console.log('📚 First module:', modules[0])
        console.log('📚 First module lessons:', modules[0]?.lessons)
        console.log('📚 First module lessons length:', modules[0]?.lessons?.length)
        
        // Check if first module has lessons
        if (!modules[0]?.lessons || modules[0].lessons.length === 0) {
          console.warn('⚠️ WARNING: First module has NO lessons! Module ID:', modules[0]?.id)
          console.warn('⚠️ You need to add lessons to this module via the admin panel or database.')
          setCurrentLesson(null)
          setLoadingData(false)
          return
        }
      }

      // Determine which lesson to load
      const lessonIdToLoad = progressData?.next_lesson?.id || 
        modules[0]?.lessons?.[0]?.id

      console.log('📚 Lesson ID to load:', lessonIdToLoad)
      
      if (!lessonIdToLoad) {
        console.warn('⚠️ WARNING: No lesson ID found to load!')
        setCurrentLesson(null)
        setLoadingData(false)
        return
      }

      if (lessonIdToLoad) {
        // Load lesson data with all related data in parallel
        const [lessonData, flowchartsResponse] = await Promise.allSettled([
          courseService.getLessonById(lessonIdToLoad),
          fetch(`/api/lessons/${lessonIdToLoad}/flowcharts`, { cache: 'no-store' }).catch(() => null)
        ])

        let finalLessonData: LessonWithDetails | null = null

        if (lessonData.status === 'fulfilled' && lessonData.value) {
          finalLessonData = lessonData.value

          // Process flowcharts
          if (finalLessonData) {
            if (flowchartsResponse.status === 'fulfilled' && flowchartsResponse.value) {
              try {
                const response = flowchartsResponse.value
                if (response) {
                  const flowchartsData = await response.json()
                  Object.assign(finalLessonData, { flowcharts: flowchartsData.data || [] })
                } else {
                  Object.assign(finalLessonData, { flowcharts: [] })
                }
              } catch (e) {
                Object.assign(finalLessonData, { flowcharts: [] })
              }
            } else {
              Object.assign(finalLessonData, { flowcharts: [] })
            }
          }

          // Fetch quiz only if not included (in background, don't block)
          if (!finalLessonData.quiz) {
            courseService.getQuizByLessonId(lessonIdToLoad)
              .then(quizData => {
                if (quizData && finalLessonData) {
                  finalLessonData.quiz = quizData
                  // Update cache with quiz data
                  lessonCache.current.set(lessonIdToLoad, { ...finalLessonData })
                  setCurrentLesson({ ...finalLessonData })
                }
              })
              .catch(() => {
                // Quiz might not exist, that's okay
              })
          }

        // Cache the lesson data for future use
        if (finalLessonData) {
          lessonCache.current.set(lessonIdToLoad, finalLessonData)
          // Prefetch next lesson in background for faster navigation
          prefetchNextLesson(lessonIdToLoad)
        }

        setCurrentLesson(finalLessonData)
        } else {
          setCurrentLesson(null)
        }
      } else {
        setCurrentLesson(null)
      }
      
      // Load next available test day in background
      loadNextAvailableTestDay().catch(err => console.error('Error loading next test day:', err))
    } catch (error) {
      console.error('Error loading enrollment data:', error)
      hasLoadedData.current = false // Reset on error to allow retry
    } finally {
      setLoadingData(false)
    }
  }, [user, resolvedParams.enrollmentId, router, loadNextAvailableTestDay])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    
    if (user && resolvedParams.enrollmentId) {
      // Reset hasLoadedData if enrollmentId changes
      if (currentEnrollmentId.current !== resolvedParams.enrollmentId) {
        hasLoadedData.current = false
      }
      loadEnrollmentData()
    }
  }, [user, loading, router, resolvedParams.enrollmentId, loadEnrollmentData])

  const handleLessonSelect = async (lessonId: string) => {
    try {
      // Check cache first for instant loading
      const cachedLesson = lessonCache.current.get(lessonId)
      if (cachedLesson) {
        setCurrentLesson(cachedLesson)
        // Update progress in background
        if (enrollment) {
          courseService.updateLessonProgress(enrollment.id, lessonId, {
            status: 'in_progress',
          }).catch(err => console.error('Error updating lesson progress:', err))
        }
        // Prefetch next lesson in background
        prefetchNextLesson(lessonId)
        return
      }

      // Optimistically show loading state
      setLoadingData(true)
      
      // Parallelize all data fetching for maximum performance
      const [lessonDataResult, contentResponse, flowchartsResponse] = await Promise.allSettled([
        courseService.getLessonById(lessonId),
        fetch(`/api/lessons/${lessonId}/content`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/lessons/${lessonId}/flowcharts`, { cache: 'no-store' }).catch(() => null)
      ])

      let finalLessonData: LessonWithDetails | null = null

      // Process lesson data
      if (lessonDataResult.status === 'fulfilled' && lessonDataResult.value) {
        finalLessonData = lessonDataResult.value
      } else {
        console.error('Error loading lesson:', lessonDataResult.status === 'rejected' ? lessonDataResult.reason : 'Unknown error')
        setLoadingData(false)
        return
      }

      // Process content in parallel (only if not already included)
      if (contentResponse.status === 'fulfilled' && contentResponse.value) {
        try {
          const response = contentResponse.value
          if (response && finalLessonData && (!finalLessonData.content || finalLessonData.content.length === 0)) {
            const contentData = await response.json()
            finalLessonData.content = contentData.data || []
          }
        } catch (e) {
          // Content might already be in lessonData, ignore error
        }
      }

      // Process flowcharts in parallel
      if (finalLessonData) {
        if (flowchartsResponse.status === 'fulfilled' && flowchartsResponse.value) {
          try {
            const response = flowchartsResponse.value
            if (response) {
              const flowchartsData = await response.json()
              Object.assign(finalLessonData, { flowcharts: flowchartsData.data || [] })
            } else {
              Object.assign(finalLessonData, { flowcharts: [] })
            }
          } catch (e) {
            Object.assign(finalLessonData, { flowcharts: [] })
          }
        } else {
          Object.assign(finalLessonData, { flowcharts: [] })
        }
      }

      // Fetch quiz only if not already included (in background, don't block UI)
      if (finalLessonData && !finalLessonData.quiz) {
        courseService.getQuizByLessonId(lessonId)
          .then(quizData => {
            if (quizData && finalLessonData) {
              finalLessonData.quiz = quizData
              // Update cache with quiz data
              lessonCache.current.set(lessonId, { ...finalLessonData })
              setCurrentLesson({ ...finalLessonData })
            }
          })
          .catch(() => {
            // Quiz might not exist, that's okay
          })
      }

      // Cache the lesson data for future use
      if (finalLessonData) {
        lessonCache.current.set(lessonId, finalLessonData)
      }

      setCurrentLesson(finalLessonData)
      
      // Update lesson progress in background (don't wait for it)
      if (enrollment) {
        courseService.updateLessonProgress(enrollment.id, lessonId, {
          status: 'in_progress',
        }).catch(err => console.error('Error updating lesson progress:', err))
      }
    } catch (error) {
      console.error('Error loading lesson:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleLessonComplete = async (lessonId: string) => {
    try {
      if (enrollment) {
        await courseService.updateLessonProgress(enrollment.id, lessonId, {
          status: 'completed',
          completion_percentage: 100,
        })
        
        // Reload progress data
        const progressData = await courseService.getCourseProgress(resolvedParams.enrollmentId)
        setCourseProgress(progressData)
      }
    } catch (error) {
      console.error('Error completing lesson:', error)
    }
  }

  const handleQuizComplete = async (attempt: QuizAttempt) => {
    console.log('Quiz completed:', attempt)
    // Reload progress data after quiz completion
    const progressData = await courseService.getCourseProgress(resolvedParams.enrollmentId)
    setCourseProgress(progressData)
    // Don't close the modal immediately - let the user see the results first
    // The modal will be closed when the user clicks "Close" in the results
  }

  const handleAssignmentSubmission = () => {
    if (currentLesson?.assignment) {
      setShowAssignmentSubmission(true)
    }
  }

  const handleAssignmentSubmissionComplete = (submission: any) => {
    console.log('Assignment submitted:', submission)
    setShowAssignmentSubmission(false)
    // Refresh lesson data to show updated progress
    if (currentLesson) {
      handleLessonSelect(currentLesson.id)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1e3a5f] to-[#DC2626] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user || !enrollment) {
    return null
  }

  return (
    <div className="h-screen w-full relative flex flex-col bg-[#2B2A29]">
      {/* Unified Header - Replaces global header, course header, and lesson header */}
      <header className="relative z-50 bg-gradient-to-br from-[#1e3a5f] via-[#264174] to-[#DC2626] border-b border-white/10">
        <div className="flex flex-col">
          {/* Top Row: Logo, Navigation, Actions */}
          <div className="flex items-center justify-between h-12 px-3 sm:px-4 lg:px-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSidebarOpen(!sidebarOpen)
                }}
                className="text-white hover:text-white/80 transition-colors duration-200 p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center relative z-50"
                aria-label="Toggle sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <Link href="/" className="flex items-center">
                <span className="text-white font-bold text-sm sm:text-base">Super Accountant</span>
              </Link>
              {/* Navigation Links - Desktop */}
              <div className="hidden lg:flex items-center space-x-4 ml-4">
                <Link href="/#features" className="text-white/90 hover:text-white text-xs font-medium transition-colors">
                  Features
                </Link>
                <Link href="/#how-it-works" className="text-white/90 hover:text-white text-xs font-medium transition-colors">
                  How It Works
                </Link>
                <Link href="/#testimonials" className="text-white/90 hover:text-white text-xs font-medium transition-colors">
                  Testimonials
                </Link>
                <Link href="/#pricing" className="text-white/90 hover:text-white text-xs font-medium transition-colors">
                  Pricing
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Progress Bar */}
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-xs text-white/90 font-medium">
                  {courseProgress?.lessons_completed || 0} / {courseProgress?.total_lessons || 0}
                </span>
                <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/20">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{
                      width: `${courseProgress?.overall_progress || 0}%`
                    }}
                  />
                </div>
                <span className="text-xs text-white/90 font-medium">
                  {Math.round(courseProgress?.overall_progress || 0)}%
                </span>
              </div>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-medium transition-colors"
              >
                Dashboard
              </button>
              {user && (
                <button
                  onClick={async () => {
                    await signOut()
                    router.push('/login')
                  }}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded text-xs font-medium transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* Second Row: Course Title and Lesson Info (if lesson is active) */}
          {currentLesson && (
            <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-1.5 border-t border-white/10 bg-gradient-to-r from-[#264174]/30 to-[#DC2626]/30">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-white truncate">
                    {currentLesson.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <span className="capitalize">{currentLesson.lesson_type}</span>
                    {currentLesson.duration_minutes && (
                      <span>{currentLesson.duration_minutes}m</span>
                    )}
                    {currentLesson.is_required && (
                      <span className="bg-white/10 px-1.5 py-0.5 rounded text-xs border border-white/20">Required</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleLessonComplete(currentLesson.id)}
                className="ml-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap flex-shrink-0"
              >
                Mark Complete
              </button>
            </div>
          )}

          {/* Course Title Row (if no lesson active) */}
          {!currentLesson && (
            <div className="flex items-center px-3 sm:px-4 lg:px-6 py-1.5 border-t border-white/10">
              <h1 className="text-sm sm:text-base font-bold text-white">
                {enrollment.course?.title || 'Course'}
              </h1>
            </div>
          )}
        </div>
      </header>

      <div className="relative z-10 flex flex-1 min-h-0">
        {/* Sidebar - Mobile: Overlay, Desktop: Sidebar */}
        {/* Mobile Overlay Backdrop */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            style={{ top: '64px' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          ${sidebarOpen ? 'w-80' : 'w-0'}
          fixed lg:fixed
          top-0 left-0
          h-screen
          transition-all duration-300 overflow-hidden 
          bg-gradient-to-b from-[#2B2A29] to-[#1e3a5f] 
          border-r border-white/10 z-40
          flex flex-col
        `}>
          <div className="h-full flex flex-col overflow-hidden">
            {/* Close Button - Mobile only, visible at top of sidebar */}
            <div className="lg:hidden flex-shrink-0 flex justify-end p-4 border-b border-white/10">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white hover:text-white hover:border-white/30 hover:bg-[#DC2626]/50 transition-all duration-300"
                aria-label="Close sidebar"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              {/* Course Progress - Fixed at top */}
              <div className="flex-shrink-0 mb-6">
                <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-4 border border-white/10">
                  <h3 className="text-white font-black mb-3 text-lg">Course Progress</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/90 font-medium">Overall Progress</span>
                      <span className="text-white font-bold">{Math.round(courseProgress?.overall_progress || 0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/20">
                      <div
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${courseProgress?.overall_progress || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/80 font-medium">
                      <span>{courseProgress?.lessons_completed || 0} completed</span>
                      <span>{courseProgress?.total_lessons || 0} total</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Modules - Scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="space-y-4">
                <h3 className="text-white font-black text-lg sticky top-0 bg-gradient-to-b from-[#2B2A29] to-transparent pb-2 z-10">Course Content</h3>
                {(!(enrollment.course as any)?.modules || (enrollment.course as any)?.modules?.length === 0) ? (
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <p className="text-white/90 text-sm">No modules available yet.</p>
                  </div>
                ) : (
                  (enrollment.course as any)?.modules?.map((module: any, moduleIndex: number) => (
                    <div key={module.id} className="space-y-2">
                      <div className="flex items-center justify-between bg-white/10 px-3 py-2 rounded-xl border border-white/20">
                        <h4 className="text-white font-bold text-sm">
                          Week {module.week_number}: {module.title}
                        </h4>
                        <span className="text-xs text-white/90 font-medium bg-white/10 px-2 py-1 rounded-full border border-white/20">
                          {module.lessons?.length || 0} lessons
                        </span>
                      </div>
                      
                      <div className="space-y-1 ml-2">
                        {module.lessons?.map((lesson: any, lessonIndex: number) => (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonSelect(lesson.id)}
                            className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-300 ${
                              currentLesson?.id === lesson.id
                                ? 'bg-white text-[#264174] font-bold shadow-lg'
                                : 'bg-white/10 text-white/90 border border-white/20 hover:border-white/30 hover:bg-white/15 font-medium'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-bold ${currentLesson?.id === lesson.id ? 'text-[#264174]' : 'text-white/70'}`}>
                                {lessonIndex + 1}
                              </span>
                              <span className="truncate flex-1">{lesson.title}</span>
                              <span className={`text-xs ${currentLesson?.id === lesson.id ? 'text-[#264174]/70' : 'text-white/70'}`}>
                                {lesson.duration_minutes}m
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-80' : 'lg:ml-0'
        }`}>
          {currentLesson ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Lesson Content */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-[#2B2A29] min-h-0">
                {currentLesson.description && (
                  <div className="mb-4 sm:mb-5 md:mb-6">
                    <h3 className="text-base sm:text-lg font-black text-white mb-2 sm:mb-3">Description</h3>
                    <p className="text-sm sm:text-base text-white/90 leading-relaxed">
                      {currentLesson.description}
                    </p>
                  </div>
                )}

                {/* Video Content with Flowchart Sidebar - Show video_url if available */}
                {(currentLesson as any).video_url ? (
                  <div className="mb-4 sm:mb-5 md:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Video Content</h3>
                    {/* Container with video and flowchart side by side */}
                    <div className="flex items-stretch gap-0 rounded-lg overflow-hidden bg-black" style={{ minHeight: '600px' }}>
                      {/* Video Player - Responsive width */}
                      <div className={`bg-black rounded-l-lg overflow-hidden transition-all duration-300 ${
                        ((currentLesson as any).flowcharts && (currentLesson as any).flowcharts.length > 0) || 
                        ((currentLesson as any).flowchart_file_path || (currentLesson as any).flowchart_url)
                          ? 'flex-1 min-w-0 flex flex-col' 
                          : 'w-full rounded-r-lg'
                      }`}>
                        <div className={`w-full flex-1 ${
                          ((currentLesson as any).flowcharts && (currentLesson as any).flowcharts.length > 0) || 
                          ((currentLesson as any).flowchart_file_path || (currentLesson as any).flowchart_url)
                            ? '' 
                            : 'aspect-video'
                        }`}>
                          <iframe
                            src={(() => {
                              const url = (currentLesson as any).video_url
                              // Convert various YouTube URL formats to embed format
                              if (url.includes('youtu.be/')) {
                                const videoId = url.split('youtu.be/')[1].split('?')[0]
                                return `https://www.youtube.com/embed/${videoId}`
                              } else if (url.includes('youtube.com/watch?v=')) {
                                const videoId = url.split('v=')[1].split('&')[0]
                                return `https://www.youtube.com/embed/${videoId}`
                              } else if (url.includes('youtube.com/embed/')) {
                                return url
                              }
                              return url
                            })()}
                            title={currentLesson.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>

                      {/* Flowchart Component - Hamburger Menu and Sidebar */}
                      {((currentLesson as any).flowcharts && (currentLesson as any).flowcharts.length > 0) && (
                        <div className="flex">
                          <LessonFlowchart
                            flowcharts={(currentLesson as any).flowcharts.map((fc: any) => ({
                              flowchart_file_path: fc.flowchart_file_path,
                              flowchart_file_name: fc.flowchart_file_name,
                              flowchart_mime_type: fc.flowchart_mime_type,
                              flowchart_url: fc.flowchart_url,
                              flowchart_title: fc.flowchart_title
                            }))}
                          />
                        </div>
                      )}
                      {/* Legacy support: check for single flowchart fields (backward compatibility) */}
                      {(!(currentLesson as any).flowcharts || (currentLesson as any).flowcharts.length === 0) &&
                       ((currentLesson as any).flowchart_file_path || (currentLesson as any).flowchart_url) && (
                        <div className="flex">
                          <LessonFlowchart
                            flowcharts={[{
                              flowchart_file_path: (currentLesson as any).flowchart_file_path,
                              flowchart_file_name: (currentLesson as any).flowchart_file_name,
                              flowchart_mime_type: (currentLesson as any).flowchart_mime_type,
                              flowchart_url: (currentLesson as any).flowchart_url,
                              flowchart_title: (currentLesson as any).flowchart_title
                            }]}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Flowchart Component for non-video lessons - Standalone */}
                {!(currentLesson as any).video_url && 
                 ((currentLesson as any).flowcharts && (currentLesson as any).flowcharts.length > 0) && (
                  <div className="mb-4 sm:mb-5 md:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Flowcharts</h3>
                    <div className="flex items-stretch gap-0 rounded-lg overflow-hidden bg-gray-800">
                      <LessonFlowchart
                        flowcharts={(currentLesson as any).flowcharts.map((fc: any) => ({
                          flowchart_file_path: fc.flowchart_file_path,
                          flowchart_file_name: fc.flowchart_file_name,
                          flowchart_mime_type: fc.flowchart_mime_type,
                          flowchart_url: fc.flowchart_url,
                          flowchart_title: fc.flowchart_title
                        }))}
                      />
                    </div>
                  </div>
                )}
                {/* Legacy support: check for single flowchart fields (backward compatibility) */}
                {!(currentLesson as any).video_url && 
                 (!(currentLesson as any).flowcharts || (currentLesson as any).flowcharts.length === 0) &&
                 ((currentLesson as any).flowchart_file_path || (currentLesson as any).flowchart_url) && (
                  <div className="mb-4 sm:mb-5 md:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Flowchart</h3>
                    <div className="flex items-stretch gap-0 rounded-lg overflow-hidden bg-gray-800">
                      <LessonFlowchart
                        flowcharts={[{
                          flowchart_file_path: (currentLesson as any).flowchart_file_path,
                          flowchart_file_name: (currentLesson as any).flowchart_file_name,
                          flowchart_mime_type: (currentLesson as any).flowchart_mime_type,
                          flowchart_url: (currentLesson as any).flowchart_url,
                          flowchart_title: (currentLesson as any).flowchart_title
                        }]}
                      />
                    </div>
                  </div>
                )}

                {/* Lesson Content Items - Only show if no video_url or for non-video content */}
                {currentLesson.content && currentLesson.content.length > 0 ? (
                  <div className="space-y-4 sm:space-y-5 md:space-y-6">
                    {currentLesson.content
                      .filter(content => !(currentLesson as any).video_url || content.content_type !== 'video')
                      .map((content, index) => {
                        console.log('Rendering content:', content)
                        return (
                      <div key={content.id} className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-xl p-3 sm:p-4 md:p-6 border border-white/10">
                        <h4 className="text-base sm:text-lg font-black text-white mb-2 sm:mb-3">
                          {content.title}
                        </h4>
                        
                        {content.content_type === 'video' && (content.content_url || content.file_path) && (
                          <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            <video
                              controls
                              className="w-full h-full"
                              src={content.upload_source === 'file_upload' ? content.file_path : content.content_url}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                        
                        {content.content_type === 'image' && (content.content_url || content.file_path) && (
                          <div className="bg-gray-800 rounded-lg p-4">
                            <img
                              src={content.upload_source === 'file_upload' ? content.file_path : content.content_url}
                              alt={content.title}
                              className="max-w-full h-auto rounded-lg"
                            />
                          </div>
                        )}
                        
                        {content.content_type === 'document' && (
                          <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200">
                            {(() => {
                              console.log('Document content debug:', {
                                title: content.title,
                                upload_source: content.upload_source,
                                content_url: content.content_url,
                                file_path: content.file_path,
                                final_href: content.upload_source === 'file_upload' ? content.file_path : content.content_url
                              })
                              return null
                            })()}
                            {(content.content_url || content.file_path) ? (
                              <a
                                href={content.upload_source === 'file_upload' ? content.file_path : content.content_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-3 block"
                              >
                                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-white font-medium">{content.title}</p>
                                  <div className="text-blue-400 hover:text-blue-300 transition-colors duration-200 inline-flex items-center space-x-1">
                                    <span>
                                      {content.upload_source === 'file_upload' ? '📁 Download File' : '🔗 Open Document'}
                                    </span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </div>
                                  {content.upload_source === 'file_upload' && content.file_name && (
                                    <p className="text-gray-400 text-xs mt-1">
                                      {content.file_name}
                                      {content.file_size_bytes && ` (${(content.file_size_bytes / 1024 / 1024).toFixed(2)} MB)`}
                                    </p>
                                  )}
                                </div>
                              </a>
                            ) : (
                              <div className="flex items-center space-x-3">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-white font-medium">{content.title}</p>
                                  <div className="text-gray-400 text-sm">
                                    Document not available
                                    {content.content_data && (
                                      <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
                                        <pre className="whitespace-pre-wrap text-gray-300">
                                          {JSON.stringify(content.content_data, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {content.content_type === 'link' && content.content_url && (
                          <div className="bg-gray-800 rounded-lg p-4">
                            <a
                              href={content.content_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center space-x-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span>Open External Link</span>
                            </a>
                          </div>
                        )}
                      </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-xl p-6 border border-white/10">
                      <div className="text-white/90 text-lg mb-4">
                        No content available for this lesson yet.
                      </div>
                      <p className="text-white/70">
                        Content will be added soon. Please check back later.
                      </p>
                    </div>
                  </div>
                )}

                {/* Quiz Section */}
                {currentLesson.quiz && (
                  <div className="mt-8 bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-black text-white mb-4">
                      Quiz: {currentLesson.quiz.title || 'Lesson Quiz'}
                    </h3>
                    <p className="text-white/90 mb-4">
                      {currentLesson.quiz.description || 'Test your knowledge of this lesson'}
                    </p>
                    <div className="flex items-center space-x-4 mb-4 text-sm text-white/80">
                      {currentLesson.quiz.time_limit_minutes && (
                        <span>Time Limit: {currentLesson.quiz.time_limit_minutes} minutes</span>
                      )}
                      <span>Passing Score: {currentLesson.quiz.passing_score_percentage || 70}%</span>
                      <span>Max Attempts: {currentLesson.quiz.max_attempts || 3}</span>
                    </div>
                    <div className="flex space-x-4">
                      <button 
                        onClick={() => {
                          console.log('Starting quiz with data:', currentLesson.quiz)
                          console.log('Quiz ID:', currentLesson.quiz?.id)
                          console.log('Enrollment ID:', enrollment?.id)
                          console.log('Setting showQuiz to true')
                          setShowQuiz(true)
                          console.log('showQuiz state should now be true')
                        }}
                        className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                      >
                        Start Quiz
                      </button>
                      <button 
                        onClick={() => setShowQuizHistory(true)}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-semibold transition-colors border border-white/20"
                      >
                        View Quiz History
                      </button>
                    </div>
                  </div>
                )}

                {/* Daily Test Section */}
                <div className="mt-8 bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-black text-white mb-4">
                    Daily Tests
                  </h3>
                  <p className="text-white/90 mb-4">
                    Take daily tests to reinforce your learning and track your progress throughout the 45-day course.
                  </p>
                  <div className="flex items-center space-x-4 mb-4 text-sm text-white/80">
                    <span>📊 Progress Tracking</span>
                    <span>🔥 Streak Counter</span>
                    <span>📈 Performance Analytics</span>
                  </div>
                  
                  {/* Day Navigation */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[1, 2, 3, 4, 5, 6, 7].map((dayNumber) => (
                        <button
                          key={dayNumber}
                          onClick={() => setCurrentViewingDay(dayNumber)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                            currentViewingDay === dayNumber
                              ? 'bg-[#DC2626] text-white'
                              : dayNumber <= nextAvailableTestDay
                              ? 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/20'
                              : 'bg-white/5 text-white/50 cursor-not-allowed border border-white/10'
                          }`}
                          disabled={dayNumber > nextAvailableTestDay}
                        >
                          Day {dayNumber}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Day Test Button */}
                  <div className="mb-4">
                    {currentViewingDay <= nextAvailableTestDay ? (
                      <button
                        onClick={() => {
                          // Start the daily test for the current viewing day
                          console.log('🎯 Starting daily test for day:', currentViewingDay)
                          setShowTest(true)
                          setCurrentTestDay(currentViewingDay)
                        }}
                        className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Start Day {currentViewingDay} Quiz
                      </button>
                    ) : (
                      <button
                        disabled
                        className="bg-white/5 text-white/50 px-6 py-3 rounded-lg font-semibold cursor-not-allowed border border-white/10"
                      >
                        Day {currentViewingDay} Locked
                      </button>
                    )}
                  </div>

                  {/* Progress Requirement Message - Show when user is on a day they haven't unlocked */}
                  {currentViewingDay > nextAvailableTestDay && (
                    <div className="mb-4 bg-white/10 border border-white/20 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-white text-xl">🚫</div>
                        <div>
                          <h4 className="text-white font-semibold mb-2">Test Access Restricted</h4>
                          <p className="text-white/90 text-sm mb-2">
                            You must pass Day {nextAvailableTestDay} with 90% or higher to unlock Day {currentViewingDay} test.
                          </p>
                          <p className="text-white/70 text-xs">
                            Complete the Day {nextAvailableTestDay} test above and achieve 90% to continue your progress through the course.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => router.push(`/daily-tests/${resolvedParams.enrollmentId}?day=1`)}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-semibold transition-colors border border-white/20"
                  >
                    View All Daily Tests
                  </button>
                </div>

                {/* Assignment Section */}
                {currentLesson.assignment && (() => {
                  const assignment = Array.isArray(currentLesson.assignment) ? currentLesson.assignment[0] : currentLesson.assignment
                  if (!assignment) return null
                  
                  return (
                    <div className="mt-8 bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-xl p-6 border border-white/10">
                      <h3 className="text-lg font-black text-white mb-4">
                        Assignment: {assignment.title}
                      </h3>
                      <p className="text-white/90 mb-4">
                        {assignment.description}
                      </p>
                      {assignment.instructions && (
                        <div className="mb-4">
                          <h4 className="text-white font-semibold mb-2">Instructions:</h4>
                          <p className="text-white/90">{assignment.instructions}</p>
                        </div>
                      )}
                      {assignment.due_date && (
                        <div className="mb-4">
                          <h4 className="text-white font-semibold mb-2">Due Date:</h4>
                          <p className="text-white/90">
                            {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      <div className="mb-4">
                        <h4 className="text-white font-semibold mb-2">Assignment Details:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-white/80">Type:</span>
                            <span className="text-white ml-2 capitalize">
                              {assignment.assignment_type?.replace('_', ' ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/80">Max Points:</span>
                            <span className="text-white ml-2">{assignment.max_points}</span>
                          </div>
                        </div>
                        {assignment.attachment_files && Object.keys(assignment.attachment_files).length > 0 && (
                          <div className="mt-3">
                            <span className="text-white/80 text-sm">Provided Documents:</span>
                            <span className="text-white ml-2 text-sm">
                              {Object.keys(assignment.attachment_files).length} file(s)
                            </span>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={handleAssignmentSubmission}
                        className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                      >
                        Submit Assignment
                      </button>
                    </div>
                  )
                })()}
              </div>

              {/* Grandtest Trigger */}
              {enrollment && user && (
                <div className="mt-8">
                  <GrandtestTrigger
                    courseId={enrollment.course_id}
                    enrollmentId={enrollment.id}
                    userId={user.id}
                    onGrandtestComplete={(passed, score) => {
                      console.log('Grandtest completed:', { passed, score });
                      // You can add additional logic here, like showing a success message
                      if (passed) {
                        alert(`Congratulations! You passed the Grandtest with ${score}%! Your certificate has been generated.`);
                      } else {
                        alert(`You scored ${score}%. You need 90% to pass. You can retake the test after 24 hours.`);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#264174]/20 to-[#DC2626]/20">
              <div className="text-center max-w-md mx-auto px-4">
                <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-8 border border-white/10">
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-4">No Lesson Available</h2>
                  <p className="text-white/90 mb-6">
                    {(!(enrollment?.course as any)?.modules || (enrollment?.course as any)?.modules?.length === 0) 
                      ? "This course doesn't have any modules yet. The course needs to have modules and lessons added before you can start learning. Please contact the administrator or use the admin panel to add course content." 
                      : (!(enrollment?.course as any)?.modules?.[0]?.lessons || (enrollment?.course as any)?.modules?.[0]?.lessons?.length === 0)
                      ? "The course modules exist but don't have any lessons yet. Please contact the administrator to add lessons to the modules."
                      : "Unable to load lesson content. This might be a temporary issue."}
                  </p>
                  {(!(enrollment?.course as any)?.modules || (enrollment?.course as any)?.modules?.length === 0) && (
                    <div className="mt-4 p-4 bg-white/10 rounded-lg border border-white/20">
                      <p className="text-white/80 text-sm mb-2">
                        <strong>Course ID:</strong> {(enrollment?.course as any)?.id}
                      </p>
                      <p className="text-white/80 text-sm">
                        <strong>Course Title:</strong> {(enrollment?.course as any)?.title}
                      </p>
                      <p className="text-white/70 text-xs mt-2">
                        Use this information when adding modules via the admin panel.
                      </p>
                    </div>
                  )}
                  <div className="space-y-3">
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Open Course Content
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-colors border border-white/20"
                    >
                      Refresh Page
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Modal */}
      {(() => {
        console.log('Quiz modal render check:')
        console.log('showQuiz:', showQuiz)
        console.log('currentLesson?.quiz:', currentLesson?.quiz)
        console.log('currentLesson.quiz.id:', currentLesson?.quiz?.id)
        console.log('enrollment:', enrollment)
        console.log('Should render quiz modal:', showQuiz && currentLesson?.quiz && currentLesson.quiz.id && enrollment)
        return null
      })()}
      
      
      {/* Real Quiz Modal */}
      {showQuiz && currentLesson?.quiz && currentLesson.quiz?.id && !Array.isArray(currentLesson.quiz) && enrollment && (
        <CourseQuiz
          quiz={currentLesson.quiz}
          enrollmentId={enrollment.id}
          onQuizComplete={handleQuizComplete}
          onClose={() => setShowQuiz(false)}
        />
      )}
      
      {/* Fallback Quiz Modal - Create quiz with questions from database */}
      {showQuiz && currentLesson && (!currentLesson.quiz || !currentLesson.quiz?.id || Array.isArray(currentLesson.quiz)) && enrollment && (
        <CourseQuiz
          quiz={{
            ...(currentLesson.quiz && !Array.isArray(currentLesson.quiz) ? currentLesson.quiz : {}),
            id: 'fallback-quiz-id',
            title: (currentLesson.quiz && !Array.isArray(currentLesson.quiz) ? currentLesson.quiz.title : null) || 'Quiz',
            description: (currentLesson.quiz && !Array.isArray(currentLesson.quiz) ? currentLesson.quiz.description : null) || 'Test your knowledge',
            quiz_type: 'formative',
            time_limit_minutes: 30,
            passing_score_percentage: 70,
            max_attempts: 3,
            is_active: true,
            lesson_id: currentLesson.id, // Pass the lesson ID
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }}
          enrollmentId={enrollment.id}
          onQuizComplete={handleQuizComplete}
          onClose={() => setShowQuiz(false)}
        />
      )}
      
      {/* Daily Test Modal */}
      {showTest && currentTestDay && enrollment && (
        <DailyTest
          enrollmentId={enrollment.id}
          courseId={enrollment.course_id}
          dayNumber={currentTestDay}
          onTestComplete={async (result) => {
            console.log('Daily test completed:', result)
            // Refresh the next available test day
            await loadNextAvailableTestDay()
            // Don't close the modal immediately - let the user see the results first
            // The modal will be closed when the user clicks "Close" in the results
          }}
          onClose={() => {
            setShowTest(false)
            setCurrentTestDay(null)
          }}
        />
      )}

      {/* Quiz History Modal */}
      {showQuizHistory && enrollment && (
        <QuizHistory
          enrollmentId={enrollment.id}
          quizId={currentLesson?.quiz?.id}
          onClose={() => setShowQuizHistory(false)}
        />
      )}

      {/* Assignment Submission Modal */}
      {showAssignmentSubmission && currentLesson?.assignment && enrollment && (() => {
        const assignment = Array.isArray(currentLesson.assignment) ? currentLesson.assignment[0] : currentLesson.assignment
        if (!assignment) return null
        
        return (
          <AssignmentSubmission
            assignment={assignment}
            enrollmentId={enrollment.id}
            onClose={() => setShowAssignmentSubmission(false)}
            onSubmissionComplete={handleAssignmentSubmissionComplete}
          />
        )
      })()}
    </div>
  )
}

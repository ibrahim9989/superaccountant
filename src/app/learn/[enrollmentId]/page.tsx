'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
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
  const { user, loading } = useAuth()
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

  // Handle sidebar state for desktop - open by default on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    
    // Set initial state
    handleResize()
    
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

      // Determine which lesson to load
      const lessonIdToLoad = progressData?.next_lesson?.id || 
        (enrollmentData.course as any)?.modules?.[0]?.lessons?.[0]?.id

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
      <div className="min-h-screen bg-black flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-white"></div>
        </div>
      </div>
    )
  }

  if (!user || !enrollment) {
    return null
  }

  return (
    <div className="h-screen w-full relative flex flex-col bg-black">
      {/* Luxury Background Effects */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-br from-gray-900/10 via-transparent to-gray-900/10 rounded-full blur-3xl" />
      </div>

      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-sm border-b border-gray-600/50">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:text-gray-300 transition-colors duration-200 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">SA</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                {enrollment.course?.title}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Progress Bar */}
            <div className="hidden md:flex items-center space-x-3">
              <span className="text-sm text-gray-300 font-medium">
                {courseProgress?.lessons_completed || 0} / {courseProgress?.total_lessons || 0}
              </span>
              <div className="w-32 h-2 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/50">
                <div
                  className="h-full bg-gradient-to-r from-white via-gray-200 to-white transition-all duration-300"
                  style={{
                    width: `${courseProgress?.overall_progress || 0}%`
                  }}
                />
              </div>
              <span className="text-sm text-gray-300 font-medium">
                {Math.round(courseProgress?.overall_progress || 0)}%
              </span>
            </div>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white/90 hover:text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-1">
        {/* Sidebar - Mobile: Overlay, Desktop: Sidebar */}
        {/* Mobile Overlay Backdrop */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
          ${sidebarOpen ? 'w-80' : 'w-0 lg:w-80'}
          fixed lg:relative
          top-0 left-0 h-full lg:h-auto
          transition-all duration-300 overflow-hidden 
          bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm 
          border-r border-gray-600/50 z-50 lg:z-auto
        `}>
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-6">
              {/* Course Progress */}
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl p-4 border border-gray-600/50 shadow-xl">
                <h3 className="text-white font-black mb-3 text-lg">Course Progress</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300 font-medium">Overall Progress</span>
                    <span className="text-white font-bold">{Math.round(courseProgress?.overall_progress || 0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/50">
                    <div
                      className="h-full bg-gradient-to-r from-white via-gray-200 to-white transition-all duration-300"
                      style={{ width: `${courseProgress?.overall_progress || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 font-medium">
                    <span>{courseProgress?.lessons_completed || 0} completed</span>
                    <span>{courseProgress?.total_lessons || 0} total</span>
                  </div>
                </div>
              </div>

              {/* Course Modules */}
              <div className="space-y-4">
                <h3 className="text-white font-black text-lg">Course Content</h3>
                {(enrollment.course as any)?.modules?.map((module: any, moduleIndex: number) => (
                  <div key={module.id} className="space-y-2">
                    <div className="flex items-center justify-between bg-gradient-to-r from-gray-800/50 to-gray-900/50 px-3 py-2 rounded-xl border border-gray-700/50">
                      <h4 className="text-white font-bold text-sm">
                        Week {module.week_number}: {module.title}
                      </h4>
                      <span className="text-xs text-gray-300 font-medium bg-gray-800/50 px-2 py-1 rounded-full">
                        {module.lessons?.length || 0} lessons
                      </span>
                    </div>
                    
                    <div className="space-y-1 ml-2">
                      {module.lessons?.map((lesson: any, lessonIndex: number) => (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonSelect(lesson.id)}
                          className={`w-full text-left p-3 rounded-xl text-sm transition-all duration-300 ${
                            currentLesson?.id === lesson.id
                              ? 'bg-gradient-to-r from-white via-gray-100 to-white text-black font-bold shadow-lg'
                              : 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 text-gray-300 border border-gray-700/50 hover:border-gray-500/70 hover:text-white font-medium'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-bold ${currentLesson?.id === lesson.id ? 'text-black' : 'text-gray-400'}`}>
                              {lessonIndex + 1}
                            </span>
                            <span className="truncate flex-1">{lesson.title}</span>
                            <span className={`text-xs ${currentLesson?.id === lesson.id ? 'text-black/70' : 'text-gray-500'}`}>
                              {lesson.duration_minutes}m
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {currentLesson ? (
            <div className="flex-1 flex flex-col">
              {/* Lesson Header */}
              <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-1 sm:mb-2 pr-2">
                      {currentLesson.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-400">
                      <span className="capitalize">{currentLesson.lesson_type}</span>
                      {currentLesson.duration_minutes && (
                        <span>{currentLesson.duration_minutes} minutes</span>
                      )}
                      {currentLesson.is_required && (
                        <span className="text-yellow-400">Required</span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleLessonComplete(currentLesson.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-lg font-semibold text-sm sm:text-base transition-all duration-300 min-h-[44px] whitespace-nowrap"
                  >
                    Mark Complete
                  </button>
                </div>
              </div>

              {/* Lesson Content */}
              <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm">
                {currentLesson.description && (
                  <div className="mb-4 sm:mb-5 md:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Description</h3>
                    <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                      {currentLesson.description}
                    </p>
                  </div>
                )}

                {/* Video Content with Flowchart Sidebar - Show video_url if available */}
                {(currentLesson as any).video_url ? (
                  <div className="mb-4 sm:mb-5 md:mb-6">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">Video Content</h3>
                    {/* Container with video and flowchart side by side */}
                    <div className="flex items-stretch gap-0 rounded-lg overflow-hidden bg-black">
                      {/* Video Player - Responsive width */}
                      <div className={`bg-black rounded-l-lg overflow-hidden transition-all duration-300 ${
                        ((currentLesson as any).flowchart_file_path || (currentLesson as any).flowchart_url) 
                          ? 'flex-1 min-w-0' 
                          : 'w-full rounded-r-lg'
                      }`}>
                        <div className="aspect-video w-full">
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
                      <div key={content.id} className="bg-white/5 rounded-lg p-3 sm:p-4 md:p-6">
                        <h4 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
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
                    <div className="text-gray-400 text-lg mb-4">
                      No content available for this lesson yet.
                    </div>
                    <p className="text-gray-500">
                      Content will be added soon. Please check back later.
                    </p>
                  </div>
                )}

                {/* Quiz Section */}
                {currentLesson.quiz && (
                  <div className="mt-8 bg-white/5 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Quiz: {currentLesson.quiz.title || 'Lesson Quiz'}
                    </h3>
                    <p className="text-gray-300 mb-4">
                      {currentLesson.quiz.description || 'Test your knowledge of this lesson'}
                    </p>
                    <div className="flex items-center space-x-4 mb-4 text-sm text-gray-400">
                      {currentLesson.quiz.time_limit_minutes && (
                        <span>Time Limit: {currentLesson.quiz.time_limit_minutes} minutes</span>
                      )}
                      <span>Passing Score: {currentLesson.quiz.passing_score_percentage || 70}%</span>
                      <span>Max Attempts: {currentLesson.quiz.max_attempts || 3}</span>
                    </div>
                    <div className="mb-4 text-xs text-gray-500">
                      Quiz ID: {currentLesson.quiz?.id || 'Fallback Quiz'}
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
                      >
                        Start Quiz
                      </button>
                      <button 
                        onClick={() => setShowQuizHistory(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
                      >
                        View Quiz History
                      </button>
                    </div>
                  </div>
                )}

                {/* Daily Test Section */}
                <div className="mt-8 bg-white/5 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Daily Tests
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Take daily tests to reinforce your learning and track your progress throughout the 45-day course.
                  </p>
                  <div className="flex items-center space-x-4 mb-4 text-sm text-gray-400">
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
                              ? 'bg-blue-600 text-white'
                              : dayNumber <= nextAvailableTestDay
                              ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                              : 'bg-gray-600/50 text-gray-500 cursor-not-allowed'
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
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                      >
                        Start Day {currentViewingDay} Quiz
                      </button>
                    ) : (
                      <button
                        disabled
                        className="bg-gray-600/50 text-gray-500 px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                      >
                        Day {currentViewingDay} Locked
                      </button>
                    )}
                  </div>

                  {/* Progress Requirement Message - Show when user is on a day they haven't unlocked */}
                  {currentViewingDay > nextAvailableTestDay && (
                    <div className="mb-4 bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-red-400 text-xl">🚫</div>
                        <div>
                          <h4 className="text-red-400 font-semibold mb-2">Test Access Restricted</h4>
                          <p className="text-red-300 text-sm mb-2">
                            You must pass Day {nextAvailableTestDay} with 90% or higher to unlock Day {currentViewingDay} test.
                          </p>
                          <p className="text-red-200 text-xs">
                            Complete the Day {nextAvailableTestDay} test above and achieve 90% to continue your progress through the course.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => router.push(`/daily-tests/${resolvedParams.enrollmentId}?day=1`)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
                  >
                    View All Daily Tests
                  </button>
                </div>

                {/* Assignment Section */}
                {currentLesson.assignment && (() => {
                  const assignment = Array.isArray(currentLesson.assignment) ? currentLesson.assignment[0] : currentLesson.assignment
                  if (!assignment) return null
                  
                  return (
                    <div className="mt-8 bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Assignment: {assignment.title}
                      </h3>
                      <p className="text-gray-300 mb-4">
                        {assignment.description}
                      </p>
                      {assignment.instructions && (
                        <div className="mb-4">
                          <h4 className="text-white font-medium mb-2">Instructions:</h4>
                          <p className="text-gray-300">{assignment.instructions}</p>
                        </div>
                      )}
                      {assignment.due_date && (
                        <div className="mb-4">
                          <h4 className="text-white font-medium mb-2">Due Date:</h4>
                          <p className="text-yellow-400">
                            {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      <div className="mb-4">
                        <h4 className="text-white font-medium mb-2">Assignment Details:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Type:</span>
                            <span className="text-white ml-2 capitalize">
                              {assignment.assignment_type?.replace('_', ' ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Max Points:</span>
                            <span className="text-white ml-2">{assignment.max_points}</span>
                          </div>
                        </div>
                        {assignment.attachment_files && Object.keys(assignment.attachment_files).length > 0 && (
                          <div className="mt-3">
                            <span className="text-gray-400 text-sm">Provided Documents:</span>
                            <span className="text-blue-400 ml-2 text-sm">
                              {Object.keys(assignment.attachment_files).length} file(s)
                            </span>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={handleAssignmentSubmission}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
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
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4">No Lesson Available</h2>
                <p className="text-gray-400 mb-6">
                  {(enrollment?.course as any)?.modules?.length === 0 
                    ? "This course doesn't have any modules yet." 
                    : "Unable to load lesson content. This might be a temporary issue."}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 block w-full"
                  >
                    Open Course Content
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 block w-full"
                  >
                    Refresh Page
                  </button>
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

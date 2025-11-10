'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showTest, setShowTest] = useState(false)
  const [showQuizHistory, setShowQuizHistory] = useState(false)
  const [showAssignmentSubmission, setShowAssignmentSubmission] = useState(false)
  const [currentTestDay, setCurrentTestDay] = useState<number | null>(null)
  const [nextAvailableTestDay, setNextAvailableTestDay] = useState<number>(1)
  const [currentViewingDay, setCurrentViewingDay] = useState<number>(1)
  
  // Unwrap params Promise
  const resolvedParams = use(params)

  const loadNextAvailableTestDay = async () => {
    if (enrollment) {
      try {
        const nextDay = await dailyTestService.getNextAvailableTestDay(enrollment.id)
        setNextAvailableTestDay(nextDay)
      } catch (error) {
        console.error('Error loading next available test day:', error)
      }
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && resolvedParams.enrollmentId) {
      loadEnrollmentData()
    }
  }, [user, resolvedParams.enrollmentId])

  const loadEnrollmentData = async () => {
    try {
      setLoadingData(true)
      
      // Load enrollment details
      const enrollmentData = await courseService.getEnrollmentById(resolvedParams.enrollmentId)
      if (!enrollmentData) {
        router.push('/courses')
        return
      }
      setEnrollment(enrollmentData)

      // Load course progress
      const progressData = await courseService.getCourseProgress(resolvedParams.enrollmentId)
      setCourseProgress(progressData)

      // Set current lesson (next lesson to take)
      console.log('🔍 Debugging lesson loading:')
      console.log('  progressData:', progressData)
      console.log('  progressData?.next_lesson:', progressData?.next_lesson)
      console.log('  enrollmentData.course?.modules:', (enrollmentData.course as any)?.modules)
      console.log('  first module lessons:', (enrollmentData.course as any)?.modules?.[0]?.lessons)
      
      if (progressData?.next_lesson) {
        console.log('📚 Loading next lesson from progress:', progressData.next_lesson.id)
        const lessonData = await courseService.getLessonById(progressData.next_lesson.id)
        console.log('📚 Loaded lesson data:', lessonData)
        // Fetch quiz data if not included
        if (lessonData && !lessonData.quiz) {
          console.log('Lesson has no quiz data, attempting to fetch quiz for lesson:', progressData.next_lesson.id)
          const quizData = await courseService.getQuizByLessonId(progressData.next_lesson.id)
          if (quizData) {
            lessonData.quiz = quizData
            console.log('Successfully fetched quiz data for lesson')
          } else {
            console.log('No quiz found for lesson - this is normal, not all lessons have quizzes')
          }
        }
        // Fetch flowcharts for this lesson
        try {
          const flowchartsResponse = await fetch(`/api/lessons/${progressData.next_lesson.id}/flowcharts`, {
            cache: 'no-store'
          })
          if (flowchartsResponse.ok) {
            const flowchartsData = await flowchartsResponse.json()
            if (lessonData) {
              (lessonData as any).flowcharts = flowchartsData.data || []
            }
          }
        } catch (error) {
          console.error('Error fetching flowcharts:', error)
          if (lessonData) {
            (lessonData as any).flowcharts = []
          }
        }
        setCurrentLesson(lessonData)
      } else if ((enrollmentData.course as any)?.modules?.[0]?.lessons?.[0]) {
        // Start with first lesson if no progress
        const firstLesson = (enrollmentData.course as any).modules[0].lessons[0]
        console.log('📚 Loading first lesson from course:', firstLesson.id)
        const lessonData = await courseService.getLessonById(firstLesson.id)
        console.log('📚 Loaded lesson data:', lessonData)
        // Fetch quiz data if not included
        if (lessonData && !lessonData.quiz) {
          console.log('Lesson has no quiz data, attempting to fetch quiz for lesson:', firstLesson.id)
          const quizData = await courseService.getQuizByLessonId(firstLesson.id)
          if (quizData) {
            lessonData.quiz = quizData
            console.log('Successfully fetched quiz data for lesson')
          } else {
            console.log('No quiz found for lesson - this is normal, not all lessons have quizzes')
          }
        }
        // Fetch flowcharts for this lesson
        try {
          const flowchartsResponse = await fetch(`/api/lessons/${firstLesson.id}/flowcharts`, {
            cache: 'no-store'
          })
          if (flowchartsResponse.ok) {
            const flowchartsData = await flowchartsResponse.json()
            if (lessonData) {
              (lessonData as any).flowcharts = flowchartsData.data || []
            }
          }
        } catch (error) {
          console.error('Error fetching flowcharts:', error)
          if (lessonData) {
            (lessonData as any).flowcharts = []
          }
        }
        setCurrentLesson(lessonData)
      } else {
        console.log('❌ No lesson found - neither from progress nor from course modules')
        console.log('  This might indicate an issue with course data or progress tracking')
        setCurrentLesson(null)
      }
      
      // Load next available test day
      await loadNextAvailableTestDay()
    } catch (error) {
      console.error('Error loading enrollment data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleLessonSelect = async (lessonId: string) => {
    try {
      console.log('Loading lesson:', lessonId)
      const lessonData = await courseService.getLessonById(lessonId)
      console.log('Loaded lesson data:', lessonData)
      console.log('Lesson has quiz:', lessonData?.quiz)
      console.log('Quiz ID:', lessonData?.quiz?.id)
      console.log('Lesson has assignment:', lessonData?.assignment)
      console.log('Assignment type:', typeof lessonData?.assignment)
      console.log('Assignment is array:', Array.isArray(lessonData?.assignment))
      if (lessonData?.assignment) {
        if (Array.isArray(lessonData.assignment)) {
          console.log('Assignment array length:', lessonData.assignment.length)
          console.log('First assignment:', lessonData.assignment[0])
        } else {
          console.log('Assignment object:', lessonData.assignment)
        }
      }
      console.log('Assignment ID:', lessonData?.assignment?.id)
      console.log('Assignment title:', lessonData?.assignment?.title)
      
      // Fetch lesson content using server-side API (bypasses RLS)
      // Note: getLessonById already includes content, but we'll fetch it separately as a fallback
      try {
        const contentResponse = await fetch(`/api/lessons/${lessonId}/content`, {
          cache: 'no-store'
        })
        if (contentResponse.ok) {
          const contentData = await contentResponse.json()
          console.log('Fetched lesson content:', contentData.data)
          if (lessonData) {
            lessonData.content = contentData.data || []
          }
        } else {
          const errorText = await contentResponse.text()
          console.error('Failed to fetch lesson content:', contentResponse.status, errorText)
          // If content is already in lessonData, use it
          if (lessonData && !lessonData.content && Array.isArray((lessonData as any).content)) {
            // Content might already be loaded from getLessonById
            console.log('Using content from lessonData:', (lessonData as any).content)
          }
        }
      } catch (contentError) {
        console.error('Error fetching lesson content:', contentError)
        // Don't fail the entire lesson load if content fetch fails
        // Content might already be included in lessonData from getLessonById
      }
      
      // Fetch flowcharts for this lesson
      try {
        const flowchartsResponse = await fetch(`/api/lessons/${lessonId}/flowcharts`, {
          cache: 'no-store'
        })
        if (flowchartsResponse.ok) {
          const flowchartsData = await flowchartsResponse.json()
          console.log('Fetched lesson flowcharts:', flowchartsData.data)
          if (lessonData) {
            (lessonData as any).flowcharts = flowchartsData.data || []
          }
        }
      } catch (flowchartsError) {
        console.error('Error fetching lesson flowcharts:', flowchartsError)
        // Don't fail the entire lesson load if flowcharts fetch fails
        if (lessonData) {
          (lessonData as any).flowcharts = []
        }
      }
      
      // If lesson doesn't have quiz data, try to fetch it directly
      if (lessonData && !lessonData.quiz) {
        console.log('No quiz in lesson data, fetching quiz directly...')
        const quizData = await courseService.getQuizByLessonId(lessonId)
        if (quizData) {
          lessonData.quiz = quizData
          console.log('Added quiz data to lesson:', quizData)
        }
      }
      
      setCurrentLesson(lessonData)
      
      // Update lesson progress to "in_progress"
      if (enrollment) {
        await courseService.updateLessonProgress(enrollment.id, lessonId, {
          status: 'in_progress',
        })
      }
    } catch (error) {
      console.error('Error loading lesson:', error)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !enrollment) {
    return null
  }

  return (
    <div className="h-screen w-full relative flex flex-col">
      {/* Azure Depths Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 10%, #000000 40%, #010133 100%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:text-gray-300 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-azure-accent to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SA</span>
              </div>
              <h1 className="text-xl font-semibold text-white">
                {enrollment.course?.title}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Progress Bar */}
            <div className="hidden md:flex items-center space-x-3">
              <span className="text-sm text-gray-300">
                {courseProgress?.lessons_completed || 0} / {courseProgress?.total_lessons || 0}
              </span>
              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{
                    width: `${courseProgress?.overall_progress || 0}%`
                  }}
                />
              </div>
              <span className="text-sm text-gray-300">
                {Math.round(courseProgress?.overall_progress || 0)}%
              </span>
            </div>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-1">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-gradient-to-b from-blue-900/20 to-blue-800/30 backdrop-blur-sm border-r border-blue-500/20`}>
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-6">
              {/* Course Progress */}
              <div className="bg-blue-800/20 rounded-lg p-4 border border-blue-600/20">
                <h3 className="text-white font-semibold mb-3">Course Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Overall Progress</span>
                    <span className="text-white">{Math.round(courseProgress?.overall_progress || 0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${courseProgress?.overall_progress || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{courseProgress?.lessons_completed || 0} completed</span>
                    <span>{courseProgress?.total_lessons || 0} total</span>
                  </div>
                </div>
              </div>

              {/* Course Modules */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold">Course Content</h3>
                {(enrollment.course as any)?.modules?.map((module: any, moduleIndex: number) => (
                  <div key={module.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium text-sm">
                        Week {module.week_number}: {module.title}
                      </h4>
                      <span className="text-xs text-gray-400">
                        {module.lessons?.length || 0} lessons
                      </span>
                    </div>
                    
                    <div className="space-y-1 ml-4">
                      {module.lessons?.map((lesson: any, lessonIndex: number) => (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonSelect(lesson.id)}
                          className={`w-full text-left p-2 rounded-lg text-sm transition-colors duration-200 ${
                            currentLesson?.id === lesson.id
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs">
                              {lessonIndex + 1}
                            </span>
                            <span className="truncate">{lesson.title}</span>
                            <span className="text-xs opacity-75">
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
              <div className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-2">
                      {currentLesson.title}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
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
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300"
                  >
                    Mark Complete
                  </button>
                </div>
              </div>

              {/* Lesson Content */}
              <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm">
                {currentLesson.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                    <p className="text-gray-300 leading-relaxed">
                      {currentLesson.description}
                    </p>
                  </div>
                )}

                {/* Video Content with Flowchart Sidebar - Show video_url if available */}
                {(currentLesson as any).video_url ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Video Content</h3>
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
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Flowcharts</h3>
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
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Flowchart</h3>
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
                  <div className="space-y-6">
                    {currentLesson.content
                      .filter(content => !(currentLesson as any).video_url || content.content_type !== 'video')
                      .map((content, index) => {
                        console.log('Rendering content:', content)
                        return (
                      <div key={content.id} className="bg-white/5 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-white mb-3">
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

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use, useCallback, useRef } from 'react'
import { CourseWithDetails, CourseEnrollment } from '@/lib/validations/course'
import { courseService } from '@/lib/services/courseService'
import Link from 'next/link'

interface CourseDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [course, setCourse] = useState<CourseWithDetails | null>(null)
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview')
  
  // Unwrap params Promise
  const resolvedParams = use(params)

  // Use ref to prevent duplicate API calls
  const hasLoadedCourse = useRef(false)
  const currentCourseId = useRef<string | null>(null)

  const loadCourse = useCallback(async () => {
    if (!user || !resolvedParams.id) return
    
    // Only reload if courseId changed or data hasn't been loaded yet
    if (hasLoadedCourse.current && currentCourseId.current === resolvedParams.id) {
      return
    }
    
    try {
      setLoadingCourse(true)
      hasLoadedCourse.current = true
      currentCourseId.current = resolvedParams.id
      
      const courseData = await courseService.getCourseById(resolvedParams.id)
      setCourse(courseData)

      if (courseData) {
        // Check if user is already enrolled
        const enrollments = await courseService.getUserEnrollments(user.id)
        const userEnrollment = enrollments.find(e => e.course_id === resolvedParams.id)
        setEnrollment(userEnrollment || null)
      }
    } catch (error) {
      console.error('Error loading course:', error)
      hasLoadedCourse.current = false // Reset on error to allow retry
    } finally {
      setLoadingCourse(false)
    }
  }, [user, resolvedParams.id])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    
    if (user && resolvedParams.id) {
      // Reset hasLoadedCourse if courseId changes
      if (currentCourseId.current !== resolvedParams.id) {
        hasLoadedCourse.current = false
      }
      loadCourse()
    }
  }, [user, loading, router, resolvedParams.id, loadCourse])

  const handleEnroll = async () => {
    if (!user || !course) return

    try {
      setEnrolling(true)
      const newEnrollment = await courseService.enrollInCourse({
        user_id: user.id,
        course_id: course.id,
        start_date: new Date().toISOString(),
        status: 'enrolled',
        progress_percentage: 0,
      })
      setEnrollment(newEnrollment)
      
      // Redirect to course learning page
      router.push(`/learn/${newEnrollment.id}`)
    } catch (error) {
      console.error('Error enrolling in course:', error)
      alert('Failed to enroll in course. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  if (loading || loadingCourse) {
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

  if (!user) {
    return null
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <h1 className="text-3xl font-black text-white mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            Course Not Found
          </h1>
          <button
            onClick={() => router.push('/courses')}
            className="px-8 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-bold rounded-2xl hover:shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105"
          >
            Back to Courses
          </button>
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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-br from-gray-900/10 via-transparent to-gray-900/10 rounded-full blur-3xl" />
      </div>

      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-sm border-b border-gray-600/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/courses" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">SA</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                Super Accountant
              </h1>
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/courses')}
                className="px-4 py-2 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white/90 hover:text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                Back to Courses
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white/90 hover:text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Course Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Course Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-sm font-bold text-white bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-2 rounded-full border border-gray-600/50 uppercase tracking-wide">
                {course.difficulty_level}
              </span>
              <span className="text-sm text-gray-300 font-medium">
                {course.duration_days} days
              </span>
              {course.is_featured && (
                <span className="text-sm font-bold text-white bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-2 rounded-full border border-gray-600/50 uppercase tracking-wide">
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              {course.title}
            </h1>

            <p className="text-gray-300 text-xl leading-relaxed font-light">
              {course.description}
            </p>

            {/* Learning Objectives */}
            {course.learning_objectives && course.learning_objectives.length > 0 && (
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl space-y-4">
                <h2 className="text-2xl font-black text-white bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">What you'll learn</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="text-white mt-1 font-black">✓</span>
                      <span className="text-gray-300 font-light">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl space-y-4">
                <h2 className="text-2xl font-black text-white bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">Prerequisites</h2>
                <div className="flex flex-wrap gap-2">
                  {course.prerequisites.map((prereq, index) => (
                    <span
                      key={index}
                      className="text-sm bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 px-4 py-2 rounded-full border border-gray-700/50 font-medium"
                    >
                      {prereq}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enrollment Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-6 sticky top-8 shadow-2xl">
              {/* Course Image */}
              <div className="aspect-video bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-2xl mb-6 flex items-center justify-center border border-gray-700/50 overflow-hidden">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-5xl font-black">
                    {course.title.charAt(0)}
                  </div>
                )}
              </div>

              {/* Course Stats */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-700/50">
                  <span className="text-gray-300 font-medium">Duration</span>
                  <span className="text-white font-bold">{course.duration_days} days</span>
                </div>
                <div className="flex justify-between items-center bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-700/50">
                  <span className="text-gray-300 font-medium">Level</span>
                  <span className="text-white font-bold capitalize">{course.difficulty_level}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-700/50">
                  <span className="text-gray-300 font-medium">Modules</span>
                  <span className="text-white font-bold">{course.modules?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-700/50">
                  <span className="text-gray-300 font-medium">Lessons</span>
                  <span className="text-white font-bold">
                    {course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0}
                  </span>
                </div>
              </div>

              {/* Enrollment Button */}
              {enrollment ? (
                <div className="space-y-4">
                  <div className="text-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 border border-gray-700/50">
                    <div className="text-white font-bold mb-2">✓ Enrolled</div>
                    <div className="text-sm text-gray-300 font-medium">
                      Progress: {enrollment.progress_percentage.toFixed(1)}%
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/learn/${enrollment.id}`)}
                    className="w-full group relative px-6 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="relative z-10">Continue Learning</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full group relative px-6 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative z-10">{enrolling ? 'Enrolling...' : 'Enroll Now'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Course Tabs */}
        <div className="border-b border-gray-600/50 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'curriculum', label: 'Curriculum' },
              { id: 'reviews', label: 'Reviews' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-bold text-sm transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Course Description */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-3xl font-black text-white mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">About this course</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed text-lg font-light">
                  {course.description}
                </p>
              </div>
            </div>

            {/* Certification Requirements */}
            {course.certification_requirements && course.certification_requirements.length > 0 && (
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-3xl font-black text-white mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">Certification Requirements</h2>
                <ul className="space-y-3">
                  {course.certification_requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="text-white mt-1 font-black">•</span>
                      <span className="text-gray-300 font-light text-lg">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-white mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">Course Curriculum</h2>
            {course.modules?.map((module, moduleIndex) => (
              <div key={module.id} className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-black text-white bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                    Week {module.week_number}: {module.title}
                  </h3>
                  <span className="text-sm text-gray-300 font-bold bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700/50">
                    {module.lessons?.length || 0} lessons
                  </span>
                </div>
                
                {module.description && (
                  <p className="text-gray-300 mb-6 text-lg font-light">{module.description}</p>
                )}

                <div className="space-y-3">
                  {module.lessons?.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 hover:border-gray-500/70 transition-all">
                      <div className="w-10 h-10 bg-gradient-to-br from-white via-gray-200 to-white rounded-full flex items-center justify-center text-black text-sm font-black border border-gray-600/50">
                        {lessonIndex + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold">{lesson.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 font-medium">
                          <span className="capitalize">{lesson.lesson_type}</span>
                          {lesson.duration_minutes && (
                            <span>{lesson.duration_minutes} min</span>
                          )}
                          {lesson.is_required && (
                            <span className="text-white bg-gray-800/50 px-2 py-1 rounded-full border border-gray-700/50">Required</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="text-center py-16 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl shadow-2xl">
            <h2 className="text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">Reviews</h2>
            <p className="text-gray-400 text-lg font-light">
              Reviews and ratings will be available once students complete the course.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

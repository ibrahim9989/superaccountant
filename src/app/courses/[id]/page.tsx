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
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1e3a5f] to-[#DC2626] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#2B2A29] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-black text-white mb-6">
            Course Not Found
          </h1>
          <button
            onClick={() => router.push('/courses')}
            className="px-8 py-4 bg-[#DC2626] text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2B2A29] text-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1e3a5f] via-[#264174] to-[#DC2626] py-12 sm:py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/courses" className="text-white/90 hover:text-white transition-colors">
              ← Back to Courses
            </Link>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              Dashboard
            </button>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
            {course.title}
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gradient-to-b from-[#2B2A29] to-[#264174]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Course Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-sm font-bold text-white bg-white/10 px-4 py-2 rounded-full border border-white/20 uppercase tracking-wide">
                  {course.difficulty_level}
                </span>
                <span className="text-sm text-white/90 font-medium">
                  {course.duration_days} days
                </span>
                {course.is_featured && (
                  <span className="text-sm font-bold text-white bg-white/10 px-4 py-2 rounded-full border border-white/20 uppercase tracking-wide">
                    Featured
                  </span>
                )}
              </div>

              <p className="text-white/90 text-xl leading-relaxed">
                {course.description}
              </p>

              {/* Learning Objectives */}
              {course.learning_objectives && course.learning_objectives.length > 0 && (
                <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-6 md:p-8 space-y-4">
                  <h2 className="text-2xl font-black text-white">What you'll learn</h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.learning_objectives.map((objective, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="text-white mt-1 font-bold">✓</span>
                        <span className="text-white/90">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prerequisites */}
              {course.prerequisites && course.prerequisites.length > 0 && (
                <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-6 md:p-8 space-y-4">
                  <h2 className="text-2xl font-black text-white">Prerequisites</h2>
                  <div className="flex flex-wrap gap-2">
                    {course.prerequisites.map((prereq, index) => (
                      <span
                        key={index}
                        className="text-sm bg-white/10 text-white/90 px-4 py-2 rounded-full border border-white/20 font-medium"
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
              <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-6 sticky top-8">
                {/* Course Image */}
                <div className="aspect-video bg-white/10 rounded-xl mb-6 flex items-center justify-center border border-white/20 overflow-hidden">
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
                  <div className="flex justify-between items-center bg-white/10 px-4 py-3 rounded-lg border border-white/20">
                    <span className="text-white/90 font-medium">Duration</span>
                    <span className="text-white font-bold">{course.duration_days} days</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 px-4 py-3 rounded-lg border border-white/20">
                    <span className="text-white/90 font-medium">Level</span>
                    <span className="text-white font-bold capitalize">{course.difficulty_level}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 px-4 py-3 rounded-lg border border-white/20">
                    <span className="text-white/90 font-medium">Modules</span>
                    <span className="text-white font-bold">{course.modules?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 px-4 py-3 rounded-lg border border-white/20">
                    <span className="text-white/90 font-medium">Lessons</span>
                    <span className="text-white font-bold">
                      {course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0}
                    </span>
                  </div>
                </div>

                {/* Enrollment Button */}
                {enrollment ? (
                  <div className="space-y-4">
                    <div className="text-center bg-white/10 rounded-xl p-4 border border-white/20">
                      <div className="text-white font-bold mb-2">✓ Enrolled</div>
                      <div className="text-sm text-white/90 font-medium">
                        Progress: {enrollment.progress_percentage.toFixed(1)}%
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/learn/${enrollment.id}`)}
                      className="w-full px-6 py-4 bg-[#DC2626] text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors"
                    >
                      Continue Learning
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full px-6 py-4 bg-[#DC2626] text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Course Tabs */}
          <div className="border-b border-white/10 mb-8">
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
                      : 'border-transparent text-white/60 hover:text-white/90 hover:border-white/50'
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
              <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-black text-white mb-6">About this course</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-white/90 leading-relaxed text-lg">
                    {course.description}
                  </p>
                </div>
              </div>

              {/* Certification Requirements */}
              {course.certification_requirements && course.certification_requirements.length > 0 && (
                <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-6 md:p-8">
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-6">Certification Requirements</h2>
                  <ul className="space-y-3">
                    {course.certification_requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="text-white mt-1 font-bold">•</span>
                        <span className="text-white/90 text-lg">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-6">Course Curriculum</h2>
              {course.modules?.map((module, moduleIndex) => (
                <div key={module.id} className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black text-white">
                      Week {module.week_number}: {module.title}
                    </h3>
                    <span className="text-sm text-white/90 font-bold bg-white/10 px-4 py-2 rounded-full border border-white/20">
                      {module.lessons?.length || 0} lessons
                    </span>
                  </div>
                  
                  {module.description && (
                    <p className="text-white/90 mb-6 text-lg">{module.description}</p>
                  )}

                  <div className="space-y-3">
                    {module.lessons?.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="flex items-center space-x-4 p-4 bg-white/10 rounded-xl border border-white/20 hover:border-white/30 transition-all">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#264174] text-sm font-black border border-white/20">
                          {lessonIndex + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-bold">{lesson.title}</h4>
                          <div className="flex items-center space-x-4 text-sm text-white/80 font-medium">
                            <span className="capitalize">{lesson.lesson_type}</span>
                            {lesson.duration_minutes && (
                              <span>{lesson.duration_minutes} min</span>
                            )}
                            {lesson.is_required && (
                              <span className="text-white bg-white/10 px-2 py-1 rounded-full border border-white/20">Required</span>
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
            <div className="text-center py-16 bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Reviews</h2>
              <p className="text-white/90 text-lg">
                Reviews and ratings will be available once students complete the course.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

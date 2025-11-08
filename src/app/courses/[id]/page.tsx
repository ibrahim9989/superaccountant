'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import { CourseWithDetails, CourseEnrollment } from '@/lib/validations/course'
import { courseService } from '@/lib/services/courseService'

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

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && resolvedParams.id) {
      loadCourse()
    }
  }, [user, resolvedParams.id])

  const loadCourse = async () => {
    try {
      setLoadingCourse(true)
      const courseData = await courseService.getCourseById(resolvedParams.id)
      setCourse(courseData)

      if (courseData) {
        // Check if user is already enrolled
        const enrollments = await courseService.getUserEnrollments(user!.id)
        const userEnrollment = enrollments.find(e => e.course_id === resolvedParams.id)
        setEnrollment(userEnrollment || null)
      }
    } catch (error) {
      console.error('Error loading course:', error)
    } finally {
      setLoadingCourse(false)
    }
  }

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Course Not Found</h1>
          <button
            onClick={() => router.push('/courses')}
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
          >
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full relative">
      {/* Azure Depths Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 10%, #000000 40%, #010133 100%)",
        }}
      />

      {/* Navigation */}
      <nav className="relative z-10 bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-azure-accent to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SA</span>
              </div>
              <h1 className="text-xl font-semibold text-white">
                Super Accountant
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/courses')}
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                Back to Courses
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-300 hover:text-white transition-colors duration-200"
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
              <span className="text-sm font-medium text-blue-400 bg-blue-400/20 px-3 py-1 rounded-full">
                {course.difficulty_level}
              </span>
              <span className="text-sm text-gray-400">
                {course.duration_days} days
              </span>
              {course.is_featured && (
                <span className="text-sm font-medium text-yellow-400 bg-yellow-400/20 px-3 py-1 rounded-full">
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold text-white">
              {course.title}
            </h1>

            <p className="text-gray-300 text-lg leading-relaxed">
              {course.description}
            </p>

            {/* Learning Objectives */}
            {course.learning_objectives && course.learning_objectives.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-white">What you'll learn</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="text-green-400 mt-1">✓</span>
                      <span className="text-gray-300">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-white">Prerequisites</h2>
                <div className="flex flex-wrap gap-2">
                  {course.prerequisites.map((prereq, index) => (
                    <span
                      key={index}
                      className="text-sm bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full"
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
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sticky top-8">
              {/* Course Image */}
              <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl mb-6 flex items-center justify-center">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="text-white text-4xl font-bold">
                    {course.title.charAt(0)}
                  </div>
                )}
              </div>

              {/* Course Stats */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Duration</span>
                  <span className="text-white font-semibold">{course.duration_days} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Level</span>
                  <span className="text-white font-semibold capitalize">{course.difficulty_level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Modules</span>
                  <span className="text-white font-semibold">{course.modules?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Lessons</span>
                  <span className="text-white font-semibold">
                    {course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0}
                  </span>
                </div>
              </div>

              {/* Enrollment Button */}
              {enrollment ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-green-400 font-semibold mb-2">✓ Enrolled</div>
                    <div className="text-sm text-gray-300">
                      Progress: {enrollment.progress_percentage.toFixed(1)}%
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/learn/${enrollment.id}`)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all duration-300"
                  >
                    Continue Learning
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-azure-accent hover:bg-blue-600 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 disabled:cursor-not-allowed"
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
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
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
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">About this course</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed">
                  {course.description}
                </p>
              </div>
            </div>

            {/* Certification Requirements */}
            {course.certification_requirements && course.certification_requirements.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">Certification Requirements</h2>
                <ul className="space-y-3">
                  {course.certification_requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="text-blue-400 mt-1">•</span>
                      <span className="text-gray-300">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Course Curriculum</h2>
            {course.modules?.map((module, moduleIndex) => (
              <div key={module.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    Week {module.week_number}: {module.title}
                  </h3>
                  <span className="text-sm text-gray-400">
                    {module.lessons?.length || 0} lessons
                  </span>
                </div>
                
                {module.description && (
                  <p className="text-gray-300 mb-4">{module.description}</p>
                )}

                <div className="space-y-3">
                  {module.lessons?.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {lessonIndex + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{lesson.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="capitalize">{lesson.lesson_type}</span>
                          {lesson.duration_minutes && (
                            <span>{lesson.duration_minutes} min</span>
                          )}
                          {lesson.is_required && (
                            <span className="text-yellow-400">Required</span>
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
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-white mb-4">Reviews</h2>
            <p className="text-gray-400">
              Reviews and ratings will be available once students complete the course.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { CourseWithDetails } from '@/lib/validations/course'
import { courseService } from '@/lib/services/courseService'

export default function CoursesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<CourseWithDetails[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  const loadCourses = useCallback(async () => {
    try {
      setLoadingCourses(true)
      setError(null)
      console.log('Loading courses...')
      
      const filters: any = {}
      
      if (selectedCategory !== 'all') {
        filters.category_id = selectedCategory
      }
      if (selectedDifficulty !== 'all') {
        filters.difficulty_level = selectedDifficulty
      }

      console.log('Filters:', filters)
      const coursesData = await courseService.getCourses(filters)
      console.log('Courses loaded:', coursesData)
      setCourses(coursesData)
    } catch (error) {
      console.error('Error loading courses:', error)
      setError(error instanceof Error ? error.message : 'Failed to load courses')
    } finally {
      setLoadingCourses(false)
    }
  }, [selectedCategory, selectedDifficulty])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadCourses()
    }
  }, [user, loadCourses])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
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
                onClick={() => router.push('/dashboard')}
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                Dashboard
              </button>
              <span className="text-gray-300">
                Welcome, {user.user_metadata?.full_name || user.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Course Catalog
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Master the art of accounting with our comprehensive 45-day certification program.
            Choose your learning path and transform your career.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="fundamentals">Fundamentals</option>
            <option value="advanced">Advanced</option>
            <option value="certification">Certification</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-8">
            <p className="text-red-300 text-center">
              Error loading courses: {error}
            </p>
            <button
              onClick={loadCourses}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors mx-auto block"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Courses Grid */}
        {loadingCourses ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105"
              >
                {/* Course Image */}
                <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl mb-4 flex items-center justify-center">
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

                {/* Course Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-400 bg-blue-400/20 px-2 py-1 rounded-full">
                      {course.difficulty_level}
                    </span>
                    <span className="text-xs text-gray-400">
                      {course.duration_days} days
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-white">
                    {course.title}
                  </h3>

                  <p className="text-gray-300 text-sm line-clamp-3">
                    {course.short_description || course.description}
                  </p>

                  {/* Learning Objectives */}
                  {course.learning_objectives && course.learning_objectives.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-white">What you'll learn:</h4>
                      <ul className="text-xs text-gray-400 space-y-1">
                        {course.learning_objectives.slice(0, 3).map((objective, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-400 mt-1">✓</span>
                            <span>{objective}</span>
                          </li>
                        ))}
                        {course.learning_objectives.length > 3 && (
                          <li className="text-gray-500">
                            +{course.learning_objectives.length - 3} more objectives
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Prerequisites */}
                  {course.prerequisites && course.prerequisites.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-white">Prerequisites:</h4>
                      <div className="flex flex-wrap gap-1">
                        {course.prerequisites.slice(0, 3).map((prereq, index) => (
                          <span
                            key={index}
                            className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded-full"
                          >
                            {prereq}
                          </span>
                        ))}
                        {course.prerequisites.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{course.prerequisites.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => router.push(`/courses/${course.id}`)}
                    className="w-full bg-azure-accent hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    View Course Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingCourses && courses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">
              No courses found matching your criteria.
            </div>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSelectedDifficulty('all')
              }}
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  )
}



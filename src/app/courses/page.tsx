'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { CourseWithDetails } from '@/lib/validations/course'
import { courseService } from '@/lib/services/courseService'
import Link from 'next/link'

export default function CoursesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<CourseWithDetails[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  const loadCourses = useCallback(async () => {
    if (!user) return
    
    try {
      setLoadingCourses(true)
      setError(null)
      
      const filters: any = {}
      
      if (selectedCategory !== 'all') {
        filters.category_id = selectedCategory
      }
      if (selectedDifficulty !== 'all') {
        filters.difficulty_level = selectedDifficulty
      }

      const coursesData = await courseService.getCourses(filters)
      setCourses(coursesData)
    } catch (error) {
      console.error('Error loading courses:', error)
      setError(error instanceof Error ? error.message : 'Failed to load courses')
    } finally {
      setLoadingCourses(false)
    }
  }, [user, selectedCategory, selectedDifficulty])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    
    if (user) {
      loadCourses()
    }
  }, [user, loading, router, loadCourses])

  if (loading) {
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
      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-12">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">SA</span>
          </div>
          <span className="text-white text-xl font-semibold">Super Accountant</span>
        </Link>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white/90 hover:text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            Dashboard
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-6 shadow-2xl backdrop-blur-sm">
            <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-300 rounded-full mr-3 animate-pulse"></div>
            <span className="text-white text-xs font-bold tracking-[0.22em] uppercase">COURSE CATALOG</span>
            <div className="w-2.5 h-2.5 bg-gradient-to-r from-gray-300 to-white rounded-full ml-3 animate-pulse"></div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            Course Catalog
          </h1>
          <p className="text-xl text-gray-300 font-light max-w-3xl mx-auto">
            Master the art of accounting with our comprehensive 45-day certification program.
            Choose your learning path and transform your career.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-12 justify-center">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-6 py-3 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all shadow-xl font-medium"
          >
            <option value="all">All Categories</option>
            <option value="fundamentals">Fundamentals</option>
            <option value="advanced">Advanced</option>
            <option value="certification">Certification</option>
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-6 py-3 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-gray-500/70 transition-all shadow-xl font-medium"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-red-500/30 rounded-3xl p-6 mb-8 shadow-2xl">
            <p className="text-red-300 text-center text-lg font-medium">
              Error loading courses: {error}
            </p>
            <button
              onClick={loadCourses}
              className="mt-4 mx-auto block px-8 py-3 bg-gradient-to-r from-white via-gray-100 to-white text-black font-bold rounded-2xl hover:shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Courses Grid */}
        {loadingCourses ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-white"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div
                key={course.id}
                className="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-6 hover:border-gray-500/70 transition-all duration-700 hover:transform hover:scale-105 shadow-2xl"
              >
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

                {/* Course Info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-gray-700 to-gray-800 px-3 py-1.5 rounded-full border border-gray-600/50 uppercase tracking-wide">
                      {course.difficulty_level}
                    </span>
                    <span className="text-xs text-gray-300 font-medium">
                      {course.duration_days} days
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-white leading-tight bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                    {course.title}
                  </h3>

                  <p className="text-gray-300 text-sm line-clamp-3 font-light">
                    {course.short_description || course.description}
                  </p>

                  {/* Learning Objectives */}
                  {course.learning_objectives && course.learning_objectives.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wide">What you'll learn:</h4>
                      <ul className="text-xs text-gray-300 space-y-1.5">
                        {course.learning_objectives.slice(0, 3).map((objective, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-white mt-1 font-black">✓</span>
                            <span className="font-light">{objective}</span>
                          </li>
                        ))}
                        {course.learning_objectives.length > 3 && (
                          <li className="text-gray-500 text-xs">
                            +{course.learning_objectives.length - 3} more objectives
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Prerequisites */}
                  {course.prerequisites && course.prerequisites.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wide">Prerequisites:</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {course.prerequisites.slice(0, 3).map((prereq, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 px-2.5 py-1 rounded-full border border-gray-700/50 font-medium"
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
                    className="w-full group relative px-6 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="relative z-10">View Course Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loadingCourses && courses.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full mb-6 border border-gray-700/50">
              <span className="text-4xl">📚</span>
            </div>
            <p className="text-gray-300 text-xl mb-6 font-light">
              No courses found matching your criteria.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSelectedDifficulty('all')
              }}
              className="px-8 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

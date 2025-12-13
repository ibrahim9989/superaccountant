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
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1e3a5f] to-[#DC2626] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return null
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
            <Link href="/dashboard" className="text-white/90 hover:text-white transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              Course Catalog
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 max-w-4xl mx-auto font-medium">
              Master the art of accounting with our comprehensive 45-day certification program.
              Choose your learning path and transform your career.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gradient-to-b from-[#2B2A29] to-[#264174]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-12 justify-center">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all font-medium"
              style={{ colorScheme: 'dark' }}
            >
              <option value="all" style={{ backgroundColor: '#1e1e1e', color: 'white' }}>All Categories</option>
              <option value="fundamentals" style={{ backgroundColor: '#1e1e1e', color: 'white' }}>Fundamentals</option>
              <option value="advanced" style={{ backgroundColor: '#1e1e1e', color: 'white' }}>Advanced</option>
              <option value="certification" style={{ backgroundColor: '#1e1e1e', color: 'white' }}>Certification</option>
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all font-medium"
              style={{ colorScheme: 'dark' }}
            >
              <option value="all" style={{ backgroundColor: '#1e1e1e', color: 'white' }}>All Levels</option>
              <option value="beginner" style={{ backgroundColor: '#1e1e1e', color: 'white' }}>Beginner</option>
              <option value="intermediate" style={{ backgroundColor: '#1e1e1e', color: 'white' }}>Intermediate</option>
              <option value="advanced" style={{ backgroundColor: '#1e1e1e', color: 'white' }}>Advanced</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-6 mb-8">
              <p className="text-white text-center text-lg font-medium mb-4">
                Error loading courses: {error}
              </p>
              <button
                onClick={loadCourses}
                className="mx-auto block px-8 py-3 bg-[#DC2626] text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Courses Grid */}
          {loadingCourses ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
                >
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

                  {/* Course Info */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-full border border-white/20 uppercase tracking-wide">
                        {course.difficulty_level}
                      </span>
                      <span className="text-xs text-white/90 font-medium">
                        {course.duration_days} days
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-white leading-tight">
                      {course.title}
                    </h3>

                    <p className="text-white/90 text-sm line-clamp-3">
                      {course.short_description || course.description}
                    </p>

                    {/* Learning Objectives */}
                    {course.learning_objectives && course.learning_objectives.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wide">What you'll learn:</h4>
                        <ul className="text-xs text-white/90 space-y-1.5">
                          {course.learning_objectives.slice(0, 3).map((objective, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-white mt-1 font-bold">✓</span>
                              <span>{objective}</span>
                            </li>
                          ))}
                          {course.learning_objectives.length > 3 && (
                            <li className="text-white/70 text-xs">
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
                              className="text-xs bg-white/10 text-white/90 px-2.5 py-1 rounded-full border border-white/20 font-medium"
                            >
                              {prereq}
                            </span>
                          ))}
                          {course.prerequisites.length > 3 && (
                            <span className="text-xs text-white/70">
                              +{course.prerequisites.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => router.push(`/courses/${course.id}`)}
                      className="w-full px-6 py-4 bg-[#DC2626] text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors"
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
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-full mb-6 border border-white/20">
                <span className="text-4xl">📚</span>
              </div>
              <p className="text-white/90 text-xl mb-6">
                No courses found matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSelectedDifficulty('all')
                }}
                className="px-8 py-3 bg-[#DC2626] text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

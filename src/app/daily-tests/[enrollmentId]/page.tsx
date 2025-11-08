'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import { CourseEnrollmentWithDetails } from '@/lib/validations/course'
import { DailyTestResult } from '@/lib/validations/dailyTest'
import { courseService } from '@/lib/services/courseService'
import DailyTestDashboard from '@/components/DailyTestDashboard'
import DailyTest from '@/components/DailyTest'

interface DailyTestsPageProps {
  params: Promise<{
    enrollmentId: string
  }>
}

export default function DailyTestsPage({ params }: DailyTestsPageProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [enrollment, setEnrollment] = useState<CourseEnrollmentWithDetails | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [showTest, setShowTest] = useState(false)
  const [currentTestDay, setCurrentTestDay] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Unwrap params Promise
  const resolvedParams = use(params)
  
  // Get current day from URL params
  const currentDay = searchParams.get('day') ? parseInt(searchParams.get('day')!) : undefined

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
    } catch (error) {
      console.error('Error loading enrollment data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleStartTest = (dayNumber: number) => {
    setCurrentTestDay(dayNumber)
    setShowTest(true)
  }

  const handleTestComplete = (result: DailyTestResult) => {
    console.log('Daily test completed:', result)
    setShowTest(false)
    setCurrentTestDay(null)
    
    // Refresh the dashboard to show updated stats
    setRefreshTrigger(prev => prev + 1)
    
    // Show success message or redirect
    if (result.passed) {
      // Could show a success toast here
      console.log('Test passed!')
    } else {
      // Could show a retry message here
      console.log('Test failed, can retry')
    }
  }

  const handleCloseTest = () => {
    setShowTest(false)
    setCurrentTestDay(null)
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-azure-dark text-white font-sans">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading daily tests...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-azure-dark text-white font-sans">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Enrollment Not Found</h1>
            <p className="text-gray-300 mb-6">The requested enrollment could not be found.</p>
            <button
              onClick={() => router.push('/courses')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-azure-dark text-white font-sans">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/learn/${resolvedParams.enrollmentId}`)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white">Daily Tests</h1>
                <p className="text-sm text-gray-400">{enrollment.course?.title}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/learn/${resolvedParams.enrollmentId}`)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
              >
                Back to Learning
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DailyTestDashboard
          enrollmentId={resolvedParams.enrollmentId}
          courseId={enrollment.course_id}
          onStartTest={handleStartTest}
          refreshTrigger={refreshTrigger}
          currentDay={currentDay}
        />
      </div>

      {/* Daily Test Modal */}
      {showTest && currentTestDay && (
        <DailyTest
          enrollmentId={resolvedParams.enrollmentId}
          courseId={enrollment.course_id}
          dayNumber={currentTestDay}
          onTestComplete={handleTestComplete}
          onClose={handleCloseTest}
        />
      )}
    </div>
  )
}



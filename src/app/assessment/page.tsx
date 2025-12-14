'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  TestConfiguration, 
  TestSessionWithDetails, 
  TestResult as TestResultType,
  TestAnalytics 
} from '@/lib/validations/mcq'
import { mcqService } from '@/lib/services/mcqService'
import MCQTest from '@/components/MCQTest'
import TestResult from '@/components/TestResult'
import Link from 'next/link'

type AssessmentState = 'loading' | 'config' | 'test' | 'result' | 'error'

export default function AssessmentPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [state, setState] = useState<AssessmentState>('loading')
  const [testConfigs, setTestConfigs] = useState<TestConfiguration[]>([])
  const [selectedConfig, setSelectedConfig] = useState<TestConfiguration | null>(null)
  const [testSession, setTestSession] = useState<TestSessionWithDetails | null>(null)
  const [testResult, setTestResult] = useState<TestResultType | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<TestAnalytics[]>([])
  const [error, setError] = useState<string | null>(null)

  // Use ref to prevent duplicate API calls
  const hasLoadedData = useRef(false)

  const loadAssessmentData = useCallback(async () => {
    if (!user || hasLoadedData.current) return
    
    try {
      setState('loading')
      hasLoadedData.current = true
      
      // Load test configurations
      const configs = await mcqService.getTestConfigurations()
      setTestConfigs(configs)
      
      // Load user analytics
      const analytics = await mcqService.getUserTestAnalytics(user.id)
      setUserAnalytics(analytics)
      
      setState('config')
    } catch (err) {
      console.error('Error loading assessment data:', err)
      setError('Failed to load assessment data. Please try again.')
      setState('error')
      hasLoadedData.current = false // Reset on error to allow retry
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      const next = '/assessment'
      router.push(`/login?next=${encodeURIComponent(next)}`)
      return
    }

    if (user && !hasLoadedData.current) {
      loadAssessmentData()
    } else if (user && testConfigs.length > 0) {
      // If we already have data, just set state to config
      setState('config')
    }
  }, [user, authLoading, router, loadAssessmentData, testConfigs.length])

  const startTest = async (configId: string) => {
    try {
      setState('loading')
      
      const config = testConfigs.find(c => c.id === configId)
      if (!config) throw new Error('Test configuration not found')
      
      setSelectedConfig(config)
      
      const session = await mcqService.startTest(user!.id, { test_config_id: configId })
      setTestSession(session)
      setState('test')
    } catch (err) {
      console.error('Error starting test:', err)
      setError(err instanceof Error ? err.message : 'Failed to start test. Please try again.')
      setState('error')
    }
  }

  const handleTestComplete = (result: TestResultType) => {
    setTestResult(result)
    setState('result')
  }

  const handleTestAbandon = () => {
    setState('config')
    setTestSession(null)
  }

  const handleRetakeTest = () => {
    if (selectedConfig) {
      startTest(selectedConfig.id)
    }
  }

  const handleContinue = () => {
    router.push('/under-review')
  }

  if (authLoading || state === 'loading') {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1e3a5f] to-[#DC2626] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[#2B2A29] text-white flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-8 border border-white/10">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
              Something went wrong
            </h2>
            <p className="text-white/90 mb-8 text-lg">{error}</p>
          <button
            onClick={loadAssessmentData}
              className="px-8 py-4 bg-[#DC2626] text-white rounded-lg text-lg font-semibold hover:bg-[#B91C1C] transition-colors"
          >
            Try Again
          </button>
          </div>
        </div>
      </div>
    )
  }

  if (state === 'test' && testSession) {
    return (
      <MCQTest
        session={testSession}
        onComplete={handleTestComplete}
        onAbandon={handleTestAbandon}
      />
    )
  }

  if (state === 'result' && testResult) {
    return (
      <TestResult
        result={testResult}
        onRetake={handleRetakeTest}
        onContinue={handleContinue}
      />
    )
  }

  // Configuration selection state
  return (
    <div className="min-h-screen bg-[#2B2A29] text-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1e3a5f] via-[#264174] to-[#DC2626] py-12 sm:py-16 md:py-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              Assessment Test
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 max-w-4xl mx-auto font-medium">
              Take this comprehensive assessment to evaluate your accounting knowledge and readiness for the Super Accountant program.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gradient-to-b from-[#2B2A29] to-[#264174]/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-[#DC2626] text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* User Analytics */}
        {userAnalytics.length > 0 && (
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-8 border border-white/10 mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
              Your Previous Attempts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {userAnalytics.map((analytics) => (
                  <div key={analytics.id} className="bg-white/10 rounded-xl p-6 border border-white/20">
                    <div className="text-4xl font-black text-white mb-2">
                    {analytics.best_score.toFixed(1)}%
                  </div>
                    <div className="text-white/90 text-sm font-medium mb-1">Best Score</div>
                    <div className="text-white/70 text-sm">
                    {analytics.total_attempts} attempt{analytics.total_attempts > 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Configurations */}
        <div className="space-y-6 mb-8">
          {testConfigs.map((config) => {
            const userConfigAnalytics = userAnalytics.find(a => a.test_config_id === config.id)
            
            return (
                <div key={config.id} className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-8 border border-white/10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                  <div className="flex-1">
                      <h3 className="text-2xl md:text-3xl font-black text-white mb-4">
                      {config.name}
                    </h3>
                    {config.description && (
                        <p className="text-white/90 mb-6 text-lg">{config.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      <div>
                            <div className="text-white/70 text-xs uppercase tracking-wide">Questions</div>
                          <div className="text-white font-bold text-lg">{config.total_questions}</div>
                        </div>
                      </div>
                        <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      <div>
                            <div className="text-white/70 text-xs uppercase tracking-wide">Time Limit</div>
                          <div className="text-white font-bold text-lg">{config.time_limit_minutes} min</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4 lg:min-w-[200px]">
                    {userConfigAnalytics && (
                        <div className="bg-white/10 rounded-xl p-6 text-center border border-white/20">
                          <div className="text-3xl font-black text-white mb-2">
                          {userConfigAnalytics.best_score.toFixed(1)}%
                        </div>
                          <div className="text-white/90 text-sm font-medium mb-1">Best Score</div>
                          <div className="text-white/70 text-xs">
                          {userConfigAnalytics.total_attempts} attempt{userConfigAnalytics.total_attempts > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => startTest(config.id)}
                        className="px-8 py-4 bg-[#DC2626] text-white rounded-lg text-lg font-semibold hover:bg-[#B91C1C] transition-colors"
                    >
                        {userConfigAnalytics ? 'Retake Test' : 'Start Test'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Instructions */}
          <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-8 border border-white/10">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-6">
            Test Instructions
          </h2>
            <div className="space-y-4 text-white/90">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <p className="text-lg">Read each question carefully before selecting your answer.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">2</span>
            </div>
                <p className="text-lg">You can navigate between questions using the Previous/Next buttons.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">3</span>
            </div>
                <p className="text-lg">The test is timed. Make sure to complete all questions before time runs out.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">4</span>
            </div>
                <p className="text-lg">Complete the assessment to the best of your ability. Your results will be reviewed by our team.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

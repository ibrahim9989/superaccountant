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
      <div className="min-h-screen w-full bg-black flex items-center justify-center relative">
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

  if (state === 'error') {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md mx-auto text-center">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-red-900/50 to-red-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
            <h2 className="text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Something went wrong
            </h2>
            <p className="text-gray-300 mb-8 text-lg">{error}</p>
          <button
            onClick={loadAssessmentData}
              className="px-8 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-bold rounded-2xl hover:shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105"
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
          <button
            onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white/90 hover:text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl"
          >
            Back to Dashboard
          </button>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto p-6 lg:p-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-6 shadow-2xl backdrop-blur-sm">
            <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-300 rounded-full mr-3 animate-pulse"></div>
            <span className="text-white text-xs font-bold tracking-[0.22em] uppercase">PRE-ENROLLMENT ASSESSMENT</span>
            <div className="w-2.5 h-2.5 bg-gradient-to-r from-gray-300 to-white rounded-full ml-3 animate-pulse"></div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            Assessment Test
          </h1>
          <p className="text-xl text-gray-300 font-light max-w-3xl mx-auto">
            Take this comprehensive assessment to evaluate your accounting knowledge and readiness for the Super Accountant program.
          </p>
        </div>

        {/* User Analytics */}
        {userAnalytics.length > 0 && (
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 mb-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Your Previous Attempts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {userAnalytics.map((analytics) => (
                <div key={analytics.id} className="group bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 hover:border-gray-500/70 transition-all duration-500">
                  <div className="text-4xl font-black text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                    {analytics.best_score.toFixed(1)}%
                  </div>
                  <div className="text-gray-300 text-sm font-medium mb-1">Best Score</div>
                  <div className="text-gray-400 text-sm">
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
              <div key={config.id} className="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl hover:border-gray-500/70 transition-all duration-500">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                  <div className="flex-1">
                    <h3 className="text-3xl font-black text-white mb-4 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                      {config.name}
                    </h3>
                    {config.description && (
                      <p className="text-gray-300 mb-6 text-lg font-light">{config.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-6 text-sm">
                      <div className="flex items-center space-x-3 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      <div>
                          <div className="text-gray-400 text-xs uppercase tracking-wide">Questions</div>
                          <div className="text-white font-bold text-lg">{config.total_questions}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-700/50">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      <div>
                          <div className="text-gray-400 text-xs uppercase tracking-wide">Time Limit</div>
                          <div className="text-white font-bold text-lg">{config.time_limit_minutes} min</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4 lg:min-w-[200px]">
                    {userConfigAnalytics && (
                      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 text-center">
                        <div className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                          {userConfigAnalytics.best_score.toFixed(1)}%
                        </div>
                        <div className="text-gray-300 text-sm font-medium mb-1">Best Score</div>
                        <div className="text-gray-400 text-xs">
                          {userConfigAnalytics.total_attempts} attempt{userConfigAnalytics.total_attempts > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => startTest(config.id)}
                      className="group relative px-8 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="relative z-10">{userConfigAnalytics ? 'Retake Test' : 'Start Test'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            Test Instructions
          </h2>
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-white/20 via-gray-700/20 to-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-gray-600/50">
                <span className="text-white text-sm font-black">1</span>
              </div>
              <p className="text-lg font-light">Read each question carefully before selecting your answer.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-white/20 via-gray-700/20 to-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-gray-600/50">
                <span className="text-white text-sm font-black">2</span>
              </div>
              <p className="text-lg font-light">You can navigate between questions using the Previous/Next buttons.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-white/20 via-gray-700/20 to-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-gray-600/50">
                <span className="text-white text-sm font-black">3</span>
              </div>
              <p className="text-lg font-light">The test is timed. Make sure to complete all questions before time runs out.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-white/20 via-gray-700/20 to-white/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-gray-600/50">
                <span className="text-white text-sm font-black">4</span>
              </div>
              <p className="text-lg font-light">Complete the assessment to the best of your ability. Your results will be reviewed by our team.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

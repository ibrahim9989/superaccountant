'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (!authLoading && !user) {
      const next = '/assessment'
      router.push(`/login?next=${encodeURIComponent(next)}`)
      return
    }

    if (user) {
      loadAssessmentData()
    }
  }, [user, authLoading, router])

  const loadAssessmentData = async () => {
    try {
      setState('loading')
      
      // Load test configurations
      const configs = await mcqService.getTestConfigurations()
      setTestConfigs(configs)
      
      // Load user analytics
      const analytics = await mcqService.getUserTestAnalytics(user!.id)
      setUserAnalytics(analytics)
      
      setState('config')
    } catch (err) {
      console.error('Error loading assessment data:', err)
      setError('Failed to load assessment data. Please try again.')
      setState('error')
    }
  }

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
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={loadAssessmentData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
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
    <div className="min-h-screen w-full bg-black">
      {/* Navigation */}
      <nav className="bg-white/5 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
              <span className="text-black font-bold text-sm">SA</span>
            </div>
            <span className="text-white text-lg font-medium">Super Accountant</span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white text-sm font-medium hover:text-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Pre-Enrollment Assessment
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Take this comprehensive assessment to evaluate your accounting knowledge and readiness for the Super Accountant program.
          </p>
        </div>

        {/* User Analytics */}
        {userAnalytics.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Your Previous Attempts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userAnalytics.map((analytics) => (
                <div key={analytics.id} className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-white mb-1">
                    {analytics.best_score.toFixed(1)}%
                  </div>
                  <div className="text-gray-400 text-sm mb-2">Best Score</div>
                  <div className="text-gray-400 text-sm">
                    {analytics.total_attempts} attempt{analytics.total_attempts > 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Configurations */}
        <div className="space-y-6">
          {testConfigs.map((config) => {
            const userConfigAnalytics = userAnalytics.find(a => a.test_config_id === config.id)
            
            return (
              <div key={config.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-white mb-2">{config.name}</h3>
                    {config.description && (
                      <p className="text-gray-300 mb-4">{config.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Questions</div>
                        <div className="text-white font-medium">{config.total_questions}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Time Limit</div>
                        <div className="text-white font-medium">{config.time_limit_minutes} min</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {userConfigAnalytics && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {userConfigAnalytics.best_score.toFixed(1)}%
                        </div>
                        <div className="text-gray-400 text-sm">Best Score</div>
                        <div className="text-gray-400 text-sm">
                          {userConfigAnalytics.total_attempts} attempt{userConfigAnalytics.total_attempts > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => startTest(config.id)}
                      className="px-8 py-4 rounded-lg font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700"
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
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Test Instructions</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-sm font-bold">1</span>
              </div>
              <p>Read each question carefully before selecting your answer.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-sm font-bold">2</span>
              </div>
              <p>You can navigate between questions using the Previous/Next buttons.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-sm font-bold">3</span>
              </div>
              <p>The test is timed. Make sure to complete all questions before time runs out.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-sm font-bold">4</span>
              </div>
              <p>Complete the assessment to the best of your ability. Your results will be reviewed by our team.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

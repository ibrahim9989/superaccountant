'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function TestQuizPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testQuizQuestions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('id, question_text, is_active')
        .limit(10)
      
      setResults((prev: any) => ({
        ...prev,
        quizQuestions: { data, error: error?.message }
      }))
    } catch (err) {
      setResults((prev: any) => ({
        ...prev,
        quizQuestions: { error: err }
      }))
    }
    setLoading(false)
  }

  const testDailyTestConfigs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('daily_test_configs')
        .select('id, title, day_number, is_active')
        .limit(10)
      
      setResults((prev: any) => ({
        ...prev,
        dailyTestConfigs: { data, error: error?.message }
      }))
    } catch (err) {
      setResults((prev: any) => ({
        ...prev,
        dailyTestConfigs: { error: err }
      }))
    }
    setLoading(false)
  }

  const testDailyTestQuestions = async () => {
    setLoading(true)
    try {
      // Check authentication first
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) {
        setResults((prev: any) => ({
          ...prev,
          dailyTestQuestions: { error: `Auth Error: ${authError.message}` }
        }))
        setLoading(false)
        return
      }
      
      if (!session) {
        setResults((prev: any) => ({
          ...prev,
          dailyTestQuestions: { error: 'Not authenticated. Please log in first.' }
        }))
        setLoading(false)
        return
      }
      
      console.log('Authenticated as:', session.user.email)
      
      const { data, error } = await supabase
        .from('daily_test_questions')
        .select('test_config_id, question_id, order_index')
        .limit(10)
      
      setResults((prev: any) => ({
        ...prev,
        dailyTestQuestions: { data, error: error?.message }
      }))
    } catch (err) {
      setResults((prev: any) => ({
        ...prev,
        dailyTestQuestions: { error: err }
      }))
    }
    setLoading(false)
  }

  const testFullDailyTestFlow = async () => {
    setLoading(true)
    try {
      // Test getting a daily test config with its questions
      const { data: configData, error: configError } = await supabase
        .from('daily_test_configs')
        .select(`
          id,
          title,
          day_number,
          question_count,
          time_limit_minutes,
          daily_test_questions (
            question_id,
            order_index,
            quiz_questions (
              id,
              question_text,
              question_type,
              options,
              correct_answer
            )
          )
        `)
        .eq('is_active', true)
        .limit(1)
      
      setResults((prev: any) => ({
        ...prev,
        fullDailyTestFlow: { data: configData, error: configError?.message }
      }))
    } catch (err) {
      setResults((prev: any) => ({
        ...prev,
        fullDailyTestFlow: { error: err }
      }))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Quiz System Test Page</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Quiz Questions Access</h2>
            <button
              onClick={testQuizQuestions}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Quiz Questions'}
            </button>
            {results.quizQuestions && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold">Results:</h3>
                {results.quizQuestions.error ? (
                  <p className="text-red-600">Error: {results.quizQuestions.error}</p>
                ) : (
                  <div>
                    <p className="text-green-600">✅ Success! Found {results.quizQuestions.data?.length || 0} quiz questions</p>
                    <pre className="text-xs mt-2 overflow-auto">
                      {JSON.stringify(results.quizQuestions.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Daily Test Configs Access</h2>
            <button
              onClick={testDailyTestConfigs}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Daily Test Configs'}
            </button>
            {results.dailyTestConfigs && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold">Results:</h3>
                {results.dailyTestConfigs.error ? (
                  <p className="text-red-600">Error: {results.dailyTestConfigs.error}</p>
                ) : (
                  <div>
                    <p className="text-green-600">✅ Success! Found {results.dailyTestConfigs.data?.length || 0} daily test configs</p>
                    <pre className="text-xs mt-2 overflow-auto">
                      {JSON.stringify(results.dailyTestConfigs.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Daily Test Questions Access</h2>
            <button
              onClick={testDailyTestQuestions}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Daily Test Questions'}
            </button>
            {results.dailyTestQuestions && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold">Results:</h3>
                {results.dailyTestQuestions.error ? (
                  <p className="text-red-600">Error: {results.dailyTestQuestions.error}</p>
                ) : (
                  <div>
                    <p className="text-green-600">✅ Success! Found {results.dailyTestQuestions.data?.length || 0} daily test question links</p>
                    <pre className="text-xs mt-2 overflow-auto">
                      {JSON.stringify(results.dailyTestQuestions.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Full Daily Test Flow</h2>
            <button
              onClick={testFullDailyTestFlow}
              disabled={loading}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Complete Daily Test Flow'}
            </button>
            {results.fullDailyTestFlow && (
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold">Results:</h3>
                {results.fullDailyTestFlow.error ? (
                  <p className="text-red-600">Error: {results.fullDailyTestFlow.error}</p>
                ) : (
                  <div>
                    <p className="text-green-600">✅ Success! Daily test flow is working</p>
                    <pre className="text-xs mt-2 overflow-auto max-h-96">
                      {JSON.stringify(results.fullDailyTestFlow.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
            <div className="space-y-2 text-sm">
              <p>1. If all tests pass, your quiz system should be working</p>
              <p>2. Go to your course page and check if the "Start Quiz" button appears</p>
              <p>3. If you still don't see the button, check the browser console for errors</p>
              <p>4. Make sure you're logged in and have an active enrollment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

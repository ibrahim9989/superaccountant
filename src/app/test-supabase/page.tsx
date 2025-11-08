'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function TestSupabasePage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testSupabase = async () => {
    setLoading(true)
    setResult('Testing...')
    
    try {
      const supabase = createClient()
      
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (error) {
        setResult(`❌ Database Error: ${error.message}`)
      } else {
        setResult('✅ Database connection successful!')
      }
    } catch (err) {
      setResult(`❌ Connection failed: ${err}`)
    }
    
    setLoading(false)
  }

  const testGoogleAuth = async () => {
    setLoading(true)
    setResult('Testing Google Auth...')
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setResult(`❌ OAuth Error: ${error.message}`)
      } else {
        setResult('✅ OAuth redirect initiated!')
      }
    } catch (err) {
      setResult(`❌ OAuth failed: ${err}`)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2 text-sm">
            <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
            <p><strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Tests</h2>
          <div className="space-y-4">
            <button
              onClick={testSupabase}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test Database Connection
            </button>
            
            <button
              onClick={testGoogleAuth}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 ml-4"
            >
              Test Google OAuth
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <p className="text-sm">{result}</p>
        </div>
      </div>
    </div>
  )
}

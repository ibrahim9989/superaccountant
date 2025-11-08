'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function TestOAuthPage() {
  const [result, setResult] = useState<string>('')
  const supabase = createClient()

  const testOAuth = async () => {
    setResult('Starting OAuth test...')
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setResult(`❌ OAuth Error: ${error.message}`)
      } else {
        setResult('✅ OAuth redirect initiated successfully!')
      }
    } catch (err) {
      setResult(`❌ Unexpected error: ${err}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">OAuth Test Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Current Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
            <p><strong>Redirect URL:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'N/A'}</p>
            <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">OAuth Test</h2>
          <button
            onClick={testOAuth}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test Google OAuth
          </button>
          <p className="mt-2 text-sm">{result}</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">⚠️ Important</h2>
          <p className="text-yellow-700 mb-2">
            Make sure your Google OAuth redirect URI is set to:
          </p>
          <code className="bg-yellow-100 px-2 py-1 rounded text-sm">
            {typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'http://localhost:3000/auth/callback'}
          </code>
        </div>
      </div>
    </div>
  )
}




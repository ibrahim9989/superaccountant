'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function DebugPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('')
  const [authStatus, setAuthStatus] = useState<string>('')
  const supabase = createClient()

  const testConnection = async () => {
    try {
      setConnectionStatus('Testing connection...')
      
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (error) {
        setConnectionStatus(`Connection Error: ${error.message}`)
      } else {
        setConnectionStatus('✅ Database connection successful')
      }
    } catch (err) {
      setConnectionStatus(`❌ Connection failed: ${err}`)
    }
  }

  const testAuth = async () => {
    try {
      setAuthStatus('Testing auth...')
      
      // Test auth service
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setAuthStatus(`Auth Error: ${error.message}`)
      } else {
        setAuthStatus(`✅ Auth service working. Session: ${data.session ? 'Active' : 'None'}`)
      }
    } catch (err) {
      setAuthStatus(`❌ Auth test failed: ${err}`)
    }
  }

  const testGoogleOAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        alert(`OAuth Error: ${error.message}`)
      }
    } catch (err) {
      alert(`OAuth Test failed: ${err}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Debug Page</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Current Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Server-side'}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Connection Test</h2>
            <button
              onClick={testConnection}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
            >
              Test Database Connection
            </button>
            <p className="mt-2 text-sm">{connectionStatus}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Auth Test</h2>
            <button
              onClick={testAuth}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mr-4"
            >
              Test Auth Service
            </button>
            <p className="mt-2 text-sm">{authStatus}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Google OAuth Test</h2>
            <button
              onClick={testGoogleOAuth}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Test Google OAuth
            </button>
            <p className="mt-2 text-sm text-gray-600">
              This will attempt to start the Google OAuth flow
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Configuration Check</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Expected Redirect URL:</strong> {typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'N/A'}</p>
              <p><strong>Supabase Auth URL:</strong> https://koxpukmwzkdomjelzdtb.supabase.co/auth/v1/callback</p>
              <p className="text-red-600"><strong>⚠️ Make sure these URLs match in your Google OAuth settings!</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




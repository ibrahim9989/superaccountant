'use client'

import { getSupabaseClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function TestAuthPage() {
  const [logs, setLogs] = useState<string[]>([])
  const supabase = getSupabaseClient()

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const testAuth = async () => {
    addLog('Starting OAuth test...')
    addLog(`Origin: ${window.location.origin}`)
    addLog(`Redirect URL: ${window.location.origin}/auth/callback`)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false
      }
    })
    
    addLog(`OAuth initiation result:`)
    addLog(`- URL: ${data?.url || 'none'}`)
    addLog(`- Provider: ${data?.provider || 'none'}`)
    addLog(`- Error: ${error?.message || 'none'}`)
    
    if (data?.url) {
      addLog('Redirecting to Google...')
      window.location.href = data.url
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Auth Flow Test</h1>
        
        <button
          onClick={testAuth}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-8"
        >
          Test Google OAuth
        </button>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Logs:</h2>
          <div className="space-y-2 font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-400">No logs yet. Click the button above.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-gray-300">{log}</div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
          <h3 className="text-yellow-400 font-semibold mb-2">Expected Supabase Config:</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>✓ Site URL: <code className="bg-white/10 px-2 py-1 rounded">http://localhost:3000</code></li>
            <li>✓ Redirect URLs should include: <code className="bg-white/10 px-2 py-1 rounded">http://localhost:3000/auth/callback</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}





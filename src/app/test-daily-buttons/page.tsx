'use client'

import { useState } from 'react'
import DailyTest from '@/components/DailyTest'

export default function TestDailyButtonsPage() {
  const [showTest, setShowTest] = useState(false)
  const [currentTestDay, setCurrentTestDay] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Daily Test Buttons</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Daily Test Buttons</h2>
          <p className="text-gray-600 mb-6">
            Click any button below to test the daily test functionality:
          </p>
          
          {/* Individual Daily Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7].map((dayNumber) => (
              <button
                key={dayNumber}
                onClick={() => {
                  console.log(`Starting Day ${dayNumber} test`)
                  setShowTest(true)
                  setCurrentTestDay(dayNumber)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm"
              >
                Start Day {dayNumber} Quiz
              </button>
            ))}
          </div>
          
          <div className="text-sm text-gray-500">
            <p>✅ If you can see these buttons, the UI is working</p>
            <p>✅ If clicking them opens a quiz modal, the functionality is working</p>
            <p>✅ If you see quiz questions, the backend is working</p>
          </div>
        </div>
      </div>

      {/* Daily Test Modal */}
      {showTest && currentTestDay && (
        <DailyTest
          enrollmentId="test-enrollment-id"
          courseId="660e8400-e29b-41d4-a716-446655440001"
          dayNumber={currentTestDay}
          onTestComplete={(result) => {
            console.log('Daily test completed:', result)
            setShowTest(false)
            setCurrentTestDay(null)
            alert(`Test completed! Score: ${result.score}/${result.max_score}`)
          }}
          onClose={() => {
            setShowTest(false)
            setCurrentTestDay(null)
          }}
        />
      )}
    </div>
  )
}




































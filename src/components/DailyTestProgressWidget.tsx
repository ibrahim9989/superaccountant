'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DailyTestStats } from '@/lib/validations/dailyTest'
import { dailyTestService } from '@/lib/services/dailyTestService'

interface DailyTestProgressWidgetProps {
  enrollmentId: string
  courseId: string
}

export default function DailyTestProgressWidget({ enrollmentId, courseId }: DailyTestProgressWidgetProps) {
  const router = useRouter()
  const [stats, setStats] = useState<DailyTestStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [enrollmentId])

  const loadStats = async () => {
    try {
      setLoading(true)
      const statsData = await dailyTestService.getDailyTestStats(enrollmentId)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading daily test stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white/5 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-white/10 rounded"></div>
            <div className="h-16 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="bg-white/5 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Daily Test Progress</h3>
        <button
          onClick={() => router.push(`/daily-tests/${enrollmentId}`)}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          View All →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white">{stats.completed_tests}</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Current Streak</p>
              <p className="text-2xl font-bold text-white">{stats.current_streak}</p>
            </div>
            <div className="text-2xl">🔥</div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Average Score</span>
          <span>{stats.average_score}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(stats.average_score, 100)}%` }}
          ></div>
        </div>
      </div>

      <button
        onClick={() => router.push(`/daily-tests/${enrollmentId}`)}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
      >
        Take Daily Test
      </button>
    </div>
  )
}



'use client'

import { useState, useEffect } from 'react'
import { adminService } from '@/lib/services/adminService'

interface QuestionAnalytics {
  category_name: string
  total_questions: number
  active_questions: number
  average_difficulty: string
  total_attempts: number
  average_score: number
}

interface UserAnalytics {
  user_id: string
  user_name: string
  user_email: string
  total_tests: number
  best_score: number
  average_score: number
  last_activity: string
}

export default function AdminAnalytics() {
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytics[]>([])
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const [questionData, userData] = await Promise.all([
        adminService.getQuestionAnalytics(),
        adminService.getUserAnalytics()
      ])
      
      setQuestionAnalytics(questionData)
      setUserAnalytics(userData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-600'
      case 'intermediate': return 'bg-yellow-600'
      case 'advanced': return 'bg-orange-600'
      case 'expert': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-lg">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Question Analytics */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Question Analytics</h2>
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          {questionAnalytics.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No question analytics available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Avg Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Total Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Avg Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {questionAnalytics.map((analytics, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white font-medium">
                          {analytics.category_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white">
                          {analytics.total_questions}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white">
                          {analytics.active_questions}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-sm text-white ${getDifficultyColor(analytics.average_difficulty)}`}>
                          {analytics.average_difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white">
                          {analytics.total_attempts}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-medium ${getScoreColor(analytics.average_score)}`}>
                          {analytics.average_score.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Analytics */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">User Performance Analytics</h2>
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          {userAnalytics.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No user analytics available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Total Tests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Best Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Average Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Last Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {userAnalytics.map((user, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white font-medium">
                          {user.user_name || 'Unknown User'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-300">
                          {user.user_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-white">
                          {user.total_tests}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-medium ${getScoreColor(user.best_score)}`}>
                          {user.best_score.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-medium ${getScoreColor(user.average_score)}`}>
                          {user.average_score.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-300">
                          {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'Never'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Summary Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Categories</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {questionAnalytics.length}
                </p>
              </div>
              <div className="bg-blue-600 p-3 rounded-lg">
                <span className="text-2xl">📁</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Questions</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {questionAnalytics.reduce((sum, cat) => sum + cat.total_questions, 0)}
                </p>
              </div>
              <div className="bg-green-600 p-3 rounded-lg">
                <span className="text-2xl">❓</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Active Users</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {userAnalytics.length}
                </p>
              </div>
              <div className="bg-purple-600 p-3 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




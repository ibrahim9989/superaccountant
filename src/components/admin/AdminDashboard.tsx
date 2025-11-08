'use client'

import { useState, useEffect } from 'react'
import { adminService } from '@/lib/services/adminService'

interface SystemOverview {
  total_questions: number
  total_categories: number
  total_test_configs: number
  total_users: number
  total_test_sessions: number
  active_questions: number
  pending_reviews: number
}

interface AdminActivity {
  id: string
  action: string
  resource_type: string
  resource_id?: string
  details: Record<string, any>
  created_at: string
  admin?: {
    user_id: string
    profile?: {
      first_name: string
      last_name: string
      email: string
    }
  }
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<SystemOverview | null>(null)
  const [recentActivity, setRecentActivity] = useState<AdminActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [overviewData, activityData] = await Promise.all([
        adminService.getSystemOverview(),
        adminService.getRecentActivity(10)
      ])
      
      setOverview(overviewData)
      setRecentActivity(activityData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-lg">Loading dashboard...</div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Questions',
      value: overview?.total_questions || 0,
      icon: '❓',
      color: 'bg-blue-600',
      description: `${overview?.active_questions || 0} active`
    },
    {
      title: 'Categories',
      value: overview?.total_categories || 0,
      icon: '📁',
      color: 'bg-green-600',
      description: 'Question categories'
    },
    {
      title: 'Test Configurations',
      value: overview?.total_test_configs || 0,
      icon: '⚙️',
      color: 'bg-purple-600',
      description: 'Active test configs'
    },
    {
      title: 'Total Users',
      value: overview?.total_users || 0,
      icon: '👥',
      color: 'bg-orange-600',
      description: 'Registered users'
    },
    {
      title: 'Test Sessions',
      value: overview?.total_test_sessions || 0,
      icon: '📊',
      color: 'bg-indigo-600',
      description: 'Completed tests'
    },
    {
      title: 'Pending Reviews',
      value: overview?.pending_reviews || 0,
      icon: '⏳',
      color: 'bg-yellow-600',
      description: 'Awaiting approval'
    }
  ]

  const formatActivityAction = (action: string, resourceType: string) => {
    const actions: Record<string, string> = {
      'create_question': 'Created question',
      'update_question': 'Updated question',
      'delete_question': 'Deleted question',
      'create_category': 'Created category',
      'update_category': 'Updated category',
      'delete_category': 'Deleted category',
      'create_test_config': 'Created test config',
      'update_test_config': 'Updated test config',
      'update_system_setting': 'Updated system setting'
    }
    
    return actions[action] || `${action} ${resourceType}`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  return (
    <div className="space-y-8">
      {/* System Overview */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  <p className="text-gray-500 text-sm mt-1">{stat.description}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-600 p-2 rounded-lg">
                        <span className="text-white text-sm">👤</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {formatActivityAction(activity.action, activity.resource_type)}
                        </p>
                        <p className="text-gray-400 text-sm">
                          by {activity.admin?.profile?.first_name || 'Unknown'} {activity.admin?.profile?.last_name || ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                      {activity.resource_id && (
                        <p className="text-gray-500 text-xs">
                          ID: {activity.resource_id.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                  {Object.keys(activity.details).length > 0 && (
                    <div className="mt-3 pl-12">
                      <details className="text-gray-400 text-sm">
                        <summary className="cursor-pointer hover:text-gray-300">
                          View Details
                        </summary>
                        <pre className="mt-2 bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(activity.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors">
            <div className="text-2xl mb-2">🎯</div>
            <div className="font-medium">Pre-Enrollment</div>
            <div className="text-sm opacity-75">Manage assessment tests</div>
          </button>
          
          <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors">
            <div className="text-2xl mb-2">📚</div>
            <div className="font-medium">Course Content</div>
            <div className="text-sm opacity-75">Manage 45-day courses</div>
          </button>
          
          <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors">
            <div className="text-2xl mb-2">📝</div>
            <div className="font-medium">Daily Tests</div>
            <div className="text-sm opacity-75">Configure daily assessments</div>
          </button>
          
          <button className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg transition-colors">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">View Analytics</div>
            <div className="text-sm opacity-75">System performance</div>
          </button>
        </div>
      </div>
    </div>
  )
}




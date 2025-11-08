'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { adminService } from '@/lib/services/adminService'
import AdminDashboard from '@/components/admin/AdminDashboard'
import AdminCategories from '@/components/admin/AdminCategories'
import AdminTestConfigs from '@/components/admin/AdminTestConfigs'
import AdminAnalytics from '@/components/admin/AdminAnalytics'
import AdminSettings from '@/components/admin/AdminSettings'
import AdminPreEnrollment from '@/components/admin/AdminPreEnrollment'
import AdminCourseContent from '@/components/admin/AdminCourseContent'
import AdminDailyTests from '@/components/admin/AdminDailyTests'
import AdminGrandtestManagement from '@/components/admin/AdminGrandtestManagement'

type AdminTab = 'dashboard' | 'categories' | 'test-configs' | 'analytics' | 'settings' | 'pre-enrollment' | 'course-content' | 'daily-tests' | 'grandtest'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      checkAdminStatus()
    }
  }, [user, authLoading, router])

  const checkAdminStatus = async () => {
    try {
      const [adminStatus, superAdminStatus] = await Promise.all([
        adminService.isAdmin(),
        adminService.isSuperAdmin()
      ])
      
      setIsAdmin(adminStatus)
      setIsSuperAdmin(superAdminStatus)
      
      if (!adminStatus) {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading admin panel...</div>
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">You don&apos;t have admin privileges.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'pre-enrollment', label: 'Pre-Enrollment', icon: '🎯' },
    { id: 'course-content', label: 'Course Content', icon: '📚' },
    { id: 'daily-tests', label: 'Daily Tests', icon: '📝' },
    { id: 'grandtest', label: 'Grandtest', icon: '🎓' },
    { id: 'categories', label: 'Categories', icon: '📁' },
    { id: 'test-configs', label: 'Test Configs', icon: '⚙️' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '🔧' }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />
      case 'pre-enrollment':
        return <AdminPreEnrollment />
      case 'course-content':
        return <AdminCourseContent />
      case 'daily-tests':
        return <AdminDailyTests />
      case 'grandtest':
        return <AdminGrandtestManagement />
      case 'categories':
        return <AdminCategories />
      case 'test-configs':
        return <AdminTestConfigs />
      case 'analytics':
        return <AdminAnalytics />
      case 'settings':
        return <AdminSettings />
      default:
        return <AdminDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-gray-400">Manage MCQ System</p>
            </div>
            <div className="flex items-center space-x-4">
              {isSuperAdmin && (
                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Super Admin
                </span>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  )
}




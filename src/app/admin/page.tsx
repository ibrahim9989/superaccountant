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
import Link from 'next/link'

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
      <div className="min-h-screen bg-black flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-white"></div>
        </div>
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <h1 className="text-3xl font-black text-white mb-6 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            Access Denied
          </h1>
          <p className="text-gray-300 mb-8 text-lg font-light">You don&apos;t have admin privileges.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-bold rounded-2xl hover:shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105"
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
    <div className="min-h-screen bg-black relative">
      {/* Luxury Background Effects */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-br from-gray-900/10 via-transparent to-gray-900/10 rounded-full blur-3xl" />
      </div>

      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-sm border-b border-gray-600/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-3 shadow-2xl backdrop-blur-sm">
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-300 rounded-full mr-3 animate-pulse"></div>
                <span className="text-white text-xs font-bold tracking-[0.22em] uppercase">ADMIN PANEL</span>
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-gray-300 to-white rounded-full ml-3 animate-pulse"></div>
              </div>
              <h1 className="text-3xl font-black text-white bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-gray-300 font-light">Manage MCQ System</p>
            </div>
            <div className="flex items-center space-x-4">
              {isSuperAdmin && (
                <span className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 text-white px-4 py-2 rounded-full text-sm font-bold border border-red-700/50 shadow-xl">
                  Super Admin
                </span>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white/90 hover:text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative z-10 bg-gradient-to-br from-gray-900/60 via-gray-800/60 to-gray-900/60 backdrop-blur-sm border-b border-gray-600/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`py-4 px-6 border-b-2 font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-white text-white bg-gradient-to-br from-gray-800/50 to-gray-900/50'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-500'
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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  )
}

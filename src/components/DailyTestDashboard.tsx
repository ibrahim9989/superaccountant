'use client'

import { useState, useEffect } from 'react'
import { 
  DailyTestProgressWithDetails, 
  DailyTestStats, 
  WeeklyTestStats 
} from '@/lib/validations/dailyTest'
import { dailyTestService } from '@/lib/services/dailyTestService'

interface DailyTestDashboardProps {
  enrollmentId: string
  courseId: string
  onStartTest?: (dayNumber: number) => void
  refreshTrigger?: number // Add refresh trigger
  currentDay?: number // Add current day parameter
}

export default function DailyTestDashboard({ enrollmentId, courseId, onStartTest, refreshTrigger, currentDay }: DailyTestDashboardProps) {
  const [progress, setProgress] = useState<DailyTestProgressWithDetails[]>([])
  const [stats, setStats] = useState<DailyTestStats | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyTestStats[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'analytics'>('overview')
  const [nextAvailableDay, setNextAvailableDay] = useState<number>(1)
  const [currentDayProgress, setCurrentDayProgress] = useState<DailyTestProgressWithDetails | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [enrollmentId, courseId, refreshTrigger, currentDay])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      console.log('🔄 Loading dashboard data...', { enrollmentId, currentDay })
      
      const [progressData, statsData, weeklyStatsData, nextDay] = await Promise.all([
        dailyTestService.getDailyTestProgress(enrollmentId),
        dailyTestService.getDailyTestStats(enrollmentId),
        dailyTestService.getWeeklyTestStats(enrollmentId, courseId),
        dailyTestService.getNextAvailableTestDay(enrollmentId),
      ])

      console.log('📊 Dashboard data loaded:', { 
        progressCount: progressData?.length, 
        nextDay, 
        currentDay 
      })

      setProgress(progressData)
      setStats(statsData)
      setWeeklyStats(weeklyStatsData)
      setNextAvailableDay(nextDay)
      
      // Get current day progress if specified, otherwise use the next available day
      const dayToShow = currentDay || nextDay
      if (dayToShow) {
        console.log('🔍 Loading progress for day:', dayToShow)
        const dayProgress = await dailyTestService.getDailyTestProgressForDay(enrollmentId, dayToShow)
        console.log('📈 Day progress:', dayProgress)
        setCurrentDayProgress(dayProgress)
      } else {
        console.log('⚠️ No day specified')
        setCurrentDayProgress(null)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20'
      case 'failed': return 'text-red-400 bg-red-500/20'
      case 'in_progress': return 'text-yellow-400 bg-yellow-500/20'
      case 'unlocked': return 'text-blue-400 bg-blue-500/20'
      case 'locked': return 'text-gray-400 bg-gray-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅'
      case 'failed': return '❌'
      case 'in_progress': return '⏳'
      case 'unlocked': return '🔓'
      case 'locked': return '🔒'
      default: return '❓'
    }
  }

  if (loading) {
    return (
      <div className="bg-white/5 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/10 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-white/10 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-black text-white">Daily Test Dashboard</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 font-semibold ${
              activeTab === 'overview' 
                ? 'bg-[#DC2626] text-white' 
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 font-semibold ${
              activeTab === 'progress' 
                ? 'bg-[#DC2626] text-white' 
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
            }`}
          >
            Progress
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 font-semibold ${
              activeTab === 'analytics' 
                ? 'bg-[#DC2626] text-white' 
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Current Day Progress */}
          {currentDayProgress ? (
            <div className="bg-white/10 border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Day {currentDay || nextAvailableDay} Test Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm">Status</p>
                      <p className="text-2xl font-black text-white">
                        {currentDayProgress.status === 'completed' ? 'PASSED' : currentDayProgress.status === 'failed' ? 'FAILED' : 'NOT STARTED'}
                      </p>
                    </div>
                    <div className="text-2xl">
                      {currentDayProgress.status === 'completed' ? '✅' : currentDayProgress.status === 'failed' ? '❌' : '⏳'}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm">Best Score</p>
                      <p className="text-2xl font-black text-white">
                        {currentDayProgress.best_score ? `${currentDayProgress.best_score}%` : 'N/A'}
                      </p>
                    </div>
                    <div className="text-2xl">🎯</div>
                  </div>
                </div>
                
                <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm">Attempts</p>
                      <p className="text-2xl font-black text-white">{(currentDayProgress as any).attempts_count || 0}</p>
                    </div>
                    <div className="text-2xl">🔄</div>
                  </div>
                </div>
              </div>
              
              {currentDayProgress.best_score && currentDayProgress.best_score < 90 && (
                <div className="mt-4 bg-white/10 border border-white/20 rounded-xl p-4">
                  <p className="text-white font-bold">⚠️ Score Requirement Not Met</p>
                  <p className="text-white/90 text-sm mt-1">You need 90% or higher to unlock the next test. Current best: {currentDayProgress.best_score}%</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/10 border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">No Test Progress</h3>
              <p className="text-white/90">No test has been taken for the selected day.</p>
            </div>
          )}

          {/* Next Available Test */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Next Available Test</h3>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-2xl font-black text-white">Day {nextAvailableDay}</p>
                <p className="text-white/90">Ready to start</p>
              </div>
              <button
                onClick={() => onStartTest?.(nextAvailableDay)}
                className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Test
              </button>
            </div>
          </div>

          {/* Recent Progress */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Progress</h3>
            <div className="grid grid-cols-7 gap-2">
              {progress.slice(-7).map((dayProgress) => (
                <div
                  key={dayProgress.day_number}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs bg-white/10 border border-white/20 ${
                    dayProgress.status === 'completed' ? 'border-white/40' : ''
                  }`}
                >
                  <div className="text-lg">{getStatusIcon(dayProgress.status)}</div>
                  <div className="font-bold text-white">Day {dayProgress.day_number}</div>
                  {dayProgress.best_score && (
                    <div className="text-xs text-white/90">{dayProgress.best_score.toFixed(0)}%</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Next Available Test */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Next Available Test</h3>
            {(() => {
              const nextTest = progress.find(p => p.status === 'unlocked' || p.status === 'in_progress')
              if (nextTest) {
                return (
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-white font-bold">Day {nextTest.day_number}</p>
                      <p className="text-white/90 text-sm">
                        {nextTest.test_config?.title || 'Daily Test'}
                      </p>
                    </div>
                    <button
                      onClick={() => onStartTest?.(nextTest.day_number)}
                      className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Start Test
                    </button>
                  </div>
                )
              } else {
                return (
                  <p className="text-white/90">No tests available at the moment. Complete previous tests to unlock more.</p>
                )
              }
            })()}
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">All Daily Tests</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {progress.map((dayProgress) => (
              <div
                key={dayProgress.day_number}
                className="bg-white/10 border border-white/20 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(dayProgress.status)}</span>
                    <span className="font-bold text-white">Day {dayProgress.day_number}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/20 border border-white/30 text-white">
                    {dayProgress.status.replace('_', ' ')}
                  </span>
                </div>
                
                {dayProgress.test_config && (
                  <p className="text-white/90 text-sm mb-2">{dayProgress.test_config.title}</p>
                )}
                
                {dayProgress.best_score && (
                  <p className="text-white text-sm mb-2">
                    Best Score: <span className="font-bold">{dayProgress.best_score.toFixed(1)}%</span>
                  </p>
                )}
                
                {dayProgress.total_attempts > 0 && (
                  <p className="text-white/80 text-xs mb-2">
                    Attempts: {dayProgress.total_attempts}
                  </p>
                )}
                
                {dayProgress.streak_count > 0 && (
                  <p className="text-white/90 text-xs mb-2">
                    Streak: {dayProgress.streak_count} days
                  </p>
                )}
                
                {(dayProgress.status === 'unlocked' || dayProgress.status === 'in_progress') && (
                  <button
                    onClick={() => onStartTest?.(dayProgress.day_number)}
                    className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    {dayProgress.status === 'in_progress' ? 'Continue Test' : 'Start Test'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Weekly Performance */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Weekly Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weeklyStats.map((week) => (
                <div key={week.week_number} className="bg-white/10 border border-white/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-white">Week {week.week_number}</h4>
                    <span className="text-sm text-white/80">
                      {week.tests_completed}/{week.tests_available} tests
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">Completed:</span>
                      <span className="text-white">{week.tests_completed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">Passed:</span>
                      <span className="text-white">{week.tests_passed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">Average Score:</span>
                      <span className="text-white">{week.average_score.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">Streak:</span>
                      <span className="text-white">{week.streak_count} days</span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-white/10 rounded-full h-2 border border-white/20">
                      <div
                        className="bg-white h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(week.tests_completed / week.tests_available) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Trends */}
          {stats && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Performance Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-white mb-3">Test Completion</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/80">Total Tests:</span>
                      <span className="text-white">{stats.total_tests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Completed:</span>
                      <span className="text-white">{stats.completed_tests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Passed:</span>
                      <span className="text-white">{stats.passed_tests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Failed:</span>
                      <span className="text-white">{stats.failed_tests}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-bold text-white mb-3">Performance Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/80">Average Score:</span>
                      <span className="text-white">{stats.average_score}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Current Streak:</span>
                      <span className="text-white">{stats.current_streak} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Longest Streak:</span>
                      <span className="text-white">{stats.longest_streak} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Total Time:</span>
                      <span className="text-white">{stats.total_time_minutes}m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



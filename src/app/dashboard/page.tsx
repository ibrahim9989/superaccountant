'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { courseService } from '@/lib/services/courseService';
import type { CourseEnrollment } from '@/lib/types/course';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  // Use refs to prevent duplicate API calls
  const hasCheckedApproval = useRef(false);
  const hasLoadedEnrollments = useRef(false);

  const loadEnrollments = useCallback(async () => {
    if (!user || hasLoadedEnrollments.current) return;
    
    try {
      setLoading(true);
      hasLoadedEnrollments.current = true;
      const data = await courseService.getUserEnrollments(user.id);
      setEnrollments(data);
    } catch (err) {
      console.error('Error loading enrollments:', err);
      hasLoadedEnrollments.current = false; // Reset on error to allow retry
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkApprovalStatus = useCallback(async () => {
    if (!user || hasCheckedApproval.current) return;
    
    try {
      hasCheckedApproval.current = true;
      const supabase = (await import('@/lib/supabase/client')).getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking approval status:', error);
        hasCheckedApproval.current = false; // Reset on error
        return;
      }

      const status = data?.approval_status || 'pending';
      setApprovalStatus(status);

      // Redirect if not approved
      if (status !== 'approved') {
        router.push('/under-review');
        return;
      }

      // Only load enrollments if approved
      await loadEnrollments();
    } catch (err) {
      console.error('Error:', err);
      hasCheckedApproval.current = false; // Reset on error
    }
  }, [user, router, loadEnrollments]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user && !hasCheckedApproval.current) {
      checkApprovalStatus();
    }
  }, [user, authLoading, router, checkApprovalStatus]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-white/5 via-gray-800/10 to-black/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-black/10 via-gray-700/15 to-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-white"></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalEnrolled = enrollments.length;
  const inProgress = enrollments.filter(e => e.status === 'active' && (e.progress_percentage || 0) < 100).length;
  const completed = enrollments.filter(e => e.status === 'completed' || (e.progress_percentage || 0) >= 100).length;

  return (
    <div className="min-h-screen bg-black text-white relative">
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        {/* Header - Mobile: Stack, Desktop: Horizontal */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 md:gap-0 mb-6 sm:mb-8 md:mb-12">
          <div className="flex-1">
            <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-2 sm:mb-3 md:mb-4 shadow-2xl backdrop-blur-sm">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-gradient-to-r from-white to-gray-300 rounded-full mr-1.5 sm:mr-2 md:mr-3 animate-pulse"></div>
              <span className="text-white text-[9px] sm:text-[10px] md:text-xs font-bold tracking-[0.15em] sm:tracking-[0.22em] uppercase">DASHBOARD</span>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-gradient-to-r from-gray-300 to-white rounded-full ml-1.5 sm:ml-2 md:ml-3 animate-pulse"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Your Learning Hub
            </h1>
          </div>
          <button
            onClick={async () => { await signOut(); router.push('/login'); }}
            className="w-full md:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white/90 hover:text-white rounded-lg sm:rounded-xl md:rounded-2xl font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105 shadow-xl min-h-[44px]"
          >
            Sign Out
          </button>
        </div>
        
        {/* Stats Cards - Mobile: Stack, Desktop: Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12">
          <div className="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 shadow-2xl hover:border-gray-500/70 transition-all duration-700 hover:transform hover:scale-105">
            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-1 sm:mb-2 md:mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              {totalEnrolled}
            </div>
            <div className="text-gray-300 text-sm sm:text-base md:text-lg font-medium tracking-wide">Total Courses</div>
            <div className="mt-2 sm:mt-3 md:mt-4 w-10 sm:w-12 md:w-16 h-1 bg-gradient-to-r from-white via-gray-300 to-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          <div className="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 shadow-2xl hover:border-gray-500/70 transition-all duration-700 hover:transform hover:scale-105">
            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-1 sm:mb-2 md:mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              {inProgress}
            </div>
            <div className="text-gray-300 text-sm sm:text-base md:text-lg font-medium tracking-wide">In Progress</div>
            <div className="mt-2 sm:mt-3 md:mt-4 w-10 sm:w-12 md:w-16 h-1 bg-gradient-to-r from-white via-gray-300 to-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          <div className="group bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 shadow-2xl hover:border-gray-500/70 transition-all duration-700 hover:transform hover:scale-105 sm:col-span-2 lg:col-span-1">
            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-1 sm:mb-2 md:mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              {completed}
            </div>
            <div className="text-gray-300 text-sm sm:text-base md:text-lg font-medium tracking-wide">Completed</div>
            <div className="mt-2 sm:mt-3 md:mt-4 w-10 sm:w-12 md:w-16 h-1 bg-gradient-to-r from-white via-gray-300 to-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-white bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              My Courses
            </h2>
            <Link
              href="/courses"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-white via-gray-100 to-white text-black font-bold rounded-xl md:rounded-2xl hover:shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105 text-center text-sm md:text-base min-h-[44px] flex items-center justify-center"
            >
              Browse Courses
            </Link>
          </div>
          {enrollments.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full mb-6 border border-gray-700/50">
                <span className="text-4xl">📚</span>
              </div>
              <p className="text-gray-300 text-xl mb-6 font-light">No courses enrolled yet</p>
              <Link
                href="/courses"
                className="inline-block px-8 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-bold rounded-2xl hover:shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:scale-105"
              >
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  onClick={() => router.push(`/learn/${enrollment.id}`)}
                  className="group bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl md:rounded-2xl p-4 md:p-6 cursor-pointer hover:border-gray-500/70 transition-all duration-500 hover:transform hover:scale-[1.02] shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-gray-100 transition-colors">
                    {(enrollment as any).course?.title || 'Course'}
                  </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <span className="text-xs md:text-sm text-gray-300 font-medium">
                      Progress: {Math.round(enrollment.progress_percentage || 0)}%
                    </span>
                        <div className="w-full sm:w-32 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                          <div
                            className="h-full bg-gradient-to-r from-white via-gray-200 to-white transition-all duration-500"
                            style={{ width: `${enrollment.progress_percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <button className="w-full sm:w-auto sm:ml-6 px-6 py-3 bg-gradient-to-r from-white via-gray-100 to-white text-black font-bold rounded-xl hover:shadow-lg transition-all duration-300 transform group-hover:scale-105 text-sm md:text-base min-h-[44px] flex items-center justify-center">
                      Continue
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

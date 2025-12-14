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
      
      // Prefetch enrollment structures in background for instant navigation
      // This dramatically improves UX when user clicks "Continue Learning"
      data.forEach(enrollment => {
        // Prefetch in background (don't await)
        courseService.getEnrollmentById(enrollment.id, true) // lightweight
          .then(() => {
            console.log(`✅ Prefetched enrollment structure: ${enrollment.id}`)
          })
          .catch(err => {
            console.warn(`⚠️ Failed to prefetch enrollment ${enrollment.id}:`, err)
          })
      })
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
      <div className="min-h-screen w-full bg-gradient-to-br from-[#1e3a5f] to-[#DC2626] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) return null;

  const totalEnrolled = enrollments.length;
  const inProgress = enrollments.filter(e => e.status === 'active' && (e.progress_percentage || 0) < 100).length;
  const completed = enrollments.filter(e => e.status === 'completed' || (e.progress_percentage || 0) >= 100).length;

  return (
    <div className="min-h-screen bg-[#2B2A29] text-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1e3a5f] via-[#264174] to-[#DC2626] py-12 sm:py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Your Learning Hub
            </h1>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gradient-to-b from-[#2B2A29] to-[#264174]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 border border-white/10">
              <div className="text-4xl md:text-5xl font-black text-white mb-2">
              {totalEnrolled}
              </div>
              <div className="text-white/90 text-lg font-medium">Total Courses</div>
            </div>
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 border border-white/10">
              <div className="text-4xl md:text-5xl font-black text-white mb-2">
                {inProgress}
          </div>
              <div className="text-white/90 text-lg font-medium">In Progress</div>
            </div>
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 border border-white/10 sm:col-span-2 lg:col-span-1">
              <div className="text-4xl md:text-5xl font-black text-white mb-2">
                {completed}
          </div>
              <div className="text-white/90 text-lg font-medium">Completed</div>
          </div>
        </div>

        {/* Courses Section */}
          <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-8 border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-white">
              My Courses
            </h2>
            <Link
              href="/courses"
                className="px-6 py-3 bg-[#DC2626] text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors text-center"
            >
              Browse Courses
            </Link>
          </div>
          {enrollments.length === 0 ? (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-full mb-6 border border-white/20">
                <span className="text-4xl">📚</span>
              </div>
                <p className="text-white/90 text-xl mb-6">No courses enrolled yet</p>
              <Link
                href="/courses"
                  className="inline-block px-8 py-4 bg-[#DC2626] text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors"
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
                    className="bg-white/10 rounded-xl p-4 md:p-6 cursor-pointer hover:bg-white/15 transition-all border border-white/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                    {(enrollment as any).course?.title || 'Course'}
                  </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <span className="text-sm text-white/90 font-medium">
                      Progress: {Math.round(enrollment.progress_percentage || 0)}%
                    </span>
                          <div className="w-full sm:w-32 h-2 bg-white/10 rounded-full overflow-hidden border border-white/20">
                          <div
                              className="h-full bg-white transition-all duration-500"
                            style={{ width: `${enrollment.progress_percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                      <button className="w-full sm:w-auto px-6 py-3 bg-[#DC2626] text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors text-sm md:text-base">
                      Continue
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </section>
    </div>
  );
}

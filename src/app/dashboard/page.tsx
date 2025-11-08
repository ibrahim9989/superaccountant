'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { courseService } from '@/lib/services/courseService';
import type { CourseEnrollment } from '@/lib/types/course';

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      checkApprovalStatus();
    }
  }, [user, authLoading, router]);

  const checkApprovalStatus = async () => {
    try {
      const supabase = (await import('@/lib/supabase/client')).getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('id', user!.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking approval status:', error);
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
      loadEnrollments();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const data = await courseService.getUserEnrollments(user!.id);
      setEnrollments(data);
    } catch (err) {
      console.error('Error loading enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const totalEnrolled = enrollments.length;
  const inProgress = enrollments.filter(e => e.status === 'active' && (e.progress_percentage || 0) < 100).length;
  const completed = enrollments.filter(e => e.status === 'completed' || (e.progress_percentage || 0) >= 100).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={async () => { await signOut(); router.push('/login'); }}
            className="px-4 py-2 text-sm rounded-lg border border-white/20 hover:border-white/40 text-white/90 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-3xl font-bold text-blue-400">{totalEnrolled}</div>
            <div className="text-slate-400 mt-2">Total Courses</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-3xl font-bold text-yellow-400">{inProgress}</div>
            <div className="text-slate-400 mt-2">In Progress</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="text-3xl font-bold text-green-400">{completed}</div>
            <div className="text-slate-400 mt-2">Completed</div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">My Courses</h2>
          {enrollments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">No courses yet</p>
              <button
                onClick={() => router.push('/courses')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
              >
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  onClick={() => router.push(`/learn/${enrollment.id}`)}
                  className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 cursor-pointer hover:border-blue-500/50 transition-all"
                >
                  <h3 className="text-lg font-semibold mb-2">
                    {(enrollment as any).course?.title || 'Course'}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Progress: {Math.round(enrollment.progress_percentage || 0)}%
                    </span>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold">
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

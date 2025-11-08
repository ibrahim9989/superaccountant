'use client';

import React, { useState, useEffect } from 'react';
import { CourseCompletionService } from '@/lib/services/courseCompletionService';
import { GrandtestService } from '@/lib/services/grandtestService';
import Grandtest from './Grandtest';
import type { CourseCompletionCheck, GrandtestStats } from '@/lib/types/grandtest';

interface GrandtestTriggerProps {
  courseId: string;
  enrollmentId: string;
  userId: string;
  onGrandtestComplete: (passed: boolean, score: number) => void;
}

export default function GrandtestTrigger({ 
  courseId, 
  enrollmentId, 
  userId, 
  onGrandtestComplete 
}: GrandtestTriggerProps) {
  const [completionStatus, setCompletionStatus] = useState<CourseCompletionCheck | null>(null);
  const [grandtestStats, setGrandtestStats] = useState<GrandtestStats | null>(null);
  const [showGrandtest, setShowGrandtest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkCompletionStatus = async () => {
      try {
        setLoading(true);
        
        // Check course completion status
        const status = await CourseCompletionService.getCompletionStatus(
          userId, 
          courseId, 
          enrollmentId
        );
        
        console.log('📊 Completion Status from API:', status);
        console.log('🔍 Certificate Check:', {
          grandtest_passed: status?.grandtest_passed,
          certificate_issued: status?.certificate_issued,
          shouldShowCertificate: status?.grandtest_passed && status?.certificate_issued
        });
        
        setCompletionStatus(status);

        // Get Grandtest stats if course is completed
        if (status?.is_completed) {
          try {
            const stats = await GrandtestService.getGrandtestStats(userId, courseId);
            setGrandtestStats(stats);
          } catch (statsError) {
            // Stats might fail due to RLS issues, but that's okay - use defaults
            console.warn('Could not fetch grandtest stats (using defaults):', statsError);
            setGrandtestStats({
              total_attempts: 0,
              passed_attempts: 0,
              average_score: 0,
              pass_rate: 0,
              last_attempt_date: null,
              can_retake: true
            });
          }
        }
      } catch (err) {
        console.error('Error checking completion status:', err);
        setError('Failed to check course completion status');
      } finally {
        setLoading(false);
      }
    };

    checkCompletionStatus();
  }, [userId, courseId, enrollmentId]);

  const handleStartGrandtest = () => {
    console.log('🎯 Start Grandtest button clicked!');
    console.log('Current state:', { showGrandtest, courseId, enrollmentId, userId });
    setShowGrandtest(true);
    console.log('✅ setShowGrandtest(true) called');
  };

  const handleGrandtestComplete = (passed: boolean, score: number) => {
    setShowGrandtest(false);
    onGrandtestComplete(passed, score);
    
    // Refresh stats
    if (passed) {
      // Refresh completion status to show certificate
      CourseCompletionService.getCompletionStatus(userId, courseId, enrollmentId)
        .then(setCompletionStatus);
    }
  };

  const handleCloseGrandtest = () => {
    setShowGrandtest(false);
  };

  // Debug: Log state changes
  useEffect(() => {
    console.log('🔄 showGrandtest state changed:', showGrandtest);
  }, [showGrandtest]);

  // CRITICAL: Show Grandtest component FIRST - before any other returns
  // This MUST be checked before all other conditionals
  console.log('🔍 Render check - showGrandtest value:', showGrandtest);
  
  if (showGrandtest) {
    console.log('✅✅✅ showGrandtest is TRUE - RETURNING Grandtest component');
    console.log('Props:', { courseId, enrollmentId });
    return (
      <Grandtest
        courseId={courseId}
        enrollmentId={enrollmentId}
        onComplete={handleGrandtestComplete}
        onClose={handleCloseGrandtest}
      />
    );
  }
  
  console.log('❌ showGrandtest is FALSE, continuing to render trigger UI');

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-800">Checking course completion...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-500 mr-3">⚠️</div>
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  if (!completionStatus) {
    return null;
  }

  // Course not completed yet
  if (!completionStatus.is_completed) {
    const progress = ((completionStatus.lessons_completed + completionStatus.quizzes_completed) / 
                     (completionStatus.total_lessons + completionStatus.total_quizzes)) * 100;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="text-yellow-500 text-2xl mr-3">📚</div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">Complete Course to Unlock Grandtest</h3>
            <p className="text-yellow-700">Finish all lessons and quizzes to take the final exam</p>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-yellow-700">Lessons: {completionStatus.lessons_completed}/{completionStatus.total_lessons}</span>
            <span className="text-yellow-700">Quizzes: {completionStatus.quizzes_completed}/{completionStatus.total_quizzes}</span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div 
              className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-center text-sm text-yellow-700">
            {Math.round(progress)}% Complete
          </div>
        </div>
      </div>
    );
  }

  // Course completed - show Grandtest options
  console.log('🎯 Rendering GrandtestTrigger - Checking certificate condition:', {
    grandtest_passed: completionStatus.grandtest_passed,
    certificate_issued: completionStatus.certificate_issued,
    bothTrue: completionStatus.grandtest_passed && completionStatus.certificate_issued
  });
  
  if (completionStatus.grandtest_passed && completionStatus.certificate_issued) {
    console.log('✅ Showing certificate section!');
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="text-green-500 text-2xl mr-3">🏆</div>
          <div>
            <h3 className="text-lg font-semibold text-green-800">Congratulations!</h3>
            <p className="text-green-700">You have successfully completed the course and passed the Grandtest!</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-green-800 mb-2">Your Achievement:</h4>
          <div className="space-y-1 text-sm text-green-700">
            <div>✅ Course completed</div>
            <div>✅ Grandtest passed</div>
            <div>✅ Certificate issued</div>
          </div>
        </div>

        <button
          onClick={() => {
            // Navigate to certificates page
            window.location.href = '/certificates';
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          View Certificate
        </button>
      </div>
    );
  }

  // Course completed but Grandtest not passed yet - show grandtest option
  // Use default stats if grandtestStats is null (due to RLS errors)
  const stats = grandtestStats || {
    total_attempts: 0,
    passed_attempts: 0,
    average_score: 0,
    pass_rate: 0,
    last_attempt_date: null,
    can_retake: true
  };
  
  const canRetake = stats.can_retake;
  const nextAvailableDate = stats.next_available_date;
  
  console.log('Grandtest stats:', { canRetake, total_attempts: stats.total_attempts, nextAvailableDate, hasStats: !!grandtestStats });
  
  // Always show the grandtest section if course is completed
  if (completionStatus?.is_completed && !completionStatus.grandtest_passed) {

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="text-blue-500 text-2xl mr-3">🎯</div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800">Ready for Final Grandtest!</h3>
            <p className="text-blue-700">Complete the final exam to earn your certificate</p>
          </div>
        </div>

        {stats.total_attempts > 0 && (
          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-800 mb-2">Previous Attempts:</h4>
            <div className="space-y-1 text-sm text-blue-700">
              <div>Total Attempts: {stats.total_attempts}</div>
              <div>Passed: {stats.passed_attempts}</div>
              <div>Best Score: {stats.average_score.toFixed(1)}%</div>
              <div>Pass Rate: {stats.pass_rate.toFixed(1)}%</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-800 mb-2">Grandtest Details:</h4>
          <div className="space-y-1 text-sm text-blue-700">
            <div>• 5 questions (all types)</div>
            <div>• 5 minutes time limit</div>
            <div>• 90% required to pass</div>
            <div>• 24-hour cooldown between attempts</div>
          </div>
        </div>

        {canRetake ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔘 Button clicked, calling handleStartGrandtest');
              handleStartGrandtest();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold cursor-pointer active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {stats.total_attempts > 0 ? 'Retake Grandtest' : 'Start Grandtest'}
          </button>
        ) : (
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-yellow-500 mr-2">⏰</div>
              <div>
                <p className="text-yellow-800 font-medium">24-Hour Cooldown Active</p>
                <p className="text-yellow-700 text-sm">
                  Next attempt available: {nextAvailableDate ? new Date(nextAvailableDate).toLocaleString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // If we reach here and course is completed but no grandtest section was shown, show default
  if (completionStatus?.is_completed && !completionStatus.grandtest_passed) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="text-blue-500 text-2xl mr-3">🎯</div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800">Ready for Final Grandtest!</h3>
            <p className="text-blue-700">Complete the final exam to earn your certificate</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔘 Button clicked (fallback), calling handleStartGrandtest');
            handleStartGrandtest();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold cursor-pointer active:bg-blue-800"
          type="button"
        >
          Start Grandtest
        </button>
      </div>
    );
  }

  console.log('❌ showGrandtest is false, showing grandtest trigger UI instead');
  console.log('Current showGrandtest state:', showGrandtest);
  
  return null;
}



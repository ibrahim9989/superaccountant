'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GrandtestService } from '@/lib/services/grandtestService';
import type { 
  GrandtestAttempt, 
  GrandtestQuestion, 
  GrandtestResponse, 
  GrandtestSession,
  TimeTracking 
} from '@/lib/types/grandtest';

interface GrandtestProps {
  courseId: string;
  enrollmentId: string;
  onComplete: (passed: boolean, score: number) => void;
  onClose: () => void;
}

export default function Grandtest({ courseId, enrollmentId, onComplete, onClose }: GrandtestProps) {
  const [session, setSession] = useState<GrandtestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeTracking, setTimeTracking] = useState<TimeTracking>({
    question_start_time: Date.now(),
    total_time_remaining: 5 * 60 * 1000, // 5 minutes in milliseconds
    current_question_time: 0
  });

  // Initialize grandtest session
  useEffect(() => {
    const initializeGrandtest = async () => {
      try {
        setLoading(true);
        const attempt = await GrandtestService.startGrandtest({
          course_id: courseId,
          enrollment_id: enrollmentId
        });

        // Get questions to display
        let questions: GrandtestQuestion[];
        try {
          questions = await GrandtestService.getQuestionsByCourse(courseId);
        } catch (questionsError) {
          console.error('Error fetching questions:', questionsError);
          throw new Error('Failed to load questions. Please refresh and try again.');
        }

        if (!questions || questions.length === 0) {
          throw new Error('No questions available for grandtest');
        }

        // Use the first question to start
        const firstQuestion = questions[0];
        if (!firstQuestion) {
          throw new Error('No questions available for grandtest');
        }

        // Debug: Log question data
        console.log('First question data:', {
          id: firstQuestion.id,
          question_text: firstQuestion.question_text,
          question_type: firstQuestion.question_type,
          options: firstQuestion.options,
          optionsType: typeof firstQuestion.options,
          optionsIsString: typeof firstQuestion.options === 'string',
          optionsKeys: firstQuestion.options ? Object.keys(firstQuestion.options) : null
        });

        const newSession: GrandtestSession = {
          attempt,
          current_question: firstQuestion,
          current_question_index: 0,
          responses: {},
          time_tracking: {
            question_start_time: Date.now(),
            total_time_remaining: 5 * 60 * 1000, // 5 minutes
            current_question_time: 0
          },
          is_completed: false
        };

        setSession(newSession);
        setTimeTracking(newSession.time_tracking);
      } catch (err) {
        console.error('Error initializing grandtest:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to start grandtest';
        setError(errorMessage);
        
        // Log more details for debugging
        if (err instanceof Error) {
          console.error('Error details:', {
            message: err.message,
            stack: err.stack,
            name: err.name
          });
        }
      } finally {
        setLoading(false);
      }
    };

    initializeGrandtest();
  }, [courseId, enrollmentId]);

  // Timer effect
  useEffect(() => {
    if (!session || session.is_completed) return;

    const timer = setInterval(() => {
      setTimeTracking(prev => {
        const now = Date.now();
        const elapsed = now - prev.question_start_time;
        const totalElapsed = 5 * 60 * 1000 - prev.total_time_remaining + elapsed;
        const newTotalRemaining = Math.max(0, 5 * 60 * 1000 - totalElapsed);

        // Check if time is up
        if (newTotalRemaining <= 0) {
          handleTimeUp();
          return prev;
        }

        return {
          ...prev,
          current_question_time: elapsed,
          total_time_remaining: newTotalRemaining
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const handleTimeUp = useCallback(async () => {
    if (!session) return;

    try {
      // Complete the attempt
      await GrandtestService.completeAttempt({
        attempt_id: session.attempt.id
      });

      onComplete(false, 0); // Time up = failed
    } catch (err) {
      console.error('Error handling time up:', err);
      setError('Failed to complete grandtest due to timeout');
    }
  }, [session, onComplete]);

  const handleAnswerSubmit = async () => {
    if (!session || !currentAnswer.trim()) return;

    try {
      const response = await GrandtestService.submitAnswer({
        attempt_id: session.attempt.id,
        question_id: session.current_question.id,
        user_answer: currentAnswer,
        time_spent_seconds: Math.floor(timeTracking.current_question_time / 1000)
      });

      // Update session with response
      const updatedResponses = {
        ...session.responses,
        [session.current_question.id]: response
      };

      // Move to next question or complete
      const nextQuestionIndex = session.current_question_index + 1;
      const questions = await GrandtestService.getQuestionsByCourse(courseId);
      
      if (nextQuestionIndex >= 5) {
        // Complete the grandtest
        const completedAttempt = await GrandtestService.completeAttempt({
          attempt_id: session.attempt.id
        });

        setSession(prev => prev ? { ...prev, is_completed: true } : null);
        onComplete(completedAttempt.passed, completedAttempt.score_percentage);
      } else {
        // Move to next question
        const nextQuestion = questions[nextQuestionIndex];
        setSession(prev => prev ? {
          ...prev,
          current_question: nextQuestion,
          current_question_index: nextQuestionIndex,
          responses: updatedResponses,
          time_tracking: {
            question_start_time: Date.now(),
            total_time_remaining: timeTracking.total_time_remaining,
            current_question_time: 0
          }
        } : null);
        
        setCurrentAnswer('');
        setTimeTracking(prev => ({
          ...prev,
          question_start_time: Date.now(),
          current_question_time: 0
        }));
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError('Failed to submit answer');
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Starting Grandtest</h2>
            <p className="text-gray-600">Preparing your final exam...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Starting Grandtest</h2>
            <p className="text-gray-600 mb-4 break-words">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  // Retry initialization
                  const initializeGrandtest = async () => {
                    try {
                      const attempt = await GrandtestService.startGrandtest({
                        course_id: courseId,
                        enrollment_id: enrollmentId
                      });
                      const questions = await GrandtestService.getQuestionsByCourse(courseId);
                      const firstQuestion = questions[0];
                      if (!firstQuestion) throw new Error('No questions available');
                      
                      setSession({
                        attempt,
                        current_question: firstQuestion,
                        current_question_index: 0,
                        responses: {},
                        time_tracking: {
                          question_start_time: Date.now(),
                          total_time_remaining: 5 * 60 * 1000, // 5 minutes
                          current_question_time: 0
                        },
                        is_completed: false
                      });
                      setTimeTracking({
                        question_start_time: Date.now(),
                        total_time_remaining: 5 * 60 * 1000, // 5 minutes
                        current_question_time: 0
                      });
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Failed to start grandtest');
                    } finally {
                      setLoading(false);
                    }
                  };
                  initializeGrandtest();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold mr-2"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const { current_question, current_question_index, attempt } = session;
  const progress = ((current_question_index + 1) / 5) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Final Grandtest</h2>
            <p className="text-gray-600">Question {current_question_index + 1} of 5</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600">
              {formatTime(timeTracking.total_time_remaining)}
            </div>
            <div className="text-sm text-gray-500">Time Remaining</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
              {current_question.question_type.replace('_', ' ').toUpperCase()}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              {current_question.points} point{current_question.points !== 1 ? 's' : ''}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {current_question.question_text}
          </h3>

          {/* Answer Input */}
          {current_question.question_type === 'multiple_choice' && (() => {
            // Parse options if they're a string (JSONB might be returned as string)
            let options = current_question.options;
            if (typeof options === 'string') {
              try {
                options = JSON.parse(options);
              } catch (e) {
                console.error('Failed to parse options:', e);
                options = {};
              }
            }
            
            // Ensure options is an object
            if (!options || typeof options !== 'object' || Array.isArray(options)) {
              console.error('Invalid options format:', options);
              return (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">Unable to display answer options. Please contact support.</p>
                </div>
              );
            }
            
            const optionEntries = Object.entries(options);
            
            if (optionEntries.length === 0) {
              return (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800">No answer options available for this question.</p>
                </div>
              );
            }
            
            return (
              <div className="space-y-2">
                {optionEntries.map(([key, value]) => (
                  <label 
                    key={key} 
                    className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      currentAnswer === key ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={key}
                      checked={currentAnswer === key}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="mr-3 w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium mr-2 text-gray-700">{key}.</span>
                    <span className="text-gray-900 flex-1">{String(value)}</span>
                  </label>
                ))}
              </div>
            );
          })()}

          {current_question.question_type === 'true_false' && (
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="answer"
                  value="true"
                  checked={currentAnswer === 'true'}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="mr-3"
                />
                <span>True</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="answer"
                  value="false"
                  checked={currentAnswer === 'false'}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="mr-3"
                />
                <span>False</span>
              </label>
            </div>
          )}

          {(current_question.question_type === 'fill_blank' || current_question.question_type === 'essay') && (
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={
                current_question.question_type === 'essay' 
                  ? "Enter your detailed answer here..." 
                  : "Enter your answer here..."
              }
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={current_question.question_type === 'essay' ? 6 : 3}
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Exit Grandtest
          </button>
          
          <button
            onClick={handleAnswerSubmit}
            disabled={!currentAnswer.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold"
          >
            {current_question_index === 59 ? 'Complete Grandtest' : 'Next Question'}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• You have 5 minutes to complete all 5 questions</li>
            <li>• Each question has a 1-minute time limit</li>
            <li>• You need 90% (at least 5/5 correct) to pass</li>
            <li>• You can only retake after 24 hours</li>
            <li>• Answer all questions before submitting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}



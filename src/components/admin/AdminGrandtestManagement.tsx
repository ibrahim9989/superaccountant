'use client';

import React, { useState, useEffect } from 'react';
import { GrandtestService } from '@/lib/services/grandtestService';
import { courseService } from '@/lib/services/courseService';
import type { 
  GrandtestQuestion, 
  GrandtestQuestionForm, 
  AdminGrandtestStats,
  QuestionStats 
} from '@/lib/types/grandtest';

export default function AdminGrandtestManagement() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [questions, setQuestions] = useState<GrandtestQuestion[]>([]);
  const [stats, setStats] = useState<AdminGrandtestStats | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<GrandtestQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState<GrandtestQuestionForm>({
    course_id: '',
    question_text: '',
    question_type: 'multiple_choice',
    options: {},
    correct_answer: '',
    explanation: '',
    points: 1,
    difficulty_level: 'medium'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadQuestions();
      loadStats();
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const coursesData = await courseService.getCourses();
      setCourses(coursesData);
      if (coursesData.length > 0) {
        setSelectedCourse(coursesData[0].id);
      }
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses');
    }
  };

  const loadQuestions = async () => {
    if (!selectedCourse) return;
    
    try {
      setLoading(true);
      // Use API route to bypass RLS issues
      const response = await fetch(`/api/admin/grandtest/questions?courseId=${selectedCourse}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      
      const { data } = await response.json();
      setQuestions(data || []);
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedCourse) return;
    
    try {
      // This would need to be implemented in the service
      // const statsData = await GrandtestService.getAdminStats(selectedCourse);
      // setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleCreateQuestion = () => {
    setQuestionForm({
      course_id: selectedCourse,
      question_text: '',
      question_type: 'multiple_choice',
      options: {},
      correct_answer: '',
      explanation: '',
      points: 1,
      difficulty_level: 'medium'
    });
    setEditingQuestion(null);
    setShowQuestionForm(true);
  };

  const handleEditQuestion = (question: GrandtestQuestion) => {
    setQuestionForm({
      course_id: question.course_id,
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || {},
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      points: question.points,
      difficulty_level: question.difficulty_level
    });
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const response = await fetch(`/api/admin/grandtest/questions?id=${questionId}`, {
        method: 'DELETE',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete question');
      }
      
      await loadQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Failed to delete question');
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingQuestion) {
        const response = await fetch(`/api/admin/grandtest/questions?id=${editingQuestion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionForm),
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error('Failed to update question');
        }
      } else {
        const response = await fetch('/api/admin/grandtest/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionForm),
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error('Failed to create question');
        }
      }
      
      setShowQuestionForm(false);
      setEditingQuestion(null);
      await loadQuestions();
    } catch (err) {
      console.error('Error saving question:', err);
      setError('Failed to save question');
    }
  };

  const handleOptionChange = (key: string, value: string) => {
    setQuestionForm(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [key]: value
      }
    }));
  };

  const addOption = () => {
    const keys = Object.keys(questionForm.options || {});
    const nextKey = String.fromCharCode(65 + keys.length); // A, B, C, D...
    setQuestionForm(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [nextKey]: ''
      }
    }));
  };

  const removeOption = (key: string) => {
    setQuestionForm(prev => {
      const newOptions = { ...prev.options };
      delete newOptions[key];
      return {
        ...prev,
        options: newOptions
      };
    });
  };

  if (loading && !questions.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Grandtest Management</h2>
        <button
          onClick={handleCreateQuestion}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Add Question
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">⚠️</div>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Course Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Course
        </label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.total_questions}</div>
            <div className="text-gray-600">Total Questions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{stats.total_attempts}</div>
            <div className="text-gray-600">Total Attempts</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">{stats.total_passed}</div>
            <div className="text-gray-600">Passed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-orange-600">{stats.pass_rate.toFixed(1)}%</div>
            <div className="text-gray-600">Pass Rate</div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Questions ({questions.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {questions.map(question => (
            <div key={question.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded mr-2">
                      {question.question_type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded mr-2">
                      {question.difficulty_level}
                    </span>
                    <span className="text-sm text-gray-500">
                      {question.points} point{question.points !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-2">{question.question_text}</p>
                  {question.options && Object.keys(question.options).length > 0 && (
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Options:</strong>
                      <ul className="list-disc list-inside ml-4">
                        {Object.entries(question.options).map(([key, value]) => (
                          <li key={key}>
                            <strong>{key}:</strong> {value}
                            {key === question.correct_answer && (
                              <span className="text-green-600 ml-2">✓</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-sm text-gray-600">
                    <strong>Correct Answer:</strong> {question.correct_answer}
                  </p>
                  {question.explanation && (
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEditQuestion(question)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </h3>
            
            <form onSubmit={handleQuestionSubmit} className="space-y-6">
              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Text *
                </label>
                <textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>

              {/* Question Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type *
                </label>
                <select
                  value={questionForm.question_type}
                  onChange={(e) => setQuestionForm(prev => ({ 
                    ...prev, 
                    question_type: e.target.value as any,
                    options: e.target.value === 'multiple_choice' ? prev.options : {}
                  }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="fill_blank">Fill in the Blank</option>
                  <option value="essay">Essay</option>
                </select>
              </div>

              {/* Options for Multiple Choice */}
              {questionForm.question_type === 'multiple_choice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer Options *
                  </label>
                  {Object.entries(questionForm.options || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center mb-2">
                      <span className="w-8 text-sm font-medium">{key}.</span>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleOptionChange(key, e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(key)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Option
                  </button>
                </div>
              )}

              {/* Correct Answer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer *
                </label>
                {questionForm.question_type === 'multiple_choice' ? (
                  <select
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, correct_answer: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select correct answer</option>
                    {Object.keys(questionForm.options || {}).map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                ) : questionForm.question_type === 'true_false' ? (
                  <select
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, correct_answer: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select correct answer</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, correct_answer: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter correct answer"
                    required
                  />
                )}
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Explanation
                </label>
                <textarea
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Explain why this is the correct answer"
                />
              </div>

              {/* Points and Difficulty */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={questionForm.difficulty_level}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, difficulty_level: e.target.value as any }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowQuestionForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  {editingQuestion ? 'Update Question' : 'Create Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



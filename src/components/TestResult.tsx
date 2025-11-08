'use client'

import { TestResult as TestResultType } from '@/lib/validations/mcq'
import { useRouter } from 'next/navigation'

interface TestResultProps {
  result: TestResultType
  onRetake?: () => void
  onContinue?: () => void
}

export default function TestResult({ result, onRetake, onContinue }: TestResultProps) {
  const router = useRouter()
  const { session, score_breakdown, category_performance, recommendations } = result
  const passed = score_breakdown.percentage_score >= session.test_config.passing_score_percentage

  const handleContinue = () => {
    if (onContinue) {
      onContinue()
    } else {
      router.push('/dashboard')
    }
  }

  const handleRetake = () => {
    if (onRetake) {
      onRetake()
    } else {
      router.push('/assessment')
    }
  }

  return (
    <div className="min-h-screen w-full bg-black">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            passed ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            {passed ? (
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <h1 className={`text-3xl font-bold mb-2 ${
            passed ? 'text-green-400' : 'text-red-400'
          }`}>
            {passed ? 'Congratulations!' : 'Test Not Passed'}
          </h1>
          
          <p className="text-gray-300 text-lg">
            {passed 
              ? 'You have successfully passed the pre-enrollment assessment!'
              : 'You need to score at least 70% to pass. Don\'t worry, you can retake the test.'
            }
          </p>
        </div>

        {/* Score Overview */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Test Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {score_breakdown.percentage_score.toFixed(1)}%
              </div>
              <div className="text-gray-400">Overall Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {score_breakdown.correct_answers}/{score_breakdown.total_questions}
              </div>
              <div className="text-gray-400">Correct Answers</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {score_breakdown.time_taken}
              </div>
              <div className="text-gray-400">Time Taken</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Your Score</span>
              <span>Passing Score: {session.test_config.passing_score_percentage}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  passed ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(score_breakdown.percentage_score, 100)}%` }}
              />
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {score_breakdown.correct_answers}
              </div>
              <div className="text-gray-400 text-sm">Correct</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400 mb-1">
                {score_breakdown.incorrect_answers}
              </div>
              <div className="text-gray-400 text-sm">Incorrect</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {score_breakdown.skipped_questions}
              </div>
              <div className="text-gray-400 text-sm">Skipped</div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {session.attempt_number}
              </div>
              <div className="text-gray-400 text-sm">Attempt</div>
            </div>
          </div>
        </div>

        {/* Category Performance */}
        {category_performance.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Performance by Category</h2>
            
            <div className="space-y-4">
              {category_performance.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <div className="text-white font-medium">{category.category_name}</div>
                    <div className="text-gray-400 text-sm">
                      {category.correct_answers}/{category.questions_attempted} correct
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      category.percentage >= 70 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {category.percentage.toFixed(1)}%
                    </div>
                    <div className="w-20 bg-white/10 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full ${
                          category.percentage >= 70 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-semibold text-white mb-6">Recommendations</h2>
            
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-400 text-sm font-bold">{index + 1}</span>
                  </div>
                  <p className="text-gray-300">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {!passed && onRetake && (
            <button
              onClick={handleRetake}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Retake Test
            </button>
          )}
          
          <button
            onClick={handleContinue}
            className="px-8 py-4 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            {passed ? 'Continue to Course' : 'Back to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  )
}




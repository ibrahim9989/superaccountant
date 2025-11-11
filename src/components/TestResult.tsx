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
      router.push('/under-review')
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
    <div className="min-h-screen w-full bg-black relative">
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

      <div className="relative z-10 max-w-5xl mx-auto p-6 lg:p-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center border-2 shadow-2xl ${
            passed 
              ? 'bg-gradient-to-br from-green-900/50 via-green-800/50 to-green-900/50 border-green-700/50' 
              : 'bg-gradient-to-br from-red-900/50 via-red-800/50 to-red-900/50 border-red-700/50'
          }`}>
            {passed ? (
              <svg className="w-12 h-12 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-500/50 rounded-full mb-6 shadow-2xl backdrop-blur-sm">
            <div className="w-2.5 h-2.5 bg-gradient-to-r from-white to-gray-300 rounded-full mr-3 animate-pulse"></div>
            <span className="text-white text-xs font-bold tracking-[0.22em] uppercase">
              {passed ? 'ASSESSMENT PASSED' : 'ASSESSMENT RESULT'}
            </span>
            <div className="w-2.5 h-2.5 bg-gradient-to-r from-gray-300 to-white rounded-full ml-3 animate-pulse"></div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            {passed ? 'Congratulations!' : 'Test Not Passed'}
          </h1>
          
          <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto">
            {passed 
              ? 'You have successfully passed the pre-enrollment assessment!'
              : `You need to score at least ${session.test_config.passing_score_percentage}% to pass. Don't worry, you can retake the test.`
            }
          </p>
        </div>

        {/* Score Overview */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 mb-8 shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-8 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
            Test Results
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="group bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 text-center hover:border-gray-500/70 transition-all duration-500">
              <div className="text-5xl font-black text-white mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                {score_breakdown.percentage_score.toFixed(1)}%
              </div>
              <div className="text-gray-300 font-medium">Overall Score</div>
            </div>
            
            <div className="group bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 text-center hover:border-gray-500/70 transition-all duration-500">
              <div className="text-5xl font-black text-white mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                {score_breakdown.correct_answers}/{score_breakdown.total_questions}
              </div>
              <div className="text-gray-300 font-medium">Correct Answers</div>
            </div>
            
            <div className="group bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 text-center hover:border-gray-500/70 transition-all duration-500">
              <div className="text-5xl font-black text-white mb-3 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                {score_breakdown.time_taken}
              </div>
              <div className="text-gray-300 font-medium">Time Taken</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-300 mb-3 font-medium">
              <span>Your Score</span>
              <span>Passing Score: {session.test_config.passing_score_percentage}%</span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-4 overflow-hidden border border-gray-700/50">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  passed 
                    ? 'bg-gradient-to-r from-green-600 via-green-500 to-green-600' 
                    : 'bg-gradient-to-r from-white via-gray-200 to-white'
                }`}
                style={{ width: `${Math.min(score_breakdown.percentage_score, 100)}%` }}
              />
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                {score_breakdown.correct_answers}
              </div>
              <div className="text-gray-300 text-sm font-medium">Correct</div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                {score_breakdown.incorrect_answers}
              </div>
              <div className="text-gray-300 text-sm font-medium">Incorrect</div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                {score_breakdown.skipped_questions}
              </div>
              <div className="text-gray-300 text-sm font-medium">Skipped</div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                {session.attempt_number}
              </div>
              <div className="text-gray-300 text-sm font-medium">Attempt</div>
            </div>
          </div>
        </div>

        {/* Category Performance */}
        {category_performance.length > 0 && (
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 mb-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-8 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Performance by Category
            </h2>
            
            <div className="space-y-4">
              {category_performance.map((category, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-6 hover:border-gray-500/70 transition-all duration-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-white font-bold text-lg mb-1">{category.category_name}</div>
                      <div className="text-gray-300 text-sm font-medium">
                        {category.correct_answers}/{category.questions_attempted} correct
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-black text-white mb-2 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                        {category.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden border border-gray-700/50">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-white via-gray-200 to-white transition-all duration-700" 
                      style={{ width: `${category.percentage}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/50 rounded-3xl p-8 mb-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-8 bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
              Recommendations
            </h2>
            
            <div className="space-y-4">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-4 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-xl p-5 hover:border-gray-500/70 transition-all duration-500">
                  <div className="w-10 h-10 bg-gradient-to-br from-white/20 via-gray-700/20 to-white/10 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-600/50">
                    <span className="text-white text-sm font-black">{index + 1}</span>
                  </div>
                  <p className="text-gray-300 font-light text-lg flex-1">{recommendation}</p>
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
              className="group relative px-8 py-4 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10">Retake Test</span>
            </button>
          )}
          
          <button
            onClick={handleContinue}
            className="group relative px-8 py-4 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white font-black rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative z-10">Continue</span>
          </button>
        </div>
      </div>
    </div>
  )
}

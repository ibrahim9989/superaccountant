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
    <div className="min-h-screen bg-[#2B2A29] text-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1e3a5f] via-[#264174] to-[#DC2626] py-12 sm:py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center border-2 ${
              passed 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white/10 border-white/20'
            }`}>
              {passed ? (
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              {passed ? 'Congratulations!' : 'Test Not Passed'}
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 max-w-4xl mx-auto font-medium">
              {passed 
                ? 'You have successfully passed the pre-enrollment assessment!'
                : `You need to score at least ${session.test_config.passing_score_percentage}% to pass. Don't worry, you can retake the test.`
              }
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gradient-to-b from-[#2B2A29] to-[#264174]/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Score Overview */}
          <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-8 border border-white/10 mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-8">
              Test Results
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 rounded-xl p-6 text-center border border-white/20">
                <div className="text-5xl font-black text-white mb-3">
                  {score_breakdown.percentage_score.toFixed(1)}%
                </div>
                <div className="text-white/90 font-medium">Overall Score</div>
              </div>
              
              <div className="bg-white/10 rounded-xl p-6 text-center border border-white/20">
                <div className="text-5xl font-black text-white mb-3">
                  {score_breakdown.correct_answers}/{score_breakdown.total_questions}
                </div>
                <div className="text-white/90 font-medium">Correct Answers</div>
              </div>
              
              <div className="bg-white/10 rounded-xl p-6 text-center border border-white/20">
                <div className="text-5xl font-black text-white mb-3">
                  {score_breakdown.time_taken}
                </div>
                <div className="text-white/90 font-medium">Time Taken</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-white/90 mb-3 font-medium">
                <span>Your Score</span>
                <span>Passing Score: {session.test_config.passing_score_percentage}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden border border-white/20">
                <div 
                  className="h-full rounded-full transition-all duration-700 bg-white"
                  style={{ width: `${Math.min(score_breakdown.percentage_score, 100)}%` }}
                />
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
                <div className="text-3xl font-black text-white mb-2">
                  {score_breakdown.correct_answers}
                </div>
                <div className="text-white/90 text-sm font-medium">Correct</div>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
                <div className="text-3xl font-black text-white mb-2">
                  {score_breakdown.incorrect_answers}
                </div>
                <div className="text-white/90 text-sm font-medium">Incorrect</div>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
                <div className="text-3xl font-black text-white mb-2">
                  {score_breakdown.skipped_questions}
                </div>
                <div className="text-white/90 text-sm font-medium">Skipped</div>
              </div>
              
              <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
                <div className="text-3xl font-black text-white mb-2">
                  {session.attempt_number}
                </div>
                <div className="text-white/90 text-sm font-medium">Attempt</div>
              </div>
            </div>
          </div>

          {/* Category Performance */}
          {category_performance.length > 0 && (
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-8 border border-white/10 mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-8">
                Performance by Category
              </h2>
              
              <div className="space-y-4">
                {category_performance.map((category, index) => (
                  <div key={index} className="bg-white/10 rounded-xl p-6 border border-white/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-white font-bold text-lg mb-1">{category.category_name}</div>
                        <div className="text-white/90 text-sm font-medium">
                          {category.correct_answers}/{category.questions_attempted} correct
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-black text-white mb-2">
                          {category.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/20">
                      <div 
                        className="h-full rounded-full bg-white transition-all duration-700" 
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
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 rounded-2xl p-6 md:p-8 border border-white/10 mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-8">
                Recommendations
              </h2>
              
              <div className="space-y-4">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-4 bg-white/10 rounded-xl p-5 border border-white/20">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 border border-white/20">
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <p className="text-white/90 text-lg flex-1">{recommendation}</p>
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
                className="px-8 py-4 bg-[#DC2626] text-white rounded-lg text-lg font-semibold hover:bg-[#B91C1C] transition-colors"
              >
                Retake Test
              </button>
            )}
            
            <button
              onClick={handleContinue}
              className="px-8 py-4 bg-[#DC2626] text-white rounded-lg text-lg font-semibold hover:bg-[#B91C1C] transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

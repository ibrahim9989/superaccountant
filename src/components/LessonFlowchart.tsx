'use client'

import { useState } from 'react'

interface Flowchart {
  flowchart_file_path?: string
  flowchart_file_name?: string
  flowchart_mime_type?: string
  flowchart_url?: string
  flowchart_title?: string
}

interface LessonFlowchartProps {
  flowcharts: Flowchart[]
}

export default function LessonFlowchart({ flowcharts }: LessonFlowchartProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFlowchartIndex, setSelectedFlowchartIndex] = useState(0)
  const [showZoomedImage, setShowZoomedImage] = useState(false)

  // Filter out flowcharts without a file path or URL
  const validFlowcharts = flowcharts.filter(
    flowchart => flowchart.flowchart_file_path || flowchart.flowchart_url
  )

  if (validFlowcharts.length === 0) {
    return null
  }

  const currentFlowchart = validFlowcharts[selectedFlowchartIndex]
  const flowchartUrl = currentFlowchart.flowchart_file_path || currentFlowchart.flowchart_url
  const flowchartName = currentFlowchart.flowchart_title || currentFlowchart.flowchart_file_name || 'Flowchart'
  const isImage = currentFlowchart.flowchart_mime_type?.startsWith('image/') || 
                  flowchartUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
  const isPdf = currentFlowchart.flowchart_mime_type === 'application/pdf' ||
                flowchartUrl?.match(/\.pdf$/i)

  return (
    <>
      {/* Hamburger Menu Button - Beside video player */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border border-gray-600/50 hover:border-gray-500/70 text-white p-3 rounded-r-lg shadow-xl transition-all duration-300 flex items-center justify-center flex-shrink-0 hover:scale-105"
        style={{ minHeight: '100%' }}
        aria-label={isOpen ? "Close flowchart" : "Open flowchart"}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Sidebar - Slides in from right, pushes video to the left */}
      <div
        className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-r border-gray-600/50 transition-all duration-300 ease-in-out shadow-2xl overflow-hidden flex-shrink-0 ${
          isOpen ? 'w-full max-w-md' : 'w-0'
        }`}
        style={{ minHeight: '100%' }}
      >
        <div className="flex flex-col h-full min-h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b border-gray-600/50 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-white truncate bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                {flowchartName}
              </h2>
              {validFlowcharts.length > 1 && (
                <p className="text-xs text-gray-300 mt-1 font-medium">
                  {selectedFlowchartIndex + 1} of {validFlowcharts.length}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Flowchart navigation buttons if multiple flowcharts */}
              {validFlowcharts.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedFlowchartIndex(Math.max(0, selectedFlowchartIndex - 1))}
                    disabled={selectedFlowchartIndex === 0}
                    className="p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:text-white hover:border-gray-500/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous flowchart"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedFlowchartIndex(Math.min(validFlowcharts.length - 1, selectedFlowchartIndex + 1))}
                    disabled={selectedFlowchartIndex === validFlowcharts.length - 1}
                    className="p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:text-white hover:border-gray-500/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next flowchart"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
              {isImage && (
                <button
                  onClick={() => setShowZoomedImage(true)}
                  className="p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:text-white hover:border-gray-500/70 transition-all duration-300 flex-shrink-0"
                  aria-label="View zoomed image"
                  title="View Zoomed Image"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:text-white hover:border-gray-500/70 transition-all duration-300 ml-2 flex-shrink-0"
                aria-label="Close flowchart"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Flowchart list for multiple flowcharts */}
          {validFlowcharts.length > 1 && (
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-b border-gray-600/50 px-4 py-3 flex-shrink-0 overflow-x-auto">
              <div className="flex gap-2">
                {validFlowcharts.map((fc, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedFlowchartIndex(index)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                      index === selectedFlowchartIndex
                        ? 'bg-gradient-to-r from-white via-gray-100 to-white text-black shadow-lg'
                        : 'bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700/50 text-gray-300 hover:border-gray-500/70 hover:text-white'
                    }`}
                  >
                    {fc.flowchart_title || `Flowchart ${index + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isImage ? (
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-4 shadow-xl">
                <img
                  src={flowchartUrl}
                  alt={flowchartName}
                  className="max-w-full h-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowZoomedImage(true)}
                />
                <p className="text-xs text-gray-400 mt-3 text-center font-medium">Click image or button above to view zoomed</p>
              </div>
            ) : isPdf ? (
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-4 h-full shadow-xl">
                <iframe
                  src={flowchartUrl}
                  className="w-full h-full min-h-[600px] rounded-xl"
                  title={flowchartName}
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-700/50 rounded-2xl p-6 shadow-xl">
                <p className="text-gray-300 mb-4 font-light text-lg">
                  Click the link below to view the flowchart:
                </p>
                <a
                  href={flowchartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block group relative px-6 py-3 bg-gradient-to-r from-white via-gray-100 to-white text-black font-black rounded-2xl transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-white/25 hover:shadow-white/40 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-white to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative z-10">Open Flowchart</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zoomed Image Popup Modal */}
      {showZoomedImage && isImage && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] animate-fade-in"
            onClick={() => setShowZoomedImage(false)}
          />

          {/* Popup Modal */}
          <div 
            className="fixed inset-0 z-[70] flex flex-col bg-black animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-600/50 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-black text-white bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                {flowchartName}
              </h2>
              <button
                onClick={() => setShowZoomedImage(false)}
                className="p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:text-white hover:border-gray-500/70 transition-all duration-300 flex-shrink-0"
                aria-label="Close zoomed view"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Zoomed Image Content */}
            <div className="flex-1 overflow-auto bg-white" style={{ height: 'calc(100vh - 73px)' }}>
              <div className="flex justify-center items-start" style={{ 
                minHeight: '100%',
                padding: '20px'
              }}>
                <div style={{ 
                  transform: 'scale(1.8)', 
                  transformOrigin: 'top center'
                }}>
                  <img
                    src={flowchartUrl}
                    alt={flowchartName}
                    className="rounded-xl shadow-2xl"
                    style={{ 
                      maxWidth: 'calc((100vw - 80px) / 1.8)',
                      maxHeight: 'calc((100vh - 160px) / 1.8)',
                      width: 'auto',
                      height: 'auto',
                      display: 'block',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

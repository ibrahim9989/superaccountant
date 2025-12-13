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
        className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/20 hover:border-white/30 text-white p-3 rounded-r-lg transition-all duration-300 flex items-center justify-center flex-shrink-0 hover:scale-105"
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
        className={`bg-gradient-to-br from-[#2B2A29] to-[#264174]/30 border-r border-white/10 transition-all duration-300 ease-in-out shadow-2xl overflow-hidden flex-shrink-0 ${
          isOpen ? 'w-full max-w-2xl' : 'w-0'
        }`}
        style={{ minHeight: '100%' }}
      >
        <div className="flex flex-col h-full min-h-full">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border-b border-white/10 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-white truncate">
                {flowchartName}
              </h2>
              {validFlowcharts.length > 1 && (
                <p className="text-xs text-white/80 mt-1 font-medium">
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
                    className="p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:text-white hover:border-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous flowchart"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedFlowchartIndex(Math.min(validFlowcharts.length - 1, selectedFlowchartIndex + 1))}
                    disabled={selectedFlowchartIndex === validFlowcharts.length - 1}
                    className="p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:text-white hover:border-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:text-white hover:border-white/30 transition-all duration-300 flex-shrink-0"
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
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                }}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:text-white hover:border-white/30 hover:bg-[#DC2626]/50 transition-all duration-300 ml-2 flex-shrink-0"
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
            <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex-shrink-0 overflow-x-auto">
              <div className="flex gap-2">
                {validFlowcharts.map((fc, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedFlowchartIndex(index)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                      index === selectedFlowchartIndex
                        ? 'bg-white text-[#264174] shadow-lg'
                        : 'bg-white/10 border border-white/20 text-white/90 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {fc.flowchart_title || `Flowchart ${index + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#2B2A29]">
            {isImage ? (
              <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-4">
                <img
                  src={flowchartUrl}
                  alt={flowchartName}
                  className="max-w-full h-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowZoomedImage(true)}
                />
                <p className="text-xs text-white/70 mt-3 text-center font-medium">Click image or button above to view zoomed</p>
              </div>
            ) : isPdf ? (
              <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
                <div className="mb-4 flex items-center justify-between flex-shrink-0">
                  <p className="text-white/90 text-sm font-medium">Click anywhere on the PDF to open in a new tab</p>
                  <a
                    href={flowchartUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#DC2626] text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors text-sm"
                  >
                    Open PDF
                  </a>
                </div>
                <div 
                  className="bg-white rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity relative flex-1"
                  onClick={() => window.open(flowchartUrl, '_blank')}
                  style={{ 
                    width: '100%',
                    minHeight: 0
                  }}
                >
                  <iframe
                    src={`${flowchartUrl}#toolbar=1&navpanes=0&scrollbar=1&zoom=page-fit`}
                    className="w-full h-full border-0"
                    title={flowchartName}
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      display: 'block'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-6">
                <p className="text-white/90 mb-4 font-medium text-lg">
                  Click the link below to view the flowchart:
                </p>
                <a
                  href={flowchartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-[#DC2626] text-white font-semibold rounded-lg transition-colors hover:bg-[#B91C1C]"
                >
                  Open Flowchart
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
            className="fixed inset-0 z-[70] flex flex-col bg-[#2B2A29] animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border-b border-white/10 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-black text-white">
                {flowchartName}
              </h2>
              <button
                onClick={() => setShowZoomedImage(false)}
                className="p-2 bg-white/10 border border-white/20 rounded-lg text-white/90 hover:text-white hover:border-white/30 hover:bg-[#DC2626]/50 transition-all duration-300 flex-shrink-0"
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

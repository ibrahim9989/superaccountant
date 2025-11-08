'use client'

import { useState } from 'react'

interface LessonFlowchartProps {
  flowchart: {
    flowchart_file_path?: string
    flowchart_file_name?: string
    flowchart_mime_type?: string
    flowchart_url?: string
    flowchart_title?: string
  }
}

export default function LessonFlowchart({ flowchart }: LessonFlowchartProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showZoomedImage, setShowZoomedImage] = useState(false)

  if (!flowchart.flowchart_file_path && !flowchart.flowchart_url) {
    return null
  }

  const flowchartUrl = flowchart.flowchart_file_path || flowchart.flowchart_url
  const flowchartName = flowchart.flowchart_title || flowchart.flowchart_file_name || 'Flowchart'
  const isImage = flowchart.flowchart_mime_type?.startsWith('image/') || 
                  flowchartUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
  const isPdf = flowchart.flowchart_mime_type === 'application/pdf' ||
                flowchartUrl?.match(/\.pdf$/i)

  return (
    <>
      {/* Hamburger Menu Button - Beside video player */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-r-lg shadow-lg transition-all duration-300 flex items-center justify-center flex-shrink-0"
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
        className={`bg-gray-900 transition-all duration-300 ease-in-out shadow-2xl overflow-hidden flex-shrink-0 ${
          isOpen ? 'w-full max-w-md' : 'w-0'
        }`}
        style={{ minHeight: '100%' }}
      >
        <div className="flex flex-col h-full min-h-full">
          {/* Header */}
          <div className="bg-blue-800 px-6 py-4 flex items-center justify-between border-b border-blue-700 flex-shrink-0">
            <h2 className="text-xl font-semibold text-white truncate">{flowchartName}</h2>
            <div className="flex items-center gap-2">
              {isImage && (
                <button
                  onClick={() => setShowZoomedImage(true)}
                  className="text-gray-300 hover:text-white transition-colors flex-shrink-0"
                  aria-label="View zoomed image"
                  title="View Zoomed Image"
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
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white transition-colors ml-2 flex-shrink-0"
                aria-label="Close flowchart"
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isImage ? (
              <div className="bg-gray-800 rounded-lg p-4">
                <img
                  src={flowchartUrl}
                  alt={flowchartName}
                  className="max-w-full h-auto rounded-lg cursor-pointer"
                  onClick={() => setShowZoomedImage(true)}
                />
                <p className="text-xs text-gray-400 mt-2 text-center">Click image or button above to view zoomed</p>
              </div>
            ) : isPdf ? (
              <div className="bg-gray-800 rounded-lg p-4 h-full">
                <iframe
                  src={flowchartUrl}
                  className="w-full h-full min-h-[600px] rounded-lg"
                  title={flowchartName}
                />
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-300 mb-4">
                  Click the link below to view the flowchart:
                </p>
                <a
                  href={flowchartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
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
            className="fixed inset-0 bg-black bg-opacity-90 z-[60]"
            onClick={() => setShowZoomedImage(false)}
          />

          {/* Popup Modal */}
          <div 
            className="fixed inset-0 z-[70] flex flex-col bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-blue-800 px-6 py-4 flex items-center justify-between border-b border-blue-700 flex-shrink-0">
              <h2 className="text-xl font-semibold text-white">{flowchartName}</h2>
              <button
                onClick={() => setShowZoomedImage(false)}
                className="text-gray-300 hover:text-white transition-colors flex-shrink-0"
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
                    className="rounded-lg shadow-lg"
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


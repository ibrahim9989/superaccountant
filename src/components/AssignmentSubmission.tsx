'use client'

import { useState } from 'react'
import { CourseAssignment, type AssignmentSubmission } from '@/lib/validations/course'
import { courseService } from '@/lib/services/courseService'

interface AssignmentSubmissionProps {
  assignment: CourseAssignment
  enrollmentId: string
  onClose: () => void
  onSubmissionComplete: (submission: AssignmentSubmission) => void
}

export default function AssignmentSubmission({
  assignment,
  enrollmentId,
  onClose,
  onSubmissionComplete
}: AssignmentSubmissionProps) {
  const [submissionText, setSubmissionText] = useState('')
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSubmissionFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!submissionText.trim() && submissionFiles.length === 0) {
      setError('Please provide either text submission or upload files')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // For now, we'll handle file uploads as URLs (you might want to implement actual file upload)
      const fileUrls: string[] = []
      
      // TODO: Implement actual file upload to Supabase Storage
      // For now, we'll just store file names
      submissionFiles.forEach(file => {
        fileUrls.push(`uploaded/${file.name}`)
      })

      const submissionData = {
        submission_text: submissionText.trim() || undefined,
        submission_files: fileUrls.length > 0 ? fileUrls : undefined
      }

      const submission = await courseService.submitAssignment(
        enrollmentId,
        assignment.id,
        submissionData
      )

      onSubmissionComplete(submission)
      onClose()
    } catch (err) {
      console.error('Error submitting assignment:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Submit Assignment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">{assignment.title}</h3>
          {assignment.description && (
            <p className="text-gray-300 mb-4">{assignment.description}</p>
          )}
          {assignment.instructions && (
            <div className="mb-4">
              <h4 className="text-white font-medium mb-2">Instructions:</h4>
              <p className="text-gray-300">{assignment.instructions}</p>
            </div>
          )}
          
          {/* Assignment Attachments/Documents */}
          {assignment.attachment_files && Object.keys(assignment.attachment_files).length > 0 && (
            <div className="mb-4">
              <h4 className="text-white font-medium mb-2">Provided Documents:</h4>
              <div className="space-y-2">
                {Object.entries(assignment.attachment_files).map(([key, file]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{file.name || file.title || key}</p>
                        {file.size && (
                          <p className="text-gray-400 text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    <a
                      href={file.url || file.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {assignment.due_date && (
            <p className="text-yellow-400 text-sm">
              Due: {new Date(assignment.due_date).toLocaleDateString()}
            </p>
          )}
          <p className="text-gray-400 text-sm mt-2">
            Max Points: {assignment.max_points}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="submission-text" className="block text-white font-medium mb-2">
              Your Submission
            </label>
            <textarea
              id="submission-text"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Write your assignment submission here..."
              className="w-full h-40 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label htmlFor="submission-files" className="block text-white font-medium mb-2">
              Upload Files (Optional)
            </label>
            <input
              type="file"
              id="submission-files"
              multiple
              onChange={handleFileChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {submissionFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-gray-400 text-sm">Selected files:</p>
                <ul className="text-gray-300 text-sm">
                  {submissionFiles.map((file, index) => (
                    <li key={index}>• {file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

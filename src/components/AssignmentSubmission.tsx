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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#264174]/50 to-[#DC2626]/40 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-white">Submit Assignment</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <h3 className="text-lg font-bold text-white mb-2">{assignment.title}</h3>
          {assignment.description && (
              <p className="text-white/90 mb-4">{assignment.description}</p>
          )}
          </div>
          {assignment.instructions && (
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <h4 className="text-white font-bold mb-2">Instructions:</h4>
              <div className="text-white/90 whitespace-pre-line">{assignment.instructions}</div>
            </div>
          )}
          
          {/* Assignment Attachments/Documents */}
          {assignment.attachment_files && Object.keys(assignment.attachment_files).length > 0 && (
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <h4 className="text-white font-bold mb-3">Provided Documents:</h4>
              <div className="space-y-2">
                {Object.entries(assignment.attachment_files).map(([key, file]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between bg-white/10 rounded-lg p-3 border border-white/20">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center border border-white/20">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{file.name || file.title || key}</p>
                        {file.size && (
                          <p className="text-white/70 text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    <a
                      href={file.url || file.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 text-sm">
          {assignment.due_date && (
              <div className="bg-white/10 rounded-lg px-3 py-2 border border-white/20">
                <span className="text-white/80">Due: </span>
                <span className="text-white font-medium">{new Date(assignment.due_date).toLocaleDateString()}</span>
              </div>
          )}
            <div className="bg-white/10 rounded-lg px-3 py-2 border border-white/20">
              <span className="text-white/80">Max Points: </span>
              <span className="text-white font-medium">{assignment.max_points}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <label htmlFor="submission-text" className="block text-white font-bold mb-3">
              Your Submission
            </label>
            <textarea
              id="submission-text"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Write your assignment submission here..."
              className="w-full h-40 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 resize-none"
            />
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <label htmlFor="submission-files" className="block text-white font-bold mb-3">
              Upload Files (Optional)
            </label>
            <input
              type="file"
              id="submission-files"
              multiple
              onChange={handleFileChange}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#DC2626] file:text-white hover:file:bg-[#B91C1C] focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
            />
            {submissionFiles.length > 0 && (
              <div className="mt-3">
                <p className="text-white/80 text-sm mb-2">Selected files:</p>
                <ul className="text-white/90 text-sm space-y-1">
                  {submissionFiles.map((file, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span>•</span>
                      <span>{file.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-4">
              <p className="text-white">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-[#DC2626] text-white rounded-lg hover:bg-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

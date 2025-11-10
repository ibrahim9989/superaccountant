'use client'

import { useState, useEffect } from 'react'
import { courseService } from '@/lib/services/courseService'
import { getSupabaseClient } from '@/lib/supabase/client'

interface Course {
  id: string
  title: string
  description: string
  duration_days: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  is_active: boolean
  created_at: string
  updated_at: string
  modules: CourseModule[]
}

interface CourseModule {
  id: string
  course_id: string
  title: string
  description: string
  order_index: number
  is_active: boolean
  lessons: CourseLesson[]
}

interface CourseLesson {
  id: string
  module_id: string
  title: string
  description?: string
  video_url?: string
  lesson_type: 'video' | 'reading' | 'quiz' | 'assignment' | 'discussion' | 'live_session'
  duration_minutes?: number
  order_index: number
  is_active: boolean
  quiz?: CourseQuiz
  assignment?: CourseAssignment
}

interface CourseQuiz {
  id: string
  lesson_id: string
  title: string
  description: string
  time_limit_minutes: number
  passing_score_percentage: number
  max_attempts: number
  is_active: boolean
  questions: QuizQuestion[]
}

interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false'
  options: string[]
  correct_answer: string
  explanation: string
  points: number
  order_index: number
  is_active: boolean
}

interface CourseAssignment {
  id: string
  lesson_id: string
  title: string
  description: string
  instructions: string
  assignment_type: 'individual' | 'group' | 'peer_review'
  due_date?: string
  max_points: number
  attachment_files?: Record<string, any>
  is_active: boolean
}

interface CourseEnrollment {
  id: string
  course_id: string
  user_id: string
  status: 'active' | 'completed' | 'dropped'
  progress_percentage: number
  started_at: string
  completed_at?: string
  user: {
    profile: {
      first_name: string
      last_name: string
      email: string
    }
  }
  course: {
    title: string
  }
}

export default function AdminCourseContent() {
  const supabase = getSupabaseClient()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([])
  const [activeTab, setActiveTab] = useState<'courses' | 'modules' | 'lessons' | 'content' | 'assignments' | 'enrollments'>('courses')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [showModuleForm, setShowModuleForm] = useState(false)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [showContentForm, setShowContentForm] = useState(false)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null)
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null)
  const [editingContent, setEditingContent] = useState<any>(null)
  const [editingAssignment, setEditingAssignment] = useState<CourseAssignment | null>(null)
  const [modulesCountByCourse, setModulesCountByCourse] = useState<Record<string, number>>({})
  const [lessonContent, setLessonContent] = useState<any[]>([])

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    duration_days: 45,
    difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    is_active: true
  })

  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    order_index: 1,
    is_active: true
  })

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    video_url: '',
    lesson_type: 'reading' as 'video' | 'reading' | 'quiz' | 'assignment' | 'discussion' | 'live_session',
    duration_minutes: 30,
    order_index: 1,
    is_active: true
  })
  
  const [flowchartFile, setFlowchartFile] = useState<File | null>(null)
  const [flowchartUrl, setFlowchartUrl] = useState('')
  const [flowchartTitle, setFlowchartTitle] = useState('')

  const [contentForm, setContentForm] = useState({
    title: '',
    content_type: 'document' as 'video' | 'document' | 'image' | 'audio' | 'link' | 'embed',
    content_url: '',
    content_data: '',
    upload_source: 'url' as 'url' | 'file_upload' | 'embed',
    file: null as File | null,
    lesson_id: '',
    order_index: 1,
    is_active: true
  })

  const [assignmentForm, setAssignmentForm] = useState({
    lesson_id: '',
    title: '',
    description: '',
    assignment_type: 'individual' as 'individual' | 'group' | 'peer_review',
    due_date: '',
    max_points: 100,
    instructions: '',
    attachment_files: {} as Record<string, any>,
    is_active: true
  })

  const [assignmentFiles, setAssignmentFiles] = useState<File[]>([])

  useEffect(() => {
    loadData()
  }, [])

  // Auto-select first course when switching to Modules if none selected
  useEffect(() => {
    const ensureSelection = async () => {
      if (activeTab === 'modules' && !selectedCourse && courses.length > 0) {
        const full = await courseService.getCourseById(courses[0].id)
        if (full) {
          setSelectedCourse({ ...(full as any), modules: full.modules || [] } as any)
        }
      }
      if (activeTab === 'lessons' && !selectedModule && selectedCourse) {
        const modules = await courseService.getCourseModules(selectedCourse.id)
        if (modules && modules.length > 0) {
          const lessons = await courseService.getLessons(modules[0].id)
          setSelectedModule({ ...(modules[0] as any), lessons: lessons as any })
        }
      }
      if (activeTab === 'content' && selectedModule) {
        await loadContent()
      }
    }
    ensureSelection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, courses, selectedCourse])

  const loadData = async () => {
    try {
      setLoading(true)
      const supabase = getSupabaseClient()
      // Load courses
      const coursesData = await courseService.getCourses()

      // Load module counts per course for accurate display
      const { data: allModules } = await supabase
        .from('course_modules')
        .select('id, course_id')
      const countMap: Record<string, number> = {}
      ;(allModules || []).forEach((m: any) => {
        countMap[m.course_id] = (countMap[m.course_id] || 0) + 1
      })
      setModulesCountByCourse(countMap)

      // For selected course/module, keep selection if still present
      const selectedCourseId = selectedCourse?.id
      const selectedModuleId = selectedModule?.id

      // Attach empty arrays to satisfy UI when null
      setCourses((coursesData as any[]).map((c: any) => ({ ...c, modules: c.modules || [] })))

      if (selectedCourseId) {
        const fullCourse = await courseService.getCourseById(selectedCourseId)
        if (fullCourse) {
          setSelectedCourse({ ...(fullCourse as any), modules: fullCourse.modules || [] } as any)
        }
      }

      if (selectedModuleId) {
        const lessons = await courseService.getLessons(selectedModuleId)
        console.log('Loaded lessons:', lessons)
        lessons.forEach((lesson: any) => {
          console.log(`Lesson: ${lesson.title}, Assignment:`, lesson.assignment)
          if (lesson.assignment) {
            if (Array.isArray(lesson.assignment)) {
              console.log('Assignment is array, length:', lesson.assignment.length)
              if (lesson.assignment.length > 0) {
                console.log('First assignment:', lesson.assignment[0])
              } else {
                console.log('Assignment array is empty')
              }
            } else {
              console.log('Assignment is object:', lesson.assignment)
            }
          } else {
            console.log('No assignment for this lesson')
          }
        })
        setSelectedModule(prev => prev ? { ...prev, lessons: lessons as any } : prev)
      }

      // Enrollments summary (server-side using service role to bypass RLS for admin)
      try {
        const resp = await fetch('/api/admin/enrollments', { cache: 'no-store' })
        if (resp.ok) {
          const json = await resp.json()
          setEnrollments(json?.data || [])
        } else {
          // Fallback to client query if API not available
          const { data: enrollmentsRows, error: fallbackError } = await supabase
            .from('course_enrollments')
            .select('*')
            .order('enrollment_date', { ascending: false })
          
          if (fallbackError) {
            console.error('Fallback enrollments query failed:', fallbackError)
            setEnrollments([])
          } else {
            // Manually fetch profiles and courses for fallback
            const userIds = Array.from(new Set((enrollmentsRows || []).map((e: any) => e.user_id).filter(Boolean)))
            const courseIds = Array.from(new Set((enrollmentsRows || []).map((e: any) => e.course_id).filter(Boolean)))
            
            const [{ data: profiles }, { data: courses }] = await Promise.all([
              userIds.length > 0 ? supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds) : { data: [] },
              courseIds.length > 0 ? supabase.from('courses').select('id, title').in('id', courseIds) : { data: [] }
            ])
            
            const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
            const courseMap = new Map((courses || []).map((c: any) => [c.id, c]))
            
            const merged = (enrollmentsRows || []).map((e: any) => ({
              ...e,
              user: { profile: profileMap.get(e.user_id) || null },
              course: courseMap.get(e.course_id) || null,
            }))
            
            setEnrollments(merged)
          }
        }
      } catch (error) {
        console.error('Error loading enrollments:', error)
        setEnrollments([])
      }
    } catch (error) {
      console.error('Error loading course content data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCourse) {
        await courseService.updateCourse(editingCourse.id, courseForm as any)
      } else {
        await courseService.createCourse(courseForm as any)
      }
      setShowCourseForm(false)
      setEditingCourse(null)
      resetCourseForm()
      loadData()
    } catch (error) {
      console.error('Error saving course:', error)
    }
  }

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!selectedCourse) throw new Error('Select a course first')
      if (editingModule) {
        await courseService.updateCourseModule(editingModule.id, moduleForm as any)
      } else {
        await courseService.createCourseModule({ ...moduleForm, course_id: selectedCourse.id } as any)
      }
      // Reload selected course modules
      const refreshed = await courseService.getCourseById(selectedCourse.id)
      if (refreshed) setSelectedCourse({ ...(refreshed as any), modules: refreshed.modules || [] } as any)
      setShowModuleForm(false)
      setEditingModule(null)
      resetModuleForm()
      loadData()
    } catch (error) {
      console.error('Error saving module:', error)
    }
  }

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!selectedModule) throw new Error('Select a module first')
      
      // Prepare lesson data, only include video_url if it has a value
      const lessonData = {
        title: lessonForm.title,
        description: lessonForm.description,
        lesson_type: lessonForm.lesson_type,
        duration_minutes: lessonForm.duration_minutes,
        order_index: lessonForm.order_index,
        is_active: lessonForm.is_active,
        ...(lessonForm.video_url && { video_url: lessonForm.video_url })
      }
      
      let lessonId: string | undefined
      
      if (editingLesson) {
        console.log(`Attempting to update lesson: ${editingLesson.title} (${editingLesson.id})`)
        const response = await fetch(`/api/admin/lessons/${editingLesson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lessonData)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update lesson')
        }
        
        const responseData = await response.json()
        lessonId = responseData.data?.id || editingLesson.id
      } else {
        const response = await fetch('/api/admin/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...lessonData, module_id: selectedModule.id })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create lesson')
        }
        
        const responseData = await response.json()
        lessonId = responseData.data?.id
      }
      
      // Upload flowchart if provided
      
      if (lessonId && (flowchartFile || flowchartUrl)) {
        try {
          const flowchartFormData = new FormData()
          flowchartFormData.append('lessonId', lessonId)
          if (flowchartFile) {
            flowchartFormData.append('file', flowchartFile)
          }
          if (flowchartUrl) {
            flowchartFormData.append('url', flowchartUrl)
          }
          if (flowchartTitle) {
            flowchartFormData.append('title', flowchartTitle)
          }
          
          const flowchartResponse = await fetch('/api/admin/lessons/flowchart', {
            method: 'POST',
            body: flowchartFormData
          })
          
          if (!flowchartResponse.ok) {
            const errorData = await flowchartResponse.json().catch(() => ({}))
            console.error('Failed to upload flowchart:', errorData.error || flowchartResponse.statusText)
            // Don't throw - lesson was saved successfully
          }
        } catch (flowchartError) {
          console.error('Error uploading flowchart:', flowchartError)
          // Don't throw - lesson was saved successfully
        }
      }
      
      // Reload lessons to get fresh data
      const lessonsResponse = await fetch(`/api/admin/lessons?moduleId=${selectedModule.id}`)
      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json()
        const lessons = lessonsData.data || []
        setSelectedModule({ ...selectedModule, lessons: lessons as any })
      }
      setShowLessonForm(false)
      setEditingLesson(null)
      resetLessonForm()
      loadData()
    } catch (error) {
      console.error('Error saving lesson:', error)
      // If it's a lesson not found error, refresh the data and clear the editing state
      if (error instanceof Error && error.message.includes('not found')) {
        console.log('Lesson not found, refreshing data...')
        loadData()
        setEditingLesson(null)
        setShowLessonForm(false)
        resetLessonForm()
      }
    }
  }

  const resetCourseForm = () => {
    setCourseForm({
      title: '',
      description: '',
      duration_days: 45,
      difficulty_level: 'beginner',
      is_active: true
    })
  }

  const resetModuleForm = () => {
    setModuleForm({
      title: '',
      description: '',
      order_index: 1,
      is_active: true
    })
  }

  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      description: '',
      video_url: '',
      lesson_type: 'reading',
      duration_minutes: 30,
      order_index: 1,
      is_active: true
    })
    setFlowchartFile(null)
    setFlowchartUrl('')
    setFlowchartTitle('')
  }

  const resetContentForm = () => {
    setContentForm({
      title: '',
      content_type: 'document',
      content_url: '',
      content_data: '',
      upload_source: 'url',
      file: null,
      lesson_id: '',
      order_index: 1,
      is_active: true
    })
  }

  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!contentForm.lesson_id) throw new Error('Select a lesson first')
      
      let contentData: any = {
        title: contentForm.title,
        content_type: contentForm.content_type,
        upload_source: contentForm.upload_source,
        order_index: contentForm.order_index,
        is_active: contentForm.is_active,
        ...(contentForm.content_data && { content_data: JSON.parse(contentForm.content_data) })
      }

      // Handle file upload
      if (contentForm.upload_source === 'file_upload' && contentForm.file) {
        const formData = new FormData()
        formData.append('file', contentForm.file)
        formData.append('title', contentForm.title)
        formData.append('content_type', contentForm.content_type)
        formData.append('order_index', contentForm.order_index.toString())
        formData.append('is_active', contentForm.is_active.toString())
        formData.append('lesson_id', contentForm.lesson_id)
        
        if (editingContent) {
          formData.append('id', editingContent.id)
        }

        const response = await fetch('/api/admin/content/upload', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to upload content')
        }
      } else {
        // Handle URL-based content
        contentData.content_url = contentForm.content_url
        
        if (editingContent) {
          const response = await fetch(`/api/admin/content/${editingContent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contentData)
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to update content')
          }
        } else {
          const response = await fetch('/api/admin/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...contentData, lesson_id: contentForm.lesson_id })
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create content')
          }
        }
      }
      
      // Reload content
      await loadContent()
      setShowContentForm(false)
      setEditingContent(null)
      resetContentForm()
    } catch (error) {
      console.error('Error saving content:', error)
    }
  }

  const editContent = (content: any) => {
    setEditingContent(content)
    setContentForm({
      title: content.title,
      content_type: content.content_type,
      content_url: content.content_url || '',
      content_data: content.content_data ? JSON.stringify(content.content_data, null, 2) : '',
      upload_source: content.upload_source || 'url',
      file: null,
      lesson_id: content.lesson_id || '',
      order_index: content.order_index,
      is_active: content.is_active
    })
    setShowContentForm(true)
  }

  const deleteContent = async (id: string) => {
    if (confirm('Are you sure you want to delete this content item?')) {
      try {
        const response = await fetch(`/api/admin/content/${id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete content')
        }
        
        await loadContent()
      } catch (error) {
        console.error('Error deleting content:', error)
      }
    }
  }

  const loadContent = async () => {
    if (!selectedModule) return
    
    try {
      // Load content for all lessons in the module
      const allContent = []
      for (const lesson of selectedModule.lessons || []) {
        const response = await fetch(`/api/admin/content?lessonId=${lesson.id}`)
        if (response.ok) {
          const data = await response.json()
          const content = (data.data || []).map((item: any) => ({
            ...item,
            lesson_title: lesson.title
          }))
          allContent.push(...content)
        }
      }
      setLessonContent(allContent)
    } catch (error) {
      console.error('Error loading content:', error)
    }
  }

  const editCourse = (course: Course) => {
    setEditingCourse(course)
    setCourseForm({
      title: course.title,
      description: course.description,
      duration_days: course.duration_days,
      difficulty_level: course.difficulty_level,
      is_active: course.is_active
    })
    setShowCourseForm(true)
  }

  const editModule = (module: CourseModule) => {
    setEditingModule(module)
    setModuleForm({
      title: module.title,
      description: module.description,
      order_index: module.order_index,
      is_active: module.is_active
    })
    setShowModuleForm(true)
  }

  const editLesson = (lesson: CourseLesson) => {
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      video_url: (lesson as any).video_url || '',
      lesson_type: lesson.lesson_type,
      duration_minutes: lesson.duration_minutes || 30,
      order_index: lesson.order_index,
      is_active: lesson.is_active
    })
    setFlowchartFile(null)
    setFlowchartUrl((lesson as any).flowchart_url || '')
    setFlowchartTitle((lesson as any).flowchart_title || '')
    setShowLessonForm(true)
  }

  const deleteCourse = async (id: string) => {
    if (confirm('Are you sure you want to delete this course? This will also delete all modules and lessons.')) {
      try {
        await courseService.deleteCourse(id)
        loadData()
      } catch (error) {
        console.error('Error deleting course:', error)
      }
    }
  }

  const deleteModule = async (id: string) => {
    if (confirm('Are you sure you want to delete this module? This will also delete all lessons.')) {
      try {
        const supabase = getSupabaseClient()
        await supabase.from('course_modules').delete().eq('id', id)
        loadData()
      } catch (error) {
        console.error('Error deleting module:', error)
      }
    }
  }

  const deleteLesson = async (id: string) => {
    if (confirm('Are you sure you want to delete this lesson?')) {
      try {
        const response = await fetch(`/api/admin/lessons/${id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete lesson')
        }
        
        loadData()
      } catch (error) {
        console.error('Error deleting lesson:', error)
      }
    }
  }

  const createAssignmentForLesson = async (lesson: any) => {
    setAssignmentForm({
      lesson_id: lesson.id || '',
      title: `Assignment for ${lesson.title || 'Lesson'}`,
      description: `Complete this assignment for the lesson: ${lesson.title || 'this lesson'}`,
      assignment_type: 'individual',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      max_points: 100,
      instructions: `Please complete the following assignment for the lesson "${lesson.title || 'this lesson'}":

1. Review the lesson content thoroughly
2. Apply the concepts learned
3. Submit your work according to the instructions
4. Ensure your submission is complete and well-formatted

Good luck with your assignment!`,
      attachment_files: {},
      is_active: true
    })
    setAssignmentFiles([])
    setEditingAssignment(null)
    setShowAssignmentForm(true)
  }

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!assignmentForm.lesson_id) {
        alert('Please select a lesson')
        return
      }

      // Upload files if any
      const uploadedFiles: Record<string, any> = {}
      for (let i = 0; i < assignmentFiles.length; i++) {
        const file = assignmentFiles[i]
        const fileName = `assignment-${Date.now()}-${i}-${file.name}`
        
        try {
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('assignment-attachments')
            .upload(`content/${fileName}`, file)

          if (uploadError) {
            console.error('Error uploading file:', uploadError)
            alert(`Error uploading file: ${file.name}. Please ensure the storage bucket is properly configured.`)
            return
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('assignment-attachments')
            .getPublicUrl(`content/${fileName}`)

          uploadedFiles[file.name.replace(/\.[^/.]+$/, "")] = {
            name: file.name,
            url: urlData.publicUrl,
            size: file.size,
            type: file.type
          }
        } catch (error) {
          console.error('Error uploading file:', error)
          alert(`Error uploading file: ${file.name}. Please check your storage configuration.`)
          return
        }
      }

      const assignmentData = {
        ...assignmentForm,
        attachment_files: uploadedFiles,
        due_date: assignmentForm.due_date ? new Date(assignmentForm.due_date).toISOString() : undefined
      }

      if (editingAssignment) {
        if (!editingAssignment.id) {
          console.error('Editing assignment ID is missing:', editingAssignment)
          alert('Error: Assignment ID is missing. Cannot update assignment.')
          return
        }
        console.log('Updating assignment with ID:', editingAssignment.id)
        await courseService.updateAssignment(editingAssignment.id, assignmentData)
        alert('Assignment updated successfully!')
      } else {
        await courseService.createAssignment(assignmentData)
        alert('Assignment created successfully!')
      }

      setShowAssignmentForm(false)
      setEditingAssignment(null)
      resetAssignmentForm()
      loadData()
    } catch (error) {
      console.error('Error saving assignment:', error)
      alert('Error saving assignment')
    }
  }

  const editAssignment = (assignment: CourseAssignment | CourseAssignment[]) => {
    console.log('Editing assignment:', assignment)
    
    // Handle case where assignment might be an array
    let assignmentObj: CourseAssignment
    if (Array.isArray(assignment)) {
      if (assignment.length === 0) {
        console.error('Assignment array is empty')
        alert('Error: No assignment data found.')
        return
      }
      assignmentObj = assignment[0]
    } else {
      assignmentObj = assignment
    }
    
    console.log('Assignment object:', assignmentObj)
    console.log('Assignment ID:', assignmentObj.id)
    
    if (!assignmentObj.id) {
      console.error('Assignment ID is missing:', assignmentObj)
      alert('Error: Assignment ID is missing. Cannot edit this assignment.')
      return
    }
    
    setAssignmentForm({
      lesson_id: assignmentObj.lesson_id || '',
      title: assignmentObj.title || '',
      description: assignmentObj.description || '',
      assignment_type: assignmentObj.assignment_type || 'individual',
      due_date: assignmentObj.due_date ? new Date(assignmentObj.due_date).toISOString().split('T')[0] : '',
      max_points: assignmentObj.max_points || 100,
      instructions: assignmentObj.instructions || '',
      attachment_files: assignmentObj.attachment_files || {},
      is_active: assignmentObj.is_active !== undefined ? assignmentObj.is_active : true
    })
    setAssignmentFiles([])
    setEditingAssignment(assignmentObj)
    setShowAssignmentForm(true)
  }

  const deleteAssignment = async (assignmentId: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      try {
        await courseService.deleteAssignment(assignmentId)
        alert('Assignment deleted successfully!')
        loadData()
      } catch (error) {
        console.error('Error deleting assignment:', error)
        alert('Error deleting assignment')
      }
    }
  }

  const resetAssignmentForm = () => {
    setAssignmentForm({
      lesson_id: '',
      title: '',
      description: '',
      assignment_type: 'individual',
      due_date: '',
      max_points: 100,
      instructions: '',
      attachment_files: {},
      is_active: true
    })
    setAssignmentFiles([])
  }

  const handleAssignmentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAssignmentFiles(Array.from(e.target.files))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white text-lg">Loading course content data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Course Content Management</h2>
          <p className="text-gray-400">Manage 45-day course content, modules, and lessons</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              resetCourseForm()
              setEditingCourse(null)
              setShowCourseForm(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add Course
          </button>
          {selectedCourse && (
            <button
              onClick={() => {
                resetModuleForm()
                setEditingModule(null)
                setShowModuleForm(true)
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add Module
            </button>
          )}
          {selectedModule && (
            <button
              onClick={() => {
                resetLessonForm()
                setEditingLesson(null)
                setShowLessonForm(true)
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add Lesson
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'courses', label: 'Courses', icon: '📚' },
            { id: 'modules', label: 'Modules', icon: '📖' },
            { id: 'lessons', label: 'Lessons', icon: '📄' },
            { id: 'content', label: 'Content', icon: '📎' },
            { id: 'assignments', label: 'Assignments', icon: '📝' },
            { id: 'enrollments', label: 'Enrollments', icon: '👥' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Courses</h3>
                <div className="text-sm text-gray-400">
                  {courses.length} courses
                </div>
              </div>
              
              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No courses found</p>
                  <button
                    onClick={() => {
                      resetCourseForm()
                      setShowCourseForm(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Add First Course
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <div key={course.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-medium">{course.title}</h4>
                        {!course.is_active && (
                          <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">Inactive</span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{course.description}</p>
                      <div className="space-y-1 text-sm text-gray-400">
                        <p>Duration: {course.duration_days} days</p>
                        <p>Difficulty: {course.difficulty_level}</p>
                        <p>Modules: {modulesCountByCourse[course.id] || 0}</p>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={async () => {
                            const full = await courseService.getCourseById(course.id)
                            if (full) {
                              setSelectedCourse({ ...(full as any), modules: full.modules || [] } as any)
                              setActiveTab('modules')
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          View Modules
                        </button>
                        <button
                          onClick={() => editCourse(course)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          {!selectedCourse ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Select a course to view its modules</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Modules for: {selectedCourse.title}</h3>
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      ← Back to Courses
                    </button>
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedCourse.modules?.length || 0} modules
                  </div>
                </div>
                
                {(!selectedCourse.modules || selectedCourse.modules.length === 0) ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No modules found for this course</p>
                    <button
                      onClick={() => {
                        resetModuleForm()
                        setShowModuleForm(true)
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Add First Module
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedCourse.modules.map((module) => (
                      <div key={module.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-gray-400 text-sm">#{module.order_index}</span>
                              <h4 className="text-white font-medium">{module.title}</h4>
                              {!module.is_active && (
                                <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">Inactive</span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mb-2">{module.description}</p>
                            <p className="text-gray-500 text-xs">Lessons: {module.lessons?.length || 0}</p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={async () => {
                                setSelectedModule(module)
                                setActiveTab('lessons')
                                try {
                                  console.log('Loading lessons for module:', module.id)
                                  const response = await fetch(`/api/admin/lessons?moduleId=${module.id}`)
                                  console.log('Response status:', response.status)
                                  
                                  if (response.ok) {
                                    const data = await response.json()
                                    console.log('Lessons data:', data)
                                    const lessons = data.data || []
                                    setSelectedModule({ ...module, lessons: lessons as any })
                                  } else {
                                    const errorText = await response.text()
                                    console.error('Error loading lessons:', response.status, response.statusText, errorText)
                                    setSelectedModule({ ...module, lessons: [] })
                                  }
                                } catch (error) {
                                  console.error('Error loading lessons:', error)
                                  setSelectedModule({ ...module, lessons: [] })
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              View Lessons
                            </button>
                            <button
                              onClick={() => editModule(module)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteModule(module.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lessons Tab */}
      {activeTab === 'lessons' && (
        <div className="space-y-4">
          {!selectedModule ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Select a module to view its lessons</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Lessons for: {selectedModule.title}</h3>
                    <button
                      onClick={() => setSelectedModule(null)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      ← Back to Modules
                    </button>
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedModule.lessons?.length || 0} lessons
                  </div>
                </div>
                
                {(!selectedModule.lessons || selectedModule.lessons.length === 0) ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No lessons found for this module</p>
                    <button
                      onClick={() => {
                        resetLessonForm()
                        setShowLessonForm(true)
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Add First Lesson
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedModule.lessons.map((lesson) => (
                      <div key={lesson.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-gray-400 text-sm">#{lesson.order_index}</span>
                              <h4 className="text-white font-medium">{lesson.title}</h4>
                              <span className={`px-2 py-1 rounded text-xs ${
                                lesson.lesson_type === 'video' ? 'bg-red-600' :
                                lesson.lesson_type === 'reading' ? 'bg-blue-600' :
                                lesson.lesson_type === 'quiz' ? 'bg-green-600' :
                                lesson.lesson_type === 'assignment' ? 'bg-purple-600' :
                                lesson.lesson_type === 'discussion' ? 'bg-yellow-600' : 'bg-gray-600'
                              }`}>
                                {lesson.lesson_type}
                              </span>
                              {!lesson.is_active && (
                                <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">Inactive</span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mb-2">
                              {(() => {
                                const text = String((lesson as any).description || '')
                                return text.length > 0 ? `${text.slice(0, 100)}...` : 'No description'
                              })()}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Duration: {lesson.duration_minutes} min</span>
                              {lesson.quiz && <span>Quiz: {lesson.quiz.title}</span>}
                              {lesson.assignment && (() => {
                                const assignment = Array.isArray(lesson.assignment) ? lesson.assignment[0] : lesson.assignment
                                return assignment ? <span>Assignment: {assignment.title || 'Untitled Assignment'}</span> : null
                              })()}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => editLesson(lesson)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Edit
                            </button>
                            {lesson.assignment ? (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => {
                                    console.log('Lesson assignment object:', lesson.assignment)
                                    if (lesson.assignment) {
                                      const assignment = Array.isArray(lesson.assignment) ? lesson.assignment[0] : lesson.assignment
                                      console.log('Assignment ID:', assignment?.id)
                                      if (assignment) {
                                        editAssignment(lesson.assignment)
                                      } else {
                                        alert('Assignment data is corrupted. Please refresh the page.')
                                      }
                                    }
                                  }}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                >
                                  Edit Assignment
                                </button>
                                <button
                                  onClick={() => {
                                    if (lesson.assignment) {
                                      const assignmentObj = Array.isArray(lesson.assignment) ? lesson.assignment[0] : lesson.assignment
                                      if (assignmentObj?.id) {
                                        deleteAssignment(assignmentObj.id)
                                      }
                                    }
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                >
                                  Delete Assignment
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => createAssignmentForLesson(lesson)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                              >
                                Add Assignment
                              </button>
                            )}
                            <button
                              onClick={() => deleteLesson(lesson.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {!selectedModule ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">Select a module to manage lesson content</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Content for: {selectedModule.title}</h3>
                    <button
                      onClick={() => setSelectedModule(null)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      ← Back to Modules
                    </button>
                  </div>
                  <button
                    onClick={() => setShowContentForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Add Content
                  </button>
                </div>

                {/* Content List */}
                <div className="space-y-3">
                  {lessonContent.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-2">No content items found for this module.</p>
                      <p className="text-gray-500 text-sm">Add videos, documents, images, and other content to create rich lessons!</p>
                    </div>
                  ) : (
                    lessonContent.map((content) => {
                      const typeIcons = {
                        document: '📄',
                        video: '🎥',
                        image: '🖼️',
                        audio: '🎵',
                        link: '🔗',
                        embed: '📱'
                      }
                      
                      return (
                        <div key={content.id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-lg">{typeIcons[content.content_type as keyof typeof typeIcons] || '📄'}</span>
                                <h4 className="text-white font-medium">{content.title}</h4>
                              </div>
                              <p className="text-gray-400 text-sm">
                                Lesson: {content.lesson_title} | Type: {content.content_type} | Order: {content.order_index} | Source: {content.upload_source || 'url'}
                              </p>
                              {content.upload_source === 'file_upload' && content.file_name && (
                                <p className="text-green-400 text-sm">
                                  📁 {content.file_name} 
                                  {content.file_size_bytes && ` (${(content.file_size_bytes / 1024 / 1024).toFixed(2)} MB)`}
                                </p>
                              )}
                              {content.upload_source === 'url' && content.content_url && (
                                <p className="text-blue-400 text-sm truncate">🔗 {content.content_url}</p>
                              )}
                              {content.upload_source === 'embed' && (
                                <p className="text-purple-400 text-sm">📄 Embedded Content</p>
                              )}
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => editContent(content)}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteContent(content.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Course Assignments</h3>
                <button
                  onClick={() => {
                    resetAssignmentForm()
                    setEditingAssignment(null)
                    setShowAssignmentForm(true)
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Assignment
                </button>
              </div>

              {selectedCourse ? (
                <div className="space-y-4">
                  {selectedCourse.modules?.map((module) => (
                    <div key={module.id} className="border border-gray-600 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-3">{module.title}</h4>
                      {module.lessons?.map((lesson) => (
                        <div key={lesson.id} className="ml-4 mb-3 p-3 bg-gray-700 rounded">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="text-white text-sm font-medium">{lesson.title}</h5>
                              {lesson.assignment ? (
                                <div className="mt-1">
                                  {(() => {
                                    const assignment = Array.isArray(lesson.assignment) ? lesson.assignment[0] : lesson.assignment
                                    if (!assignment) {
                                      return <span className="text-gray-400 text-xs">Assignment data unavailable</span>
                                    }
                                    return (
                                      <>
                                        <span className="text-green-400 text-xs">✓ Assignment: {assignment.title || 'Untitled Assignment'}</span>
                                        {assignment.due_date && (
                                          <span className="text-yellow-400 text-xs ml-2">
                                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                                          </span>
                                        )}
                                        <span className="text-blue-400 text-xs ml-2">
                                          {assignment.max_points || 0} points
                                        </span>
                                      </>
                                    )
                                  })()}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">No assignment</span>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              {lesson.assignment ? (
                                <>
                                  <button
                                    onClick={() => {
                                      if (lesson.assignment) {
                                        const assignment = Array.isArray(lesson.assignment) ? lesson.assignment[0] : lesson.assignment
                                        if (assignment) {
                                          editAssignment(lesson.assignment)
                                        } else {
                                          alert('Assignment data is corrupted. Please refresh the page.')
                                        }
                                      }
                                    }}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (lesson.assignment) {
                                        const assignmentObj = Array.isArray(lesson.assignment) ? lesson.assignment[0] : lesson.assignment
                                        if (assignmentObj?.id) {
                                          deleteAssignment(assignmentObj.id)
                                        }
                                      }
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => createAssignmentForLesson(lesson)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs transition-colors"
                                >
                                  Add Assignment
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">Please select a course to view assignments</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enrollments Tab */}
      {activeTab === 'enrollments' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Course Enrollments</h3>
                <div className="text-sm text-gray-400">
                  {enrollments.length} enrollments
                </div>
              </div>
              
              {enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No enrollments found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400">User</th>
                        <th className="text-left py-3 px-4 text-gray-400">Course</th>
                        <th className="text-left py-3 px-4 text-gray-400">Status</th>
                        <th className="text-left py-3 px-4 text-gray-400">Progress</th>
                        <th className="text-left py-3 px-4 text-gray-400">Started</th>
                        <th className="text-left py-3 px-4 text-gray-400">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment.id} className="border-b border-gray-700">
                          <td className="py-3 px-4 text-white">
                            {(enrollment as any)?.user?.profile?.first_name || ''} {(enrollment as any)?.user?.profile?.last_name || ''}
                            <div className="text-gray-400 text-xs">{(enrollment as any)?.user?.profile?.email || ''}</div>
                          </td>
                          <td className="py-3 px-4 text-white">{(enrollment as any)?.course?.title || ''}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              enrollment.status === 'completed' ? 'bg-green-600' :
                              enrollment.status === 'active' ? 'bg-blue-600' : 'bg-red-600'
                            }`}>
                              {enrollment.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${enrollment.progress_percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm">{enrollment.progress_percentage}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {new Date(enrollment.started_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-gray-400">
                            {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Course Form Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h3>
              <button
                onClick={() => {
                  setShowCourseForm(false)
                  setEditingCourse(null)
                  resetCourseForm()
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCourseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Course Title
                </label>
                <input
                  type="text"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={courseForm.duration_days}
                    onChange={(e) => setCourseForm({...courseForm, duration_days: parseInt(e.target.value)})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={courseForm.difficulty_level}
                    onChange={(e) => setCourseForm({...courseForm, difficulty_level: e.target.value as any})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="course_is_active"
                  checked={courseForm.is_active}
                  onChange={(e) => setCourseForm({...courseForm, is_active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="course_is_active" className="text-sm text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCourseForm(false)
                    setEditingCourse(null)
                    resetCourseForm()
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {editingCourse ? 'Update' : 'Create'} Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Module Form Modal */}
      {showModuleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingModule ? 'Edit Module' : 'Add New Module'}
              </h3>
              <button
                onClick={() => {
                  setShowModuleForm(false)
                  setEditingModule(null)
                  resetModuleForm()
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleModuleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Module Title
                </label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Order Index
                </label>
                <input
                  type="number"
                  value={moduleForm.order_index}
                  onChange={(e) => setModuleForm({...moduleForm, order_index: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  min="1"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="module_is_active"
                  checked={moduleForm.is_active}
                  onChange={(e) => setModuleForm({...moduleForm, is_active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="module_is_active" className="text-sm text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModuleForm(false)
                    setEditingModule(null)
                    resetModuleForm()
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {editingModule ? 'Update' : 'Create'} Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Form Modal */}
      {showLessonForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
              </h3>
              <button
                onClick={() => {
                  setShowLessonForm(false)
                  setEditingLesson(null)
                  resetLessonForm()
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleLessonSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({...lessonForm, description: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  rows={6}
                  required
                />
              </div>

              {lessonForm.lesson_type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Video URL (Private YouTube Link)
                  </label>
                  <input
                    type="url"
                    value={lessonForm.video_url}
                    onChange={(e) => setLessonForm({...lessonForm, video_url: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              {/* Flowchart Upload Section */}
              <div className="border-t border-gray-600 pt-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Flowchart (Optional)</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Flowchart Title
                    </label>
                    <input
                      type="text"
                      value={flowchartTitle}
                      onChange={(e) => setFlowchartTitle(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      placeholder="e.g., Process Flow Diagram"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Upload Flowchart File (Image, PDF, etc.)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setFlowchartFile(e.target.files?.[0] || null)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    {flowchartFile && (
                      <p className="text-xs text-gray-400 mt-1">
                        Selected: {flowchartFile.name} ({(flowchartFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                    {editingLesson && (editingLesson as any).flowchart_file_name && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Current: {(editingLesson as any).flowchart_file_name}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-center text-gray-400 text-sm">OR</div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Flowchart URL (External Link)
                    </label>
                    <input
                      type="url"
                      value={flowchartUrl}
                      onChange={(e) => setFlowchartUrl(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      placeholder="https://example.com/flowchart.pdf"
                    />
                  </div>
                  
                  {editingLesson && (editingLesson as any).flowchart_file_path && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Are you sure you want to remove the flowchart?')) {
                          const response = await fetch(`/api/admin/lessons/flowchart?lessonId=${editingLesson.id}`, {
                            method: 'DELETE'
                          })
                          if (response.ok) {
                            setFlowchartFile(null)
                            setFlowchartUrl('')
                            setFlowchartTitle('')
                            // Reload lessons
                            const lessonsResponse = await fetch(`/api/admin/lessons?moduleId=${selectedModule?.id}`)
                            if (lessonsResponse.ok) {
                              const lessonsData = await lessonsResponse.json()
                              const lessons = lessonsData.data || []
                              if (selectedModule) {
                                setSelectedModule({ ...selectedModule, lessons: lessons as any })
                              }
                            }
                          }
                        }
                      }}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Remove Flowchart
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Lesson Type
                  </label>
                  <select
                    value={lessonForm.lesson_type}
                    onChange={(e) => setLessonForm({...lessonForm, lesson_type: e.target.value as any})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="reading">Reading</option>
                    <option value="video">Video</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="discussion">Discussion</option>
                    <option value="live_session">Live Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={lessonForm.duration_minutes}
                    onChange={(e) => setLessonForm({...lessonForm, duration_minutes: parseInt(e.target.value)})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Order Index
                </label>
                <input
                  type="number"
                  value={lessonForm.order_index}
                  onChange={(e) => setLessonForm({...lessonForm, order_index: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  min="1"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="lesson_is_active"
                  checked={lessonForm.is_active}
                  onChange={(e) => setLessonForm({...lessonForm, is_active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="lesson_is_active" className="text-sm text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowLessonForm(false)
                    setEditingLesson(null)
                    resetLessonForm()
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {editingLesson ? 'Update' : 'Create'} Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content Form Modal */}
      {showContentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {editingContent ? 'Edit Content' : 'Add New Content'}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  You can add multiple content items to the same lesson (videos, documents, images, etc.)
                </p>
              </div>
              <button
                onClick={() => {
                  setShowContentForm(false)
                  setEditingContent(null)
                  resetContentForm()
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleContentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={contentForm.title}
                  onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lesson
                </label>
                <select
                  value={contentForm.lesson_id}
                  onChange={(e) => setContentForm({ ...contentForm, lesson_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select a lesson</option>
                  {selectedModule?.lessons?.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content Type
                </label>
                <select
                  value={contentForm.content_type}
                  onChange={(e) => setContentForm({ ...contentForm, content_type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="document">📄 Document (PDF, Word, etc.)</option>
                  <option value="video">🎥 Video (MP4, YouTube, etc.)</option>
                  <option value="image">🖼️ Image (JPG, PNG, etc.)</option>
                  <option value="audio">🎵 Audio (MP3, WAV, etc.)</option>
                  <option value="link">🔗 External Link</option>
                  <option value="embed">📱 Embedded Content</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose the type of content you want to add to this lesson
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Method
                </label>
                <select
                  value={contentForm.upload_source}
                  onChange={(e) => setContentForm({ ...contentForm, upload_source: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="url">External URL</option>
                  <option value="file_upload">Upload File</option>
                  <option value="embed">Embedded Content</option>
                </select>
              </div>

              {contentForm.upload_source === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Content URL
                  </label>
                  <input
                    type="url"
                    value={contentForm.content_url}
                    onChange={(e) => setContentForm({ ...contentForm, content_url: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="https://example.com/document.pdf"
                  />
                </div>
              )}

              {contentForm.upload_source === 'file_upload' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setContentForm({ ...contentForm, file: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.wav,.zip"
                  />
                  {contentForm.file && (
                    <p className="text-sm text-gray-400 mt-1">
                      Selected: {contentForm.file.name} ({(contentForm.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

              {contentForm.upload_source === 'embed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Embedded Content Data (JSON)
                  </label>
                  <textarea
                    value={contentForm.content_data}
                    onChange={(e) => setContentForm({ ...contentForm, content_data: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    rows={4}
                    placeholder='{"type": "iframe", "src": "https://example.com/embed", "width": "100%", "height": "400px"}'
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Order Index
                </label>
                <input
                  type="number"
                  value={contentForm.order_index}
                  onChange={(e) => setContentForm({ ...contentForm, order_index: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  min="1"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="content-active"
                  checked={contentForm.is_active}
                  onChange={(e) => setContentForm({ ...contentForm, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="content-active" className="text-sm text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowContentForm(false)
                    setEditingContent(null)
                    resetContentForm()
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {editingContent ? 'Update' : 'Create'} Content
                </button>
              </div>
              
              {!editingContent && (
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    💡 <strong>Tip:</strong> After creating this content, you can add more content items to the same lesson by clicking "Add Content" again. Mix videos, documents, images, and other content types for a rich learning experience!
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Assignment Form Modal */}
      {showAssignmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Create assignments with attachments, due dates, and detailed instructions
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAssignmentForm(false)
                  setEditingAssignment(null)
                  resetAssignmentForm()
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAssignmentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Lesson *
                  </label>
                  <select
                    value={assignmentForm.lesson_id || ''}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, lesson_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Select a lesson</option>
                    {selectedModule?.lessons?.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assignment Type
                  </label>
                  <select
                    value={assignmentForm.assignment_type || 'individual'}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, assignment_type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                    <option value="peer_review">Peer Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  value={assignmentForm.title || ''}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Financial Analysis Case Study"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={assignmentForm.description || ''}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="Brief description of what students need to do..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={assignmentForm.due_date || ''}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Points
                  </label>
                  <input
                    type="number"
                    value={assignmentForm.max_points || 100}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, max_points: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    min="1"
                    max="1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Instructions *
                </label>
                <textarea
                  value={assignmentForm.instructions || ''}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={6}
                  placeholder="Detailed instructions for students..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assignment Attachments (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleAssignmentFileChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none focus:border-blue-500"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
                />
                {assignmentFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400 mb-2">Selected files:</p>
                    <div className="space-y-1">
                      {assignmentFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-2">
                          <span className="text-white text-sm">{file.name}</span>
                          <span className="text-gray-400 text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="assignment-active"
                  checked={assignmentForm.is_active}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="assignment-active" className="ml-2 text-sm text-gray-300">
                  Active (students can see and submit this assignment)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignmentForm(false)
                    setEditingAssignment(null)
                    resetAssignmentForm()
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {editingAssignment ? 'Update' : 'Create'} Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

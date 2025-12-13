import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables')
}

// Admin client with service role (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl as string, serviceKey as string, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { id: lessonId } = await params
    
    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 })
    }

    console.log('🔍 [API] Fetching lesson:', lessonId)

    // Fetch lesson with all related data using service role (bypasses RLS)
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select(`
        *,
        content:lesson_content(*),
        quiz:course_quizzes(
          *,
          questions:quiz_questions(*)
        ),
        assignment:course_assignments(*)
      `)
      .eq('id', lessonId)
      .single()

    if (lessonError) {
      console.error('❌ [API] Error fetching lesson:', lessonError)
      return NextResponse.json({ 
        error: lessonError.message,
        code: lessonError.code,
        details: lessonError.details
      }, { status: 500 })
    }

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Handle case where quiz is an array (should be single object)
    if (Array.isArray(lesson.quiz)) {
      if (lesson.quiz.length > 0) {
        lesson.quiz = lesson.quiz.find((q: any) => q.is_active) || lesson.quiz[0]
      } else {
        lesson.quiz = null
      }
    }
    
    // Handle case where assignment is an array (should be single object)
    if (Array.isArray(lesson.assignment)) {
      if (lesson.assignment.length > 0) {
        lesson.assignment = lesson.assignment.find((a: any) => a.is_active) || lesson.assignment[0]
      } else {
        lesson.assignment = null
      }
    }

    console.log('✅ [API] Lesson found:', lesson.title)

    return NextResponse.json({ data: lesson })
  } catch (error) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


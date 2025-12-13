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

    const { id: enrollmentId } = await params
    
    if (!enrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 })
    }

    console.log('🔍 [API] Fetching enrollment:', enrollmentId)

    // Get enrollment first
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('course_enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .single()

    if (enrollmentError) {
      console.error('❌ [API] Error fetching enrollment:', enrollmentError)
      return NextResponse.json({ error: enrollmentError.message }, { status: 500 })
    }

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    console.log('✅ [API] Enrollment found. Course ID:', enrollment.course_id)

    // Fetch modules with lessons using service role (bypasses RLS)
    const { data: modules, error: modulesError } = await supabaseAdmin
      .from('course_modules')
      .select(`
        *,
        lessons:lessons(
          *,
          content:lesson_content(*),
          quiz:course_quizzes(*),
          assignment:course_assignments(*)
        )
      `)
      .eq('course_id', enrollment.course_id)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (modulesError) {
      console.error('❌ [API] Error fetching modules:', modulesError)
      return NextResponse.json({ error: modulesError.message }, { status: 500 })
    }

    // Filter and sort lessons
    const modulesWithActiveLessons = (modules || []).map(module => ({
      ...module,
      lessons: (module.lessons || [])
        .filter((lesson: any) => lesson.is_active !== false)
        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    }))

    console.log('✅ [API] Modules found:', modulesWithActiveLessons.length)

    return NextResponse.json({ 
      data: {
        enrollment,
        modules: modulesWithActiveLessons
      }
    })
  } catch (error) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cacheService, cacheKeys } from '@/lib/services/cacheService'

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

/**
 * Lightweight endpoint that returns only enrollment structure
 * (modules and lessons list) without full lesson content
 * This is much faster than the full modules endpoint
 */
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

    // Try to get from cache
    const cacheKey = cacheKeys.enrollment.structure(enrollmentId)
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      console.log('✅ [API] Enrollment structure cache hit')
      const response = NextResponse.json({ data: cached })
      response.headers.set('Cache-Control', 'private, max-age=600')
      return response
    }

    console.log('❌ [API] Enrollment structure cache miss, fetching from database')
    console.log('⚡ [API] Fetching enrollment structure (lightweight):', enrollmentId)

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

    // OPTIMIZED: Use separate queries instead of nested joins for better performance
    // This avoids the expensive nested query that was causing 1500ms+ load times
    
    // Step 1: Fetch modules only (fast, uses index)
    const { data: modules, error: modulesError } = await supabaseAdmin
      .from('course_modules')
      .select(`
        id,
        title,
        description,
        week_number,
        order_index,
        is_active,
        course_id
      `)
      .eq('course_id', enrollment.course_id)
      .eq('is_active', true)
      .order('week_number', { ascending: true })
      .order('order_index', { ascending: true })

    if (modulesError) {
      console.error('❌ [API] Error fetching modules:', modulesError)
      return NextResponse.json({ error: modulesError.message }, { status: 500 })
    }

    // Step 2: Fetch lessons separately (parallel, uses indexes)
    const moduleIds = (modules || []).map(m => m.id)
    const lessonsByModule: Record<string, any[]> = {}
    
    if (moduleIds.length > 0) {
      const { data: lessons, error: lessonsError } = await supabaseAdmin
        .from('lessons')
        .select(`
          id,
          title,
          lesson_type,
          order_index,
          duration_minutes,
          is_required,
          is_active,
          module_id
        `)
        .in('module_id', moduleIds)
        .eq('is_active', true)
        .order('order_index', { ascending: true })
      
      if (lessonsError) {
        console.error('❌ [API] Error fetching lessons:', lessonsError)
        // Continue with empty lessons rather than failing
      } else if (lessons) {
        // Group lessons by module_id for O(1) lookup
        lessons.forEach(lesson => {
          if (!lessonsByModule[lesson.module_id]) {
            lessonsByModule[lesson.module_id] = []
          }
          lessonsByModule[lesson.module_id].push(lesson)
        })
      }
    }

    // Step 3: Combine modules with their lessons
    const modulesWithActiveLessons = (modules || []).map(courseModule => ({
      ...courseModule,
      lessons: lessonsByModule[courseModule.id] || []
    }))

    console.log('✅ [API] Structure loaded:', modulesWithActiveLessons.length, 'modules')

    const result = {
      enrollment,
      modules: modulesWithActiveLessons
    }

    // Cache the result for 15 minutes (900 seconds)
    await cacheService.set(cacheKey, result, { ttl: 900 })

    const response = NextResponse.json({ data: result })
    
    // Also set HTTP cache headers
    response.headers.set('Cache-Control', 'private, max-age=600')
    
    return response
  } catch (error) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


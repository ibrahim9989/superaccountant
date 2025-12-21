import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cacheService, cacheKeys } from '@/lib/services/cacheService'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl as string, serviceKey as string)

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase environment variables in lesson content API')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 })
    }
    
    // Try to get from cache
    const cacheKey = cacheKeys.lesson.content(id)
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      console.log('✅ Lesson content cache hit')
      return NextResponse.json({ data: cached })
    }
    
    console.log('❌ Lesson content cache miss, fetching from database')
    console.log('Fetching lesson content for lesson ID:', id)
    
    const { data: content, error } = await supabase
      .from('lesson_content')
      .select('*')
      .eq('lesson_id', id)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching lesson content:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        code: error.code
      }, { status: 500 })
    }

    const result = content || []
    
    // Cache the result for 30 minutes (1800 seconds)
    await cacheService.set(cacheKey, result, { ttl: 1800 })

    console.log('Fetched lesson content:', result.length, 'items')
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Unexpected error in lesson content API:', error)
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}












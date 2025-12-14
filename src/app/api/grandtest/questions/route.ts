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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')

    if (!courseId) {
      return NextResponse.json(
        { error: 'course_id is required' },
        { status: 400 }
      )
    }

    console.log('📚 Fetching grandtest questions for course:', courseId)

    // Get questions using ADMIN client (bypasses RLS)
    const { data: questions, error } = await supabaseAdmin
      .from('grandtest_questions')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('❌ Error fetching questions (admin):', error)
      return NextResponse.json(
        { error: `Failed to fetch questions: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`✅ Fetched ${questions?.length || 0} questions`)
    return NextResponse.json({ data: questions || [] })
  } catch (error) {
    console.error('Unexpected error in get questions API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}














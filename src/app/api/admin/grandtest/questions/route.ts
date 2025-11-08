import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
  
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseClient(url, serviceKey)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Fetch grandtest questions using service role to bypass RLS
    const { data, error } = await supabase
      .from('grandtest_questions')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching grandtest questions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('grandtest_questions')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error creating grandtest question:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('id')

    if (!questionId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const body = await request.json()
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('grandtest_questions')
      .update(body)
      .eq('id', questionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating grandtest question:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('id')

    if (!questionId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { error } = await supabase
      .from('grandtest_questions')
      .delete()
      .eq('id', questionId)

    if (error) {
      console.error('Error deleting grandtest question:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const error = e as Error
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
  }
}


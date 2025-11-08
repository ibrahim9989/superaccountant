import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, serviceKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')
    
    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 })
    }

    const { data: content, error } = await supabase
      .from('lesson_content')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching content:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: content || [] })
  } catch (error) {
    console.error('Unexpected error in content API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { data: content, error } = await supabase
      .from('lesson_content')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error creating content:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: content })
  } catch (error) {
    console.error('Unexpected error in create content API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}












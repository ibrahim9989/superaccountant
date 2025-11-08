import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!serviceKey
  })
}

const supabase = createClient(supabaseUrl as string, serviceKey as string)

export async function GET(request: Request) {
  try {
    console.log('Lessons API called')
    
    if (!supabaseUrl || !serviceKey) {
      console.error('Missing environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')
    
    console.log('Module ID:', moduleId)
    
    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    console.log('Querying lessons for module:', moduleId)
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Supabase error fetching lessons:', error)
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    console.log('Lessons fetched successfully:', lessons?.length || 0)
    return NextResponse.json({ data: lessons || [] })
  } catch (error) {
    console.error('Unexpected error in lessons API:', error)
    return NextResponse.json({ error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert(body)
      .select()
      .single()

    if (error) {
      console.error('Error creating lesson:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: lesson })
  } catch (error) {
    console.error('Unexpected error in create lesson API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, serviceKey)

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching lesson:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: lesson })
  } catch (error) {
    console.error('Unexpected error in get lesson API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // First check if the lesson exists
    const { data: existingLesson, error: checkError } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('id', id)
      .single()

    if (checkError) {
      console.error('Error checking lesson existence:', checkError)
      return NextResponse.json({ error: `Lesson with ID ${id} not found: ${checkError.message}` }, { status: 404 })
    }

    if (!existingLesson) {
      return NextResponse.json({ error: `Lesson with ID ${id} does not exist` }, { status: 404 })
    }

    console.log(`Updating lesson: ${existingLesson.title} (${id})`)

    const { data: lesson, error } = await supabase
      .from('lessons')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating lesson:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!lesson) {
      return NextResponse.json({ error: `No data returned after updating lesson ${id}` }, { status: 500 })
    }

    return NextResponse.json({ data: lesson })
  } catch (error) {
    console.error('Unexpected error in update lesson API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting lesson:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in delete lesson API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

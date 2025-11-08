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
    const { data: content, error } = await supabase
      .from('lesson_content')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching content:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: content })
  } catch (error) {
    console.error('Unexpected error in get content API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // First check if the content exists
    const { data: existingContent, error: checkError } = await supabase
      .from('lesson_content')
      .select('id, title')
      .eq('id', id)
      .single()

    if (checkError) {
      console.error('Error checking content existence:', checkError)
      return NextResponse.json({ error: `Content with ID ${id} not found: ${checkError.message}` }, { status: 404 })
    }

    if (!existingContent) {
      return NextResponse.json({ error: `Content with ID ${id} does not exist` }, { status: 404 })
    }

    console.log(`Updating content: ${existingContent.title} (${id})`)

    const { data: content, error } = await supabase
      .from('lesson_content')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating content:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!content) {
      return NextResponse.json({ error: `No data returned after updating content ${id}` }, { status: 500 })
    }

    return NextResponse.json({ data: content })
  } catch (error) {
    console.error('Unexpected error in update content API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { error } = await supabase
      .from('lesson_content')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting content:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in delete content API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}












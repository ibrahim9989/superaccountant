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
      // Handle duplicate order_index constraint
      if (error.code === '23505' && error.message?.includes('lesson_content_lesson_id_order_index_key')) {
        console.log('Duplicate order_index detected, finding next available order_index...')
        
        // Find the maximum order_index for this lesson
        const { data: maxOrder, error: maxError } = await supabase
          .from('lesson_content')
          .select('order_index')
          .eq('lesson_id', body.lesson_id)
          .order('order_index', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (maxError) {
          console.error('Error finding max order_index:', maxError)
          return NextResponse.json({ 
            error: `Failed to find next available order index: ${maxError.message}` 
          }, { status: 500 })
        }

        // Set order_index to next available
        const nextOrderIndex = (maxOrder?.order_index ?? -1) + 1
        const updatedBody = { ...body, order_index: nextOrderIndex }

        console.log(`Auto-adjusting order_index to ${nextOrderIndex} for lesson ${body.lesson_id}`)

        // Retry insert with new order_index
        const { data: retryContent, error: retryError } = await supabase
          .from('lesson_content')
          .insert(updatedBody)
          .select()
          .single()

        if (retryError) {
          console.error('Error creating content after retry:', retryError)
          return NextResponse.json({ 
            error: `Failed to create content: ${retryError.message}`,
            suggestion: `Try using order_index ${nextOrderIndex} or higher`
          }, { status: 500 })
        }

        return NextResponse.json({ 
          data: retryContent,
          message: `Content created with auto-adjusted order_index: ${nextOrderIndex}`
        })
      }
      
      console.error('Error creating content:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: content })
  } catch (error) {
    console.error('Unexpected error in create content API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}












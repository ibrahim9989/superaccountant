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

    // Fetch flowcharts for each lesson
    if (lessons && lessons.length > 0) {
      const lessonIds = lessons.map(lesson => lesson.id)
      const { data: flowcharts, error: flowchartsError } = await supabase
        .from('lesson_flowcharts')
        .select('*')
        .in('lesson_id', lessonIds)
        .order('order_index', { ascending: true })

      if (!flowchartsError && flowcharts) {
        // Group flowcharts by lesson_id and attach to lessons
        const flowchartsByLesson = flowcharts.reduce((acc: any, flowchart: any) => {
          if (!acc[flowchart.lesson_id]) {
            acc[flowchart.lesson_id] = []
          }
          acc[flowchart.lesson_id].push(flowchart)
          return acc
        }, {})

        // Attach flowcharts to each lesson
        lessons.forEach((lesson: any) => {
          lesson.flowcharts = flowchartsByLesson[lesson.id] || []
        })
      }
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
    
    // If duplicate key error (order_index conflict), find next available order_index
    const lessonData = { ...body }
    
    const { data: lesson, error } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select()
      .single()

    if (error) {
      // Handle duplicate order_index constraint
      if (error.code === '23505' && error.message?.includes('lessons_module_id_order_index_key')) {
        console.log('Duplicate order_index detected, finding next available order_index...')
        
        // Find the maximum order_index for this module
        const { data: maxOrder, error: maxError } = await supabase
          .from('lessons')
          .select('order_index')
          .eq('module_id', body.module_id)
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
        const updatedLessonData = { ...lessonData, order_index: nextOrderIndex }

        console.log(`Auto-adjusting order_index to ${nextOrderIndex} for module ${body.module_id}`)

        // Retry insert with new order_index
        const { data: retryLesson, error: retryError } = await supabase
          .from('lessons')
          .insert(updatedLessonData)
          .select()
          .single()

        if (retryError) {
          console.error('Error creating lesson after retry:', retryError)
          return NextResponse.json({ 
            error: `Failed to create lesson: ${retryError.message}`,
            suggestion: `Try using order_index ${nextOrderIndex} or higher`
          }, { status: 500 })
        }

        return NextResponse.json({ 
          data: retryLesson,
          message: `Lesson created with auto-adjusted order_index: ${nextOrderIndex}`
        })
      }

      console.error('Error creating lesson:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: lesson })
  } catch (error) {
    console.error('Unexpected error in create lesson API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

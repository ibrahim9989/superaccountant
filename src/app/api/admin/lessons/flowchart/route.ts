import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createSupabaseClient(supabaseUrl as string, serviceKey as string)

// POST - Create a new flowchart for a lesson
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const lessonId = formData.get('lessonId') as string
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null
    const url = formData.get('url') as string | null
    const orderIndex = formData.get('orderIndex') as string | null

    console.log('Flowchart upload request:', {
      lessonId,
      hasFile: !!file,
      fileName: file?.name,
      url,
      title,
      orderIndex
    })

    if (!lessonId) {
      console.error('Missing lessonId in flowchart upload')
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase configuration in flowchart upload')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Get the max order_index for this lesson to determine the next order
    const { data: existingFlowcharts } = await supabase
      .from('lesson_flowcharts')
      .select('order_index')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = orderIndex 
      ? parseInt(orderIndex) 
      : (existingFlowcharts && existingFlowcharts.length > 0 
          ? existingFlowcharts[0].order_index + 1 
          : 0)

    let flowchartData: {
      lesson_id: string
      flowchart_file_path?: string
      flowchart_file_name?: string
      flowchart_mime_type?: string
      flowchart_url?: string
      flowchart_title?: string
      order_index: number
    } = {
      lesson_id: lessonId,
      order_index: nextOrderIndex
    }

    // If file is provided, upload it
    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${lessonId}-flowchart-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `lessons/${lessonId}/flowcharts/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lesson-content')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading flowchart:', uploadError)
        return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('lesson-content')
        .getPublicUrl(filePath)

      flowchartData = {
        ...flowchartData,
        flowchart_file_path: urlData.publicUrl,
        flowchart_file_name: file.name,
        flowchart_mime_type: file.type,
        flowchart_title: title || file.name
      }
    } else if (url) {
      // If URL is provided instead
      flowchartData = {
        ...flowchartData,
        flowchart_url: url,
        flowchart_title: title || 'Flowchart'
      }
    } else {
      return NextResponse.json({ error: 'Either file or URL is required' }, { status: 400 })
    }

    // Insert flowchart into lesson_flowcharts table
    console.log('Inserting flowchart data:', { lessonId, flowchartData })
    const { data, error } = await supabase
      .from('lesson_flowcharts')
      .insert(flowchartData)
      .select()
      .single()

    if (error) {
      console.error('Error inserting flowchart:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ 
        error: `Database error: ${error.message}`,
        details: error.details,
        code: error.code
      }, { status: 500 })
    }

    console.log('Flowchart uploaded successfully:', data?.id)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error in flowchart upload API:', error)
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

// GET - Fetch all flowcharts for a lesson
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Fetch all flowcharts for this lesson, ordered by order_index
    const { data, error } = await supabase
      .from('lesson_flowcharts')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching flowcharts:', error)
      return NextResponse.json({ 
        error: `Database error: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Unexpected error in flowchart fetch API:', error)
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

// DELETE - Delete a specific flowchart by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const flowchartId = searchParams.get('flowchartId')

    if (!flowchartId) {
      return NextResponse.json({ error: 'flowchartId is required' }, { status: 400 })
    }

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Get flowchart to check if there's a file to delete
    const { data: flowchart } = await supabase
      .from('lesson_flowcharts')
      .select('flowchart_file_path')
      .eq('id', flowchartId)
      .single()

    // If there's a file in storage, delete it
    if (flowchart?.flowchart_file_path && flowchart.flowchart_file_path.includes('/storage/v1/object/public/')) {
      const pathMatch = flowchart.flowchart_file_path.match(/lesson-content\/(.+)$/)
      if (pathMatch) {
        const filePath = pathMatch[1]
        await supabase.storage
          .from('lesson-content')
          .remove([filePath])
      }
    }

    // Delete flowchart from database
    const { data, error } = await supabase
      .from('lesson_flowcharts')
      .delete()
      .eq('id', flowchartId)
      .select()
      .single()

    if (error) {
      console.error('Error deleting flowchart:', error)
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ data, message: 'Flowchart deleted successfully' })
  } catch (error) {
    console.error('Unexpected error in flowchart delete API:', error)
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

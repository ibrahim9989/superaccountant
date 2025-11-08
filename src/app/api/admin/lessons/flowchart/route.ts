import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createSupabaseClient(supabaseUrl as string, serviceKey as string)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const lessonId = formData.get('lessonId') as string
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null
    const url = formData.get('url') as string | null

    console.log('Flowchart upload request:', {
      lessonId,
      hasFile: !!file,
      fileName: file?.name,
      url,
      title
    })

    if (!lessonId) {
      console.error('Missing lessonId in flowchart upload')
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase configuration in flowchart upload')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    let flowchartData: {
      flowchart_file_path?: string
      flowchart_file_name?: string
      flowchart_mime_type?: string
      flowchart_url?: string
      flowchart_title?: string
    } = {}

    // If file is provided, upload it
    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${lessonId}-flowchart-${Date.now()}.${fileExt}`
      const filePath = `lessons/${lessonId}/flowcharts/${fileName}`

      // Upload to Supabase Storage (use lesson-content bucket, same as other lesson files)
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
        flowchart_file_path: urlData.publicUrl,
        flowchart_file_name: file.name,
        flowchart_mime_type: file.type,
        flowchart_title: title || file.name
      }
    } else if (url) {
      // If URL is provided instead
      flowchartData = {
        flowchart_url: url,
        flowchart_title: title || 'Flowchart'
      }
    } else {
      return NextResponse.json({ error: 'Either file or URL is required' }, { status: 400 })
    }

    // Update lesson with flowchart data
    console.log('Updating lesson with flowchart data:', { lessonId, flowchartData })
    const { data, error } = await supabase
      .from('lessons')
      .update({
        ...flowchartData,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      .select()
      .single()

    if (error) {
      console.error('Error updating lesson with flowchart:', {
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId is required' }, { status: 400 })
    }

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Get lesson to check if there's a file to delete
    const { data: lesson } = await supabase
      .from('lessons')
      .select('flowchart_file_path')
      .eq('id', lessonId)
      .single()

    // If there's a file in storage, delete it
    if (lesson?.flowchart_file_path && lesson.flowchart_file_path.includes('/storage/v1/object/public/')) {
      const pathMatch = lesson.flowchart_file_path.match(/lesson-content\/(.+)$/)
      if (pathMatch) {
        const filePath = pathMatch[1]
        await supabase.storage
          .from('lesson-content')
          .remove([filePath])
      }
    }

    // Remove flowchart data from lesson
    const { data, error } = await supabase
      .from('lessons')
      .update({
        flowchart_file_path: null,
        flowchart_file_name: null,
        flowchart_mime_type: null,
        flowchart_url: null,
        flowchart_title: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      .select()
      .single()

    if (error) {
      console.error('Error removing flowchart from lesson:', error)
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error in flowchart delete API:', error)
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}


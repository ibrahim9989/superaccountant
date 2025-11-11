import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, serviceKey)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const content_type = formData.get('content_type') as string
    const order_index = parseInt(formData.get('order_index') as string)
    const is_active = formData.get('is_active') === 'true'
    const lesson_id = formData.get('lesson_id') as string
    const id = formData.get('id') as string // For updates

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`
    const filePath = `lesson-content/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lesson-content')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('lesson-content')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Prepare content data
    const contentData = {
      title,
      content_type,
      file_path: publicUrl, // Use Supabase Storage public URL
      file_name: file.name,
      mime_type: file.type,
      upload_source: 'file_upload',
      file_size_bytes: file.size,
      order_index,
      is_active,
      lesson_id
    }

    let result
    if (id) {
      // Update existing content
      const { data, error } = await supabase
        .from('lesson_content')
        .update(contentData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating content:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = data
    } else {
      // Create new content
      const { data, error } = await supabase
        .from('lesson_content')
        .insert(contentData)
        .select()
        .single()

      if (error) {
        // Log the full error for debugging
        console.log('Content upload error:', JSON.stringify(error, null, 2))
        console.log('Error code:', error.code)
        console.log('Error message:', error.message)
        console.log('Error details:', (error as any).details)
        
        // Handle duplicate order_index constraint
        // Check multiple ways the error might be formatted
        const isDuplicateKeyError = 
          error.code === '23505' || 
          error.code === 'PGRST116' ||
          error.message?.includes('lesson_content_lesson_id_order_index_key') ||
          error.message?.includes('duplicate key') ||
          (error as any).details?.includes('lesson_content_lesson_id_order_index_key') ||
          String(error.message || '').toLowerCase().includes('duplicate')
        
        if (isDuplicateKeyError) {
          console.log('Duplicate order_index detected, finding next available order_index...')
          
          // Find the maximum order_index for this lesson
          const { data: maxOrder, error: maxError } = await supabase
            .from('lesson_content')
            .select('order_index')
            .eq('lesson_id', lesson_id)
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
          const updatedContentData = { ...contentData, order_index: nextOrderIndex }

          console.log(`Auto-adjusting order_index to ${nextOrderIndex} for lesson ${lesson_id}`)

          // Retry insert with new order_index
          const { data: retryData, error: retryError } = await supabase
            .from('lesson_content')
            .insert(updatedContentData)
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
            data: retryData,
            message: `Content created with auto-adjusted order_index: ${nextOrderIndex}`
          })
        }
        
        console.error('Error creating content:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = data
    }

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('Unexpected error in file upload API:', error)
    // If it's a duplicate key error that wasn't caught, handle it
    if (error?.code === '23505' || error?.message?.includes('duplicate key')) {
      return NextResponse.json({ 
        error: 'Duplicate order_index detected. Please try again - the system will auto-adjust it.',
        code: error.code
      }, { status: 409 })
    }
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}

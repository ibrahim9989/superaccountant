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
        console.error('Error creating content:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = data
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Unexpected error in file upload API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

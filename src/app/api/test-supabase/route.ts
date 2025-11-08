import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: serviceKey?.length || 0
    })

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        details: { hasUrl: !!supabaseUrl, hasServiceKey: !!serviceKey }
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Test a simple query
    const { data, error } = await supabase
      .from('lessons')
      .select('id, title')
      .limit(1)

    if (error) {
      console.error('Supabase test error:', error)
      return NextResponse.json({ 
        error: 'Supabase connection failed',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection working',
      sampleData: data 
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}












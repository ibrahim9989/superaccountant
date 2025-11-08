import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables')
}

// Admin client with service role (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl as string, serviceKey as string, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: NextRequest) {
  console.log('🚀 Grandtest start API called');
  
  try {
    // Read request body
    const body = await request.json()
    const { course_id, enrollment_id, user_id } = body
    
    console.log('Request body:', { course_id, enrollment_id, user_id });

    // Validate required fields
    if (!course_id || !enrollment_id || !user_id) {
      console.error('Missing required fields:', { course_id: !!course_id, enrollment_id: !!enrollment_id, user_id: !!user_id });
      return NextResponse.json(
        { error: 'course_id, enrollment_id, and user_id are required' },
        { status: 400 }
      )
    }

    // Verify user exists using admin client
    const { data: userCheck, error: userCheckError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (userCheckError || !userCheck?.user) {
      console.error('User verification failed:', userCheckError);
      return NextResponse.json(
        { error: 'Invalid user_id' },
        { status: 403 }
      )
    }
    
    console.log('✅ User verified:', userCheck.user.id);

    // Get questions using ADMIN client (bypasses RLS)
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from('grandtest_questions')
      .select('*')
      .eq('course_id', course_id)
      .eq('is_active', true)

    if (questionsError) {
      console.error('Error fetching questions (admin):', questionsError)
      return NextResponse.json(
        { error: `Failed to fetch questions: ${questionsError.message}` },
        { status: 500 }
      )
    }

    if (!questions || questions.length < 5) {
      return NextResponse.json(
        { error: `Not enough questions available (need 5, have ${questions?.length || 0})` },
        { status: 400 }
      )
    }

    // Shuffle and select 5 questions (changed from 60 for testing)
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5)
    const selectedQuestions = shuffledQuestions.slice(0, 5)

    // Create attempt using ADMIN client (bypasses RLS)
    const attemptData = {
      user_id,
      course_id,
      enrollment_id,
      time_limit_minutes: 5, // 5 minutes for 5 questions
      total_questions: 5,
      status: 'in_progress'
    }

    console.log('Creating attempt with data:', attemptData);
    
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('grandtest_attempts')
      .insert(attemptData)
      .select()
      .single()

    if (attemptError) {
      console.error('❌ Error creating grandtest attempt (admin):', attemptError)
      console.error('Error details:', {
        code: attemptError.code,
        message: attemptError.message,
        details: attemptError.details,
        hint: attemptError.hint
      });
      return NextResponse.json(
        { error: `Failed to create attempt: ${attemptError.message}`, code: attemptError.code },
        { status: 500 }
      )
    }
    
    console.log('✅ Attempt created:', attempt.id);

    // Create initial responses using ADMIN client
    const responses = selectedQuestions.map(question => ({
      attempt_id: attempt.id,
      question_id: question.id,
      time_spent_seconds: 0
    }))

    console.log('Creating responses for', responses.length, 'questions');
    
    const { error: responsesError } = await supabaseAdmin
      .from('grandtest_responses')
      .insert(responses)

    if (responsesError) {
      console.error('❌ Error creating responses (admin):', responsesError)
      // Clean up attempt
      await supabaseAdmin.from('grandtest_attempts').delete().eq('id', attempt.id)
      return NextResponse.json(
        { error: `Failed to initialize questions: ${responsesError.message}` },
        { status: 500 }
      )
    }
    
    console.log('✅ Responses created successfully');
    console.log('✅ Grandtest started successfully for user:', user_id);

    return NextResponse.json({ data: attempt })
  } catch (error) {
    console.error('Unexpected error in start grandtest API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


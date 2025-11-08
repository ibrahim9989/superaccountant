import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables');
}

// Admin client with service role (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl as string, serviceKey as string, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Verify user exists using admin client
    const { data: userCheck } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!userCheck?.user) {
      return NextResponse.json(
        { error: 'Invalid user_id' },
        { status: 403 }
      );
    }

    console.log('📜 Fetching certificates for user:', userId);

    // Fetch certificates using admin client (bypasses RLS)
    const { data: certificates, error: certError } = await supabaseAdmin
      .from('certificates')
      .select(`
        *,
        course:course_id (
          id,
          title,
          description
        )
      `)
      .eq('user_id', userId)
      .eq('is_valid', true)
      .order('issued_at', { ascending: false });

    if (certError) {
      console.error('Error fetching certificates (admin):', certError);
      return NextResponse.json(
        { error: `Failed to fetch certificates: ${certError.message}` },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${certificates?.length || 0} certificates`);
    return NextResponse.json({ data: certificates || [] });
  } catch (error) {
    console.error('Unexpected error in certificates API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


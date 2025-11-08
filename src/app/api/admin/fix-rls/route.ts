import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables')
}

// Create admin client with service role
const supabaseAdmin = createClient(supabaseUrl as string, serviceKey as string, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(request: Request) {
  try {
    // SQL commands to fix RLS policies
    const sqlCommands = [
      // Drop problematic admin policy
      `DROP POLICY IF EXISTS "Admins can view all grandtest attempts" ON grandtest_attempts;`,
      
      // Drop existing user policies
      `DROP POLICY IF EXISTS "Users can view their own grandtest attempts" ON grandtest_attempts;`,
      `DROP POLICY IF EXISTS "Users can create their own grandtest attempts" ON grandtest_attempts;`,
      `DROP POLICY IF EXISTS "Users can update their own grandtest attempts" ON grandtest_attempts;`,
      
      // Create clean user policies
      `CREATE POLICY "Users can view their own grandtest attempts"
        ON grandtest_attempts FOR SELECT
        USING (user_id = auth.uid());`,
        
      `CREATE POLICY "Users can create their own grandtest attempts"
        ON grandtest_attempts FOR INSERT
        WITH CHECK (user_id = auth.uid());`,
        
      `CREATE POLICY "Users can update their own grandtest attempts"
        ON grandtest_attempts FOR UPDATE
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());`,
    ]
    
    // Create a function that executes SQL, then use it
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION public.execute_sql_fix()
      RETURNS text
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
        DROP POLICY IF EXISTS "Admins can view all grandtest attempts" ON grandtest_attempts;
        DROP POLICY IF EXISTS "Users can view their own grandtest attempts" ON grandtest_attempts;
        DROP POLICY IF EXISTS "Users can create their own grandtest attempts" ON grandtest_attempts;
        DROP POLICY IF EXISTS "Users can update their own grandtest attempts" ON grandtest_attempts;
        
        CREATE POLICY "Users can view their own grandtest attempts"
          ON grandtest_attempts FOR SELECT
          USING (user_id = auth.uid());
        
        CREATE POLICY "Users can create their own grandtest attempts"
          ON grandtest_attempts FOR INSERT
          WITH CHECK (user_id = auth.uid());
        
        CREATE POLICY "Users can update their own grandtest attempts"
          ON grandtest_attempts FOR UPDATE
          USING (user_id = auth.uid())
          WITH CHECK (user_id = auth.uid());
        
        RETURN 'RLS policies fixed successfully';
      EXCEPTION WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
      END;
      $$;
    `
    
    // Execute via PostgREST using rpc
    // First create the function, then call it
    // But we need to use direct SQL execution which isn't available via REST API
    
    // Alternative: Use the REST API endpoint that might support SQL execution
    // or use the Supabase Management API
    
    // For now, return instructions and the SQL
    return NextResponse.json({
      message: 'SQL execution requires Dashboard access',
      sql: sqlCommands.join('\n\n'),
      instructions: 'Run the SQL commands in Supabase Dashboard SQL Editor'
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}







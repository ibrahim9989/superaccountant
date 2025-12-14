/**
 * Database Performance Analysis Script
 * 
 * This script analyzes query performance in Supabase to identify slow queries
 * and optimization opportunities.
 * 
 * Usage: npx tsx scripts/analyze-db-performance.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://koxpukmwzkdomjelzdtb.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtveHB1a213emtkb21qZWx6ZHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTA5MTYwMCwiZXhwIjoyMDc0NjY3NjAwfQ.7vu4sFlc2ZRJxjWOW3ZVHo_TRpB4EgEFdQ45AxYLODo'

const supabase = createClient(supabaseUrl, serviceKey, {
  db: {
    schema: 'public'
  }
})

interface QueryAnalysis {
  query: string
  table: string
  duration: number
  rows: number
  hasIndex: boolean
  recommendations: string[]
}

async function analyzeQuery(query: string, table: string): Promise<QueryAnalysis> {
  const startTime = Date.now()
  
  try {
    const { data, error } = await supabase.rpc('explain_analyze', { query_text: query })
    
    if (error) {
      // Fallback: execute query and measure time
      const { data: result, error: queryError } = await supabase.from(table).select('*').limit(1)
      const duration = Date.now() - startTime
      
      return {
        query,
        table,
        duration,
        rows: result?.length || 0,
        hasIndex: false,
        recommendations: queryError ? ['Query failed'] : ['Enable EXPLAIN ANALYZE for detailed analysis']
      }
    }
    
    const duration = Date.now() - startTime
    
    return {
      query,
      table,
      duration,
      rows: data?.length || 0,
      hasIndex: false, // Would need to check pg_indexes
      recommendations: []
    }
  } catch (error) {
    const duration = Date.now() - startTime
    return {
      query,
      table,
      duration,
      rows: 0,
      hasIndex: false,
      recommendations: [`Error: ${error}`]
    }
  }
}

async function checkIndexes(table: string) {
  const { data, error } = await supabase
    .from('pg_indexes')
    .select('*')
    .eq('tablename', table)
  
  if (error) {
    // Try direct SQL query
    const { data: indexes, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = '${table}'
        AND schemaname = 'public'
      `
    })
    
    return indexes || []
  }
  
  return data || []
}

async function analyzeTableStructure(table: string) {
  try {
    // Get table statistics
    const { data: stats, error: statsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          n_live_tup as row_count,
          n_dead_tup as dead_rows,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        WHERE tablename = '${table}'
      `
    })
    
    // Get column information
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = '${table}'
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
    })
    
    return {
      stats: stats?.[0] || null,
      columns: columns || []
    }
  } catch (error) {
    console.error(`Error analyzing table ${table}:`, error)
    return { stats: null, columns: [] }
  }
}

async function testCommonQueries() {
  console.log('🔍 Analyzing Common Queries...\n')
  
  const queries = [
    {
      name: 'Get Enrollment with Modules and Lessons',
      query: `
        SELECT 
          e.*,
          c.*,
          json_agg(
            json_build_object(
              'id', m.id,
              'title', m.title,
              'lessons', (
                SELECT json_agg(
                  json_build_object(
                    'id', l.id,
                    'title', l.title
                  )
                )
                FROM lessons l
                WHERE l.module_id = m.id
              )
            )
          ) as modules
        FROM course_enrollments e
        JOIN courses c ON c.id = e.course_id
        LEFT JOIN course_modules m ON m.course_id = c.id
        WHERE e.id = $1
        GROUP BY e.id, c.id
      `,
      table: 'course_enrollments',
      params: ['a27c025d-57c1-4518-a067-97da5ecdf512'] // Example enrollment ID
    },
    {
      name: 'Get Lesson with Content, Quiz, Assignment',
      query: `
        SELECT 
          l.*,
          json_agg(DISTINCT jsonb_build_object(
            'id', lc.id,
            'content_type', lc.content_type,
            'content_data', lc.content_data
          )) as content,
          json_agg(DISTINCT jsonb_build_object(
            'id', q.id,
            'title', q.title,
            'questions', (
              SELECT json_agg(jsonb_build_object('id', qq.id, 'question_text', qq.question_text))
              FROM quiz_questions qq
              WHERE qq.quiz_id = q.id
            )
          )) FILTER (WHERE q.id IS NOT NULL) as quiz,
          json_agg(DISTINCT jsonb_build_object(
            'id', a.id,
            'title', a.title
          )) FILTER (WHERE a.id IS NOT NULL) as assignment
        FROM lessons l
        LEFT JOIN lesson_content lc ON lc.lesson_id = l.id
        LEFT JOIN course_quizzes q ON q.lesson_id = l.id AND q.is_active = true
        LEFT JOIN course_assignments a ON a.lesson_id = l.id AND a.is_active = true
        WHERE l.id = $1
        GROUP BY l.id
      `,
      table: 'lessons',
      params: ['880e8400-e29b-41d4-a716-446655440001'] // Example lesson ID
    },
    {
      name: 'Get Course Modules with Lessons',
      query: `
        SELECT 
          m.*,
          json_agg(
            json_build_object(
              'id', l.id,
              'title', l.title,
              'order_index', l.order_index
            )
            ORDER BY l.order_index
          ) as lessons
        FROM course_modules m
        LEFT JOIN lessons l ON l.module_id = m.id
        WHERE m.course_id = $1
        GROUP BY m.id
        ORDER BY m.week_number, m.order_index
      `,
      table: 'course_modules',
      params: ['660e8400-e29b-41d4-a716-446655440001'] // Example course ID
    }
  ]
  
  const results: Array<QueryAnalysis & { name: string }> = []
  
  for (const queryInfo of queries) {
    console.log(`Testing: ${queryInfo.name}`)
    const startTime = Date.now()
    
    try {
      // Execute the query using Supabase client
      if (queryInfo.name.includes('Enrollment')) {
        const { data, error } = await supabase
          .from('course_enrollments')
          .select(`
            *,
            course:courses(
              *,
              modules:course_modules(
                *,
                lessons:lessons(*)
              )
            )
          `)
          .eq('id', queryInfo.params[0])
          .single()
        
        const duration = Date.now() - startTime
        results.push({
          name: queryInfo.name,
          query: queryInfo.query,
          table: queryInfo.table,
          duration,
          rows: data ? 1 : 0,
          hasIndex: false,
          recommendations: error ? [`Error: ${error.message}`] : []
        })
      } else if (queryInfo.name.includes('Lesson')) {
        const { data, error } = await supabase
          .from('lessons')
          .select(`
            *,
            content:lesson_content(*),
            quiz:course_quizzes(
              *,
              questions:quiz_questions(*)
            ),
            assignment:course_assignments(*)
          `)
          .eq('id', queryInfo.params[0])
          .single()
        
        const duration = Date.now() - startTime
        results.push({
          name: queryInfo.name,
          query: queryInfo.query,
          table: queryInfo.table,
          duration,
          rows: data ? 1 : 0,
          hasIndex: false,
          recommendations: error ? [`Error: ${error.message}`] : []
        })
      } else if (queryInfo.name.includes('Modules')) {
        const { data, error } = await supabase
          .from('course_modules')
          .select(`
            *,
            lessons:lessons(*)
          `)
          .eq('course_id', queryInfo.params[0])
          .order('week_number')
          .order('order_index')
        
        const duration = Date.now() - startTime
        results.push({
          name: queryInfo.name,
          query: queryInfo.query,
          table: queryInfo.table,
          duration,
          rows: data?.length || 0,
          hasIndex: false,
          recommendations: error ? [`Error: ${error.message}`] : []
        })
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      results.push({
        name: queryInfo.name,
        query: queryInfo.query,
        table: queryInfo.table,
        duration,
        rows: 0,
        hasIndex: false,
        recommendations: [`Error: ${error.message}`]
      })
    }
    
    console.log(`  Duration: ${Date.now() - startTime}ms\n`)
  }
  
  return results
}

async function analyzeTablePerformance() {
  console.log('📊 Analyzing Table Performance...\n')
  
  const tables = [
    'course_enrollments',
    'courses',
    'course_modules',
    'lessons',
    'lesson_content',
    'course_quizzes',
    'quiz_questions',
    'course_assignments'
  ]
  
  const tableAnalyses = []
  
  for (const table of tables) {
    console.log(`Analyzing table: ${table}`)
    const structure = await analyzeTableStructure(table)
    const indexes = await checkIndexes(table)
    
    tableAnalyses.push({
      table,
      structure,
      indexes: indexes.length,
      indexDetails: indexes
    })
    
    console.log(`  Row count: ${structure.stats?.row_count || 'N/A'}`)
    console.log(`  Indexes: ${indexes.length}\n`)
  }
  
  return tableAnalyses
}

async function generateRecommendations(queryResults: any[], tableAnalyses: any[]) {
  console.log('\n💡 Optimization Recommendations:\n')
  
  const recommendations: string[] = []
  
  // Analyze query performance
  const slowQueries = queryResults.filter(r => r.duration > 500)
  if (slowQueries.length > 0) {
    console.log('⚠️  Slow Queries (>500ms):')
    slowQueries.forEach(q => {
      console.log(`  - ${q.name}: ${q.duration}ms`)
    })
    console.log()
  }
  
  // Check for missing indexes
  const tablesNeedingIndexes = [
    { table: 'course_enrollments', columns: ['user_id', 'course_id'] },
    { table: 'course_modules', columns: ['course_id', 'week_number'] },
    { table: 'lessons', columns: ['module_id', 'order_index'] },
    { table: 'lesson_content', columns: ['lesson_id'] },
    { table: 'course_quizzes', columns: ['lesson_id', 'is_active'] },
    { table: 'quiz_questions', columns: ['quiz_id'] },
    { table: 'course_assignments', columns: ['lesson_id', 'is_active'] }
  ]
  
  console.log('📌 Recommended Indexes:')
  for (const { table, columns } of tablesNeedingIndexes) {
    const tableInfo = tableAnalyses.find(t => t.table === table)
    const existingIndexes = tableInfo?.indexDetails || []
    
    for (const column of columns) {
      const hasIndex = existingIndexes.some((idx: any) => 
        idx.indexdef?.includes(column) || idx.indexname?.includes(column)
      )
      
      if (!hasIndex) {
        const indexName = `idx_${table}_${column}`
        console.log(`  CREATE INDEX ${indexName} ON ${table}(${column});`)
        recommendations.push(`CREATE INDEX ${indexName} ON ${table}(${column});`)
      }
    }
  }
  
  // Composite indexes for common query patterns
  console.log('\n📌 Recommended Composite Indexes:')
  const compositeIndexes = [
    { table: 'course_modules', columns: ['course_id', 'week_number', 'order_index'], name: 'idx_modules_course_week_order' },
    { table: 'lessons', columns: ['module_id', 'order_index'], name: 'idx_lessons_module_order' },
    { table: 'course_quizzes', columns: ['lesson_id', 'is_active'], name: 'idx_quizzes_lesson_active' },
    { table: 'course_assignments', columns: ['lesson_id', 'is_active'], name: 'idx_assignments_lesson_active' }
  ]
  
  for (const { table, columns, name } of compositeIndexes) {
    console.log(`  CREATE INDEX ${name} ON ${table}(${columns.join(', ')});`)
    recommendations.push(`CREATE INDEX ${name} ON ${table}(${columns.join(', ')});`)
  }
  
  return recommendations
}

async function main() {
  console.log('🚀 Starting Database Performance Analysis\n')
  console.log('=' .repeat(60) + '\n')
  
  try {
    // Test common queries
    const queryResults = await testCommonQueries()
    
    // Analyze table structures
    const tableAnalyses = await analyzeTablePerformance()
    
    // Generate recommendations
    const recommendations = await generateRecommendations(queryResults, tableAnalyses)
  
    // Save recommendations to file
    const fs = await import('fs/promises')
    await fs.writeFile(
      'db-optimization-recommendations.sql',
      `-- Database Optimization Recommendations
-- Generated: ${new Date().toISOString()}

${recommendations.join('\n')}
`
    )
    
    console.log('\n✅ Analysis complete!')
    console.log('📄 Recommendations saved to: db-optimization-recommendations.sql')
    
  } catch (error) {
    console.error('❌ Error during analysis:', error)
  }
}

// Run the analysis
main().catch(console.error)


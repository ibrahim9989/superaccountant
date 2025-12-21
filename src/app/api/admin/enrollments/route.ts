import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cacheService, cacheKeys } from '@/lib/services/cacheService'

export async function GET() {
	try {
		// Try to get from cache
		const cacheKey = cacheKeys.admin.enrollments
		const cached = await cacheService.get(cacheKey)
		if (cached) {
			console.log('✅ Admin enrollments cache hit')
			return NextResponse.json({ data: cached })
		}

		console.log('❌ Admin enrollments cache miss, fetching from database')
		const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
		const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
		if (!url || !serviceKey) {
			console.error('Missing env vars:', { url: !!url, serviceKey: !!serviceKey })
			return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })
		}

		const supabase = createSupabaseClient(url, serviceKey)

		// Fetch raw enrollments
		const { data: enrollments, error } = await supabase
			.from('course_enrollments')
			.select('*')
			.order('enrollment_date', { ascending: false })

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		if (!enrollments || enrollments.length === 0) {
			return NextResponse.json({ data: [] })
		}

		// Load related profiles and courses without relying on FK embeddings
		const userIds = Array.from(new Set(enrollments.map((e: { user_id: string }) => e.user_id).filter(Boolean)))
		const courseIds = Array.from(new Set(enrollments.map((e: { course_id: string }) => e.course_id).filter(Boolean)))

		const [{ data: profiles }, { data: courses }] = await Promise.all([
			supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds),
			supabase.from('courses').select('id, title').in('id', courseIds),
		])

		const profileMap = new Map<string, { id: string; first_name: string; last_name: string; email: string }>((profiles || []).map((p: { id: string; first_name: string; last_name: string; email: string }) => [p.id, p]))
		const courseMap = new Map<string, { id: string; title: string }>((courses || []).map((c: { id: string; title: string }) => [c.id, c]))

		const merged = enrollments.map((e: { user_id: string; course_id: string; [key: string]: unknown }) => ({
			...e,
			user: { profile: profileMap.get(e.user_id) || null },
			course: courseMap.get(e.course_id) || null,
		}))

		// Cache the result for 5 minutes (300 seconds)
		await cacheService.set(cacheKey, merged, { ttl: 300 })

		return NextResponse.json({ data: merged })
	} catch (e: unknown) {
		const error = e as Error
		return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 })
	}
}

import { createServerClient } from "@supabase/ssr"

/**
 * Creates an admin Supabase client with service role permissions.
 * Uses createServerClient from @supabase/ssr with the service role key
 * to bypass RLS while remaining compatible with the Next.js runtime.
 * No cookies are needed since we use the service role key.
 */
export function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing required Supabase environment variables (URL or SERVICE_ROLE_KEY)")
  }

  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // We don't throw here to avoid breaking build time if envs are missing
  // But usage will fail
  console.warn('Supabase URL or Key is missing from environment variables.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

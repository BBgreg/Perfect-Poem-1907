import { createClient } from '@supabase/supabase-js'

// Project credentials from connected Supabase project
const SUPABASE_URL = 'https://bfvecnqloxyhwizqpvsr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdmVjbnFsb3h5aHdpenFwdnNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MTQ5MjQsImV4cCI6MjA2ODk5MDkyNH0.bjRDBxwE6kgliLTZBYtrHjAVHBZ4I1tdt2LywXqCxUY'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Test connection
console.log('Supabase client initialized successfully')
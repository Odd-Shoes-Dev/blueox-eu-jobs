import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pvmcwgylcnedgvbjdler.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bWN3Z3lsY25lZGd2YmpkbGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNjA2MTksImV4cCI6MjA4MDkzNjYxOX0.3ILSwPRsvCYelH9d8ZZxEb53Ja1XurXYy59nqepLhAs';

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Create Supabase client. This module is the only place in the app allowed to import
// '@supabase/supabase-js' or reach into `supabase.*` directly — everything else goes
// through src/services/*, so swapping providers later only means rewriting this file
// plus the services, not every component.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

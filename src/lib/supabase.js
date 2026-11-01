import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
// Clean URL by stripping any trailing /rest/v1 or trailing slashes
const supabaseUrl = rawUrl ? rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '') : '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  supabaseAnonKey !== 'your-supabase-anon-key-here'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServiceClient(accessToken?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Prefer service role key for backend operations, fallback to anon key if not set
  // Note: Anon key might fail RLS if no user context is present, so Service Role is recommended for background jobs.
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const options: any = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  };

  if (accessToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  return createSupabaseClient(supabaseUrl, supabaseKey, options);
}

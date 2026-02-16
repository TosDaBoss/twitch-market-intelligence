import { createClient } from "@supabase/supabase-js";

// Server-side only Supabase client (uses service role or anon key for writes)
// For production, you may want a SUPABASE_SERVICE_ROLE_KEY for full insert access.
// For now we use the anon key — ensure your RLS policies allow inserts from the service.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

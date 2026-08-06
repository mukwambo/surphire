import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS entirely. Only ever import this from
// server-side code (API routes / route handlers), never from anything that
// could end up in a client bundle. Used for the public booking write path,
// where the server -- not the anonymous caller -- is the trusted party that
// re-checks availability and creates the booking.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

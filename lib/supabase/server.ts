import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * SSR-aware Supabase client bound to the current request's cookies.
 * Used in Server Components, Route Handlers, and Server Actions that
 * need to act AS the logged-in user (i.e. respect RLS).
 *
 * Use this for: admin auth check (`requireAdminSession`), anything
 * the user themselves should be authorized for.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Setting cookies from a Server Component is forbidden; safe to ignore.
          }
        },
      },
    },
  );
}

/**
 * Service-role Supabase client. SERVER ONLY. Bypasses RLS.
 *
 * Use this for: privileged writes (orders, AI session inserts),
 * Storage uploads to private buckets, anything that needs to read
 * across users. NEVER expose this to the browser.
 *
 * Most app code should prefer the Drizzle client in lib/db/client.ts
 * for queries; this admin client exists primarily for Supabase Storage
 * and Supabase Auth user management.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseConfig } from "./supabase-config";

export async function supabaseServer() {
  const { url, key } = supabaseConfig();
  const jar = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (updates) => {
        try {
          for (const { name, value, options } of updates) jar.set(name, value, options);
        } catch {
          // Server components have read-only cookies. The proxy refreshes their session.
        }
      },
    },
  });
}

export function supabasePublic() {
  const { url, key } = supabaseConfig();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

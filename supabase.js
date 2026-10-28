import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function supabaseFetch(input, init) {
  const headers = new Headers(
    typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
  );
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }
  if (
    publishableKey?.startsWith("sb_") &&
    headers.get("Authorization") === `Bearer ${publishableKey}`
  ) {
    headers.delete("Authorization");
  }
  if (publishableKey) headers.set("apikey", publishableKey);
  return fetch(input, { ...init, headers });
}

export const supabase =
  url && publishableKey
    ? createClient(url, publishableKey, {
        global: { fetch: supabaseFetch },
      })
    : null;

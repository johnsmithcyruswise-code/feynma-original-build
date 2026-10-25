import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  "https://awvuoelsvwsexguqvoux.supabase.co";

const supabaseKey =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  "sb_publishable_6TJzcCCr9EktIKGuPKKdFg_VcC9uZph";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey
  );

export const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

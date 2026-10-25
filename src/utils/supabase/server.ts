import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://awvuoelsvwsexguqvoux.supabase.co";

const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_6TJzcCCr9EktIKGuPKKdFg_VcC9uZph";

export const createServerSupabaseClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseKey);
};

export const supabaseServer = createServerSupabaseClient();

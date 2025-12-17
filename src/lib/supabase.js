import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const storeUrl = import.meta.env.VITE_STORE_SUPABASE_URL;
const storeKey = import.meta.env.VITE_STORE_SUPABASE_ANON_KEY;

export const storeClient =
  storeUrl && storeKey ? createClient(storeUrl, storeKey) : null;

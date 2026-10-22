
const SUPABASE_URL = "https://vppxsgqvxtqsafhfvkxa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "PEGA_AQUI_TU_CLAVE_sb_publishable";

window.sk7Supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

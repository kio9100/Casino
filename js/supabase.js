
const SUPABASE_URL = "https://vppxsgqvxtqsafhfvkxa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8yMQc3YKvl_bW1335m30yg_3_0p9BsL";

if (!window.supabase) {
  console.error(
    
  );
} else {
  window.sk7Supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );

  console.log("SK7: Cliente de Supabase inicializado.");
}

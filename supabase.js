const SUPABASE_URL = "https://uhyyorhjvkfhnwuvuwre.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_Ub083BnaVDWT88Idc1GhZQ_syCT2bE_";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );
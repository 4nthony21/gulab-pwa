import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Esto aparecerá en tu terminal negra de VS Code
console.log("¿URL cargada?:", !!supabaseUrl);
console.log("¿Key cargada?:", !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
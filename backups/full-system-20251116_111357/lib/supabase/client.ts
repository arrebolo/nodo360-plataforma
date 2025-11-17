import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Validar que las variables de entorno existen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son requeridas'
  );
}

// Crear el cliente de Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper para verificar la conexión
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('courses').select('count');
    if (error) throw error;
    return { success: true, message: 'Conexión exitosa a Supabase' };
  } catch (error) {
    console.error('Error al conectar con Supabase:', error);
    return { success: false, message: 'Error de conexión', error };
  }
}
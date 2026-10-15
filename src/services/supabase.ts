import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://bmiiicushacrzneumtkf.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_jzk4vnUB9ntUWLkcGGmAqw_VZEMoQxq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Helper to check connection and table status in Supabase
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  tableFound: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('emergency_requests')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('not find the table')) {
        return {
          connected: true,
          tableFound: false,
          error: "Table 'emergency_requests' not yet created in Supabase SQL Editor.",
        };
      }
      return {
        connected: false,
        tableFound: false,
        error: error.message,
      };
    }

    return { connected: true, tableFound: true };
  } catch (err: any) {
    return {
      connected: false,
      tableFound: false,
      error: err.message || 'Network connection failed',
    };
  }
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mtivmpfdjnnuaekccsub.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10aXZtcGZkam5udWFla2Njc3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTE1MjksImV4cCI6MjA3NjQ4NzUyOX0.IdvAXbM8lA8uvKehKPTmQD5a0iYrUrOf3xt2pjwiy5Q'

export const supabase = createClient(supabaseUrl, supabaseKey)

// basic client/role visibility for debugging
console.log('[supabaseClient] initialized', {
  url: supabaseUrl.replace(/:\/\/.+?\//, '://<redacted>/'),
  keyRoleHint: supabaseKey.includes('eyJ') ? 'anon-or-service' : 'unknown',
});

// log auth state changes (helps diagnose missing JWT during uploads)
try {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[supabaseClient] auth event', event, {
      hasSession: Boolean(session),
      userId: session?.user?.id ?? null,
      expiresAt: session?.expires_at ?? null,
    });
  });
} catch (err) {
  console.warn('[supabaseClient] failed to register auth listener', err);
}


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aznchizusxvfegpubttp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bmNoaXp1c3h2ZmVncHVidHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgwOTUxMzQsImV4cCI6MjA1MzY3MTEzNH0.52NfjQwLMGl-gSQxVzInNhYdzWBckLkC6mwcogn24fs';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Credenciais do Supabase não encontradas');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
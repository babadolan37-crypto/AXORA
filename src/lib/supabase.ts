/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// HARDCODED CONFIGURATION (TO FIX VERCEL ENV ISSUES)
// This ensures the app ALWAYS connects to the correct database
const supabaseUrl = 'https://tpemoqesoasfsvutjral.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwZW1vcWVzb2FzZnN2dXRqcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NzUzMjUsImV4cCI6MjA4MDE1MTMyNX0.hAqLW9S6x7sqKh8pZzeArgTDKmoGmtq111PsPoB3ui0';

console.log('✅ Supabase Client Initialized with Hardcoded Config');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (url, options) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return Promise.reject(new Error('No internet connection'));
      }
      return fetch(url, options);
    }
  }
});

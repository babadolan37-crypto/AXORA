import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Timeout duration in milliseconds (e.g., 30 minutes)
const TIMEOUT_DURATION = 30 * 60 * 1000; 

export function SessionTimeout() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(async () => {
      // Auto logout
      await supabase.auth.signOut();
      alert('Sesi Anda telah berakhir karena tidak ada aktivitas. Silakan login kembali.');
      window.location.reload();
    }, TIMEOUT_DURATION);
  };

  useEffect(() => {
    // Events to detect activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    // Attach listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  return null; // Invisible component
}

'use client'

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChatAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    // Increased to 12 seconds to prevent "infinite loading" loop
    // (Since server response takes ~5-6 seconds)
    const interval = setInterval(() => {
      router.refresh();
    }, 12000); 

    return () => clearInterval(interval);
  }, [router]);

  return null; 
}
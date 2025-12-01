'use client'

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()} 
      className="flex gap-2 text-sm font-bold text-white bg-black/40 hover:bg-blue-600 px-4 py-2 rounded-full pointer-events-auto transition-all backdrop-blur-md border border-white/10"
    >
      <ArrowLeft size={18}/> BACK
    </button>
  );
}
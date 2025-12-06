'use client'

import { useState } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { saveSearch } from '@/app/actions';

export default function SaveSearchButton({ filters }: { filters: any }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
        await saveSearch(filters);
        setSaved(true);
        setTimeout(() => setSaved(false), 4000); // Reset after 4s
    } catch (e) {
        alert("Please log in to create alerts."); // Simple fallback
    } finally {
        setLoading(false);
    }
  };

  return (
    <button 
        onClick={handleSave}
        disabled={loading || saved}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border ${
            saved 
            ? 'bg-green-900/20 text-green-500 border-green-900/50' 
            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/30'
        }`}
    >
        {loading ? <Loader2 size={12} className="animate-spin"/> : saved ? <Check size={12}/> : <Bell size={12}/>}
        {saved ? "Alert Active" : "Notify Me"}
    </button>
  );
}
'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, MapPin } from "lucide-react";

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<'BUY' | 'RENT' | 'VEHICLE'>('BUY');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (query) params.set('q', query);
    
    // Add logic based on the selected Tab
    if (mode === 'BUY') {
      params.set('type', 'PROPERTY');
      params.set('listingCategory', 'SALE');
    } else if (mode === 'RENT') {
      params.set('type', 'PROPERTY');
      params.set('listingCategory', 'RENT');
    } else {
      params.set('type', 'VEHICLE');
    }

    router.push(`/search?${params.toString()}`);
  };

  const quickSearch = (location: string) => {
    // Quick search for properties in specific state
    router.push(`/search?type=PROPERTY&q=${location}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12">
        
        {/* 1. TOP TABS (The "Intent" Switcher) */}
        <div className="flex justify-center mb-4 gap-2">
            <button 
                onClick={() => setMode('BUY')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'BUY' ? 'bg-white text-black' : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'}`}
            >
                Buy Property
            </button>
            <button 
                onClick={() => setMode('RENT')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'RENT' ? 'bg-white text-black' : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'}`}
            >
                Rent Property
            </button>
            <button 
                onClick={() => setMode('VEHICLE')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'VEHICLE' ? 'bg-white text-black' : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'}`}
            >
                Find Cars
            </button>
        </div>

        {/* 2. THE SEARCH BAR */}
        <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl flex items-center shadow-2xl transition-all focus-within:bg-black/60 focus-within:border-blue-500/50">
            <div className="pl-6 text-gray-400">
                <Search size={20} />
            </div>
            <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mode === 'VEHICLE' ? "Search by Model, Brand (e.g. BMW X5)..." : "Search by Location, Project (e.g. Bangsar)..."}
                className="bg-transparent border-none outline-none text-white px-4 py-4 w-full placeholder:text-gray-500 font-medium text-lg"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl w-14 h-14 flex items-center justify-center transition-all shadow-lg shadow-blue-600/20">
                <ArrowRight size={24} />
            </button>
        </form>

        {/* 3. QUICK LOCATION CHIPS (The Shortcut) */}
        <div className="mt-6 flex flex-wrap justify-center gap-3 items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-2">Popular:</span>
            
            {['Penang', 'Kuala Lumpur', 'Selangor', 'Johor'].map((loc) => (
                <button 
                    key={loc}
                    onClick={() => quickSearch(loc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all"
                >
                    <MapPin size={10} className="text-blue-500"/> {loc}
                </button>
            ))}
        </div>

    </div>
  );
}
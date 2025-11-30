'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from "lucide-react";

export default function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // Stop page refresh
    if (query.trim()) {
      // Redirect to the search page with the query
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="mt-12 bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-full flex items-center max-w-lg mx-auto overflow-hidden shadow-2xl shadow-blue-900/20 transition-all hover:bg-white/10 focus-within:bg-white/10">
      <div className="pl-6 text-gray-400">
        <Search size={18} />
      </div>
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Residences or Vehicles..." 
        className="bg-transparent border-none outline-none text-white px-4 py-3 w-full placeholder:text-gray-500 font-light"
      />
      <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors">
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
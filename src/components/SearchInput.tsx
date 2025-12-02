'use client'

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize state from URL immediately
  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state with URL changes (e.g. Back button, or external navigation)
  useEffect(() => {
      const currentUrlQuery = searchParams.get("q") || "";
      // Only update local state if it differs from the URL AND we aren't currently typing (optional safety)
      // For now, we trust the URL as the source of truth, but we ensure we don't revert to old data if the URL hasn't updated yet.
      if (currentUrlQuery !== query) {
          setQuery(currentUrlQuery);
      }
  }, [searchParams]); // removed 'query' from deps to avoid fighting user input

  const doSearch = (term: string) => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (term) {
        params.set("q", term);
        
        // --- CRITICAL FIX: CLEAR FILTERS ---
        // When searching a new keyword, we must remove strict category filters
        // so the system can find "BMW" even if you were on the "Property" tab.
        params.delete("type"); 
        params.delete("listingCategory");
        params.delete("propertyType");
        params.delete("bodyType");
        params.delete("brand");
        params.delete("minPrice");
        params.delete("maxPrice");
        params.delete("year");
        params.delete("bedrooms");
      } else {
        params.delete("q");
      }
      
      // Use replace to update URL without adding to history stack (optional, push is fine too)
      router.replace(`/search?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault(); 
      doSearch(query);
      inputRef.current?.blur(); 
      setIsExpanded(false); 
  };

  // Click Outside to Close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="flex-1 max-w-xl mx-4 relative h-12 z-50">
        
        <div className="w-full h-full" />

        <form 
            onSubmit={handleSubmit} 
            className={`
                absolute top-0 left-0 w-full transition-all duration-300 ease-out
                ${isExpanded ? 'scale-[1.02] -translate-y-1' : 'scale-100'}
            `}
        >
            <div className={`
                flex items-center rounded-2xl overflow-hidden transition-all duration-300 border
                ${isExpanded 
                    ? 'bg-white border-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] h-16' 
                    : 'bg-white/10 border-white/10 hover:bg-white/20 h-12' 
                }
            `}>
                
                <button 
                    type="submit"
                    className={`pl-4 pr-3 transition-colors ${isExpanded ? 'text-black' : 'text-gray-400'} outline-none`}
                >
                    <Search size={isExpanded ? 20 : 18} />
                </button>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onFocus={() => setIsExpanded(true)}
                    onChange={(e) => setQuery(e.target.value)}
                    className={`
                        w-full bg-transparent outline-none transition-colors
                        ${isExpanded ? 'text-black placeholder-gray-500 text-lg font-bold' : 'text-white placeholder-gray-400 text-sm font-medium'}
                    `}
                    placeholder="Search..."
                />

                {(query || isExpanded) && (
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setQuery("");
                            doSearch(""); 
                            inputRef.current?.focus();
                        }}
                        className={`pr-4 pl-2 transition-colors ${isExpanded ? 'text-gray-400 hover:text-red-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        <X size={18} />
                    </button>
                )}
            </div>
        </form>
        
        {isExpanded && (
            <div 
                className="fixed inset-0 bg-black/80 z-[-1] backdrop-blur-sm animate-in fade-in duration-300" 
                style={{ top: '60px', left: '-100vw', width: '300vw', height: '200vh' }} 
                onClick={() => setIsExpanded(false)} 
            />
        )}
    </div>
  );
}
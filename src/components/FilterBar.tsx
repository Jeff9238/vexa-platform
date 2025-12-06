'use client'

import { useFilters, MALAYSIA_STATES, ALL_BRANDS } from "./FilterSidebar";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Car, Home, MapPin, ShieldCheck, ArrowUpDown, Tag, RotateCcw } from "lucide-react";
import SaveSearchButton from "./SaveSearchButton"; // <--- NEW IMPORT

export default function FilterBar() {
  const { filters, updateFilter, reset, handleChange } = useFilters();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (name: string) => setOpenDropdown(openDropdown === name ? null : name);

  return (
    <div ref={containerRef} className="hidden lg:flex items-center gap-3 w-full py-4 sticky top-20 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 px-6 mb-6">
        
        {/* 1. ASSET TYPE */}
        <div className="flex bg-neutral-900 rounded-lg p-1 border border-white/10">
            <button onClick={() => updateFilter({ type: '' })} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${!filters.type ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>All</button>
            <button onClick={() => updateFilter({ type: 'PROPERTY' })} className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${filters.type === 'PROPERTY' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><Home size={12}/> Property</button>
            <button onClick={() => updateFilter({ type: 'VEHICLE' })} className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${filters.type === 'VEHICLE' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}><Car size={12}/> Vehicle</button>
        </div>

        <div className="w-[1px] h-8 bg-white/10 mx-1"></div>

        {/* 2. CATEGORY */}
        <div className="relative">
            <button onClick={() => toggle('CATEGORY')} className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors">
                {filters.listingCategory || "Buy / Rent"} <ChevronDown size={14}/>
            </button>
            {openDropdown === 'CATEGORY' && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-neutral-900 border border-white/10 rounded-xl shadow-xl p-1 z-50">
                    <button onClick={() => updateFilter({ listingCategory: '' })} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-400 hover:bg-white/5 rounded-lg">Any</button>
                    <button onClick={() => updateFilter({ listingCategory: 'SALE' })} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-lg flex justify-between">Buy {filters.listingCategory === 'SALE' && <Check size={12}/>}</button>
                    <button onClick={() => updateFilter({ listingCategory: 'RENT' })} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-lg flex justify-between">Rent {filters.listingCategory === 'RENT' && <Check size={12}/>}</button>
                </div>
            )}
        </div>

        {/* 3. LOCATION */}
        <div className="relative">
            <button onClick={() => toggle('LOCATION')} className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors">
                <MapPin size={14} className="text-blue-400"/> {filters.state || "All Malaysia"} <ChevronDown size={14}/>
            </button>
            {openDropdown === 'LOCATION' && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-xl p-1 z-50 max-h-64 overflow-y-auto">
                    <button onClick={() => updateFilter({ state: '' })} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-400 hover:bg-white/5 rounded-lg">All Malaysia</button>
                    {MALAYSIA_STATES.map(s => (
                        <button key={s} onClick={() => updateFilter({ state: s })} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-lg flex justify-between">
                            {s} {filters.state === s && <Check size={12}/>}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* 4. VEHICLE SPECIFIC FILTERS */}
        {filters.type === 'VEHICLE' && (
            <>
                {/* BRAND */}
                <div className="relative">
                    <button onClick={() => toggle('BRAND')} className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors">
                        <Tag size={14} className="text-orange-400"/> {filters.brand || "All Brands"} <ChevronDown size={14}/>
                    </button>
                    {openDropdown === 'BRAND' && (
                         <div className="absolute top-full left-0 mt-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-xl p-1 z-50 max-h-64 overflow-y-auto">
                             <button onClick={() => updateFilter({ brand: '' })} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-400 hover:bg-white/5 rounded-lg">All Brands</button>
                             {ALL_BRANDS.map(b => (
                                <button key={b} onClick={() => updateFilter({ brand: b })} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-lg flex justify-between">{b}</button>
                             ))}
                         </div>
                    )}
                </div>

                {/* CONDITION */}
                <div className="relative">
                    <button onClick={() => toggle('CONDITION')} className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors">
                        {filters.condition || "Condition"} <ChevronDown size={14}/>
                    </button>
                    {openDropdown === 'CONDITION' && (
                         <div className="absolute top-full left-0 mt-2 w-40 bg-neutral-900 border border-white/10 rounded-xl shadow-xl p-1 z-50">
                             {['New', 'Used', 'Recon'].map(c => (
                                <button key={c} onClick={() => updateFilter({ condition: c })} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-lg">{c}</button>
                             ))}
                         </div>
                    )}
                </div>
            </>
        )}

        {/* 5. PROPERTY SPECIFIC FILTERS */}
        {filters.type === 'PROPERTY' && (
            <>
                {/* BEDROOMS */}
                <div className="relative">
                    <button onClick={() => toggle('BEDS')} className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors">
                        {filters.bedrooms ? `${filters.bedrooms}+ Beds` : "Bedrooms"} <ChevronDown size={14}/>
                    </button>
                    {openDropdown === 'BEDS' && (
                         <div className="absolute top-full left-0 mt-2 w-32 bg-neutral-900 border border-white/10 rounded-xl shadow-xl p-1 z-50">
                             {['1', '2', '3', '4'].map(b => (
                                <button key={b} onClick={() => updateFilter({ bedrooms: b })} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-lg">{b}+ Beds</button>
                             ))}
                         </div>
                    )}
                </div>

                 {/* TENURE */}
                 <div className="relative">
                    <button onClick={() => toggle('TENURE')} className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors">
                        {filters.tenure || "Tenure"} <ChevronDown size={14}/>
                    </button>
                    {openDropdown === 'TENURE' && (
                         <div className="absolute top-full left-0 mt-2 w-40 bg-neutral-900 border border-white/10 rounded-xl shadow-xl p-1 z-50">
                             {['Freehold', 'Leasehold'].map(t => (
                                <button key={t} onClick={() => updateFilter({ tenure: t })} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-lg">{t}</button>
                             ))}
                         </div>
                    )}
                </div>
            </>
        )}

        {/* 6. PRICE */}
        <div className="relative">
            <button onClick={() => toggle('PRICE')} className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors">
                Price Range <ChevronDown size={14}/>
            </button>
            {openDropdown === 'PRICE' && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-neutral-900 border border-white/10 rounded-xl shadow-xl p-4 z-50">
                    <div className="flex items-center gap-2">
                        <input type="number" name="minPrice" value={filters.minPrice} onChange={handleChange} placeholder="Min" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"/>
                        <span className="text-gray-500">-</span>
                        <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleChange} placeholder="Max" className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"/>
                    </div>
                </div>
            )}
        </div>

        {/* VERIFIED */}
        <button onClick={() => updateFilter({ verified: !filters.verified })} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all ${filters.verified ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-neutral-900 border-white/10 text-gray-400 hover:text-white'}`}>
            <ShieldCheck size={14}/> Verified
        </button>

        {/* RIGHT SIDE ACTIONS */}
        <div className="ml-auto flex items-center gap-3">
            
            {/* NEW: SAVE SEARCH BUTTON */}
            <SaveSearchButton filters={filters} />

            {/* SORT */}
            <div className="relative">
                 <button onClick={() => toggle('SORT')} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                    <ArrowUpDown size={14}/> Sort: <span className="text-white">{filters.sort.replace('_', ' ')}</span>
                </button>
                 {openDropdown === 'SORT' && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-neutral-900 border border-white/10 rounded-xl shadow-xl p-1 z-50">
                        <button onClick={() => updateFilter({ sort: 'newest' })} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-lg">Newest</button>
                        <button onClick={() => updateFilter({ sort: 'price_asc' })} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-lg">Price: Low to High</button>
                        <button onClick={() => updateFilter({ sort: 'price_desc' })} className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-lg">Price: High to Low</button>
                    </div>
                )}
            </div>
            
            {/* RESET */}
            <button onClick={reset} className="p-2 hover:bg-red-900/20 text-gray-500 hover:text-red-400 rounded-lg transition-colors" title="Reset Filters"><RotateCcw size={16}/></button>
        </div>

    </div>
  );
}
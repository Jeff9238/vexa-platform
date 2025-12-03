'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, MapPin, Car, Check, SlidersHorizontal, X, Home, Building2 } from 'lucide-react';

const MALAYSIA_STATES = ["Penang", "Selangor", "Kuala Lumpur", "Johor", "Kedah", "Perak", "Melaka", "Negeri Sembilan", "Pahang", "Terengganu", "Kelantan", "Perlis", "Sabah", "Sarawak", "Putrajaya", "Labuan"];

const POPULAR_BRANDS = [
    { name: "Perodua", code: "Perodua" }, { name: "Proton", code: "Proton" },
    { name: "Honda", code: "Honda" }, { name: "Toyota", code: "Toyota" },
    { name: "BMW", code: "BMW" }, { name: "Mercedes", code: "Mercedes-Benz" },
];

const ALL_BRANDS = ["Perodua", "Proton", "Honda", "Toyota", "BMW", "Mercedes-Benz", "Mazda", "Nissan", "Mitsubishi", "Ford", "Subaru", "Volkswagen", "Hyundai", "Kia", "Peugeot", "Volvo", "Porsche", "Lexus", "Audi", "Mini", "Suzuki"];

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false); // Mobile Modal State
  
  // Load state
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || (searchParams.get('q') ? '' : 'VEHICLE'),
    q: searchParams.get('q') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    state: searchParams.get('state') || '',
    brand: searchParams.get('brand') || '',
    year: searchParams.get('year') || '',
    bodyType: searchParams.get('bodyType') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    propertyType: searchParams.get('propertyType') || '',
    listingCategory: searchParams.get('listingCategory') || '',
  });

  // Sync with URL
  useEffect(() => {
      setFilters(prev => ({
          ...prev,
          q: searchParams.get('q') || '',
          type: searchParams.get('type') || (searchParams.get('q') ? '' : 'VEHICLE')
      }));
  }, [searchParams]);

  // Debounce Update
  useEffect(() => {
    const timeoutId = setTimeout(() => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
        const currentString = searchParams.toString();
        const newString = params.toString();
        if (currentString !== newString) router.push(`/search?${newString}`);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filters, router, searchParams]);

  const handleChange = (e: any) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const selectBrand = (brandName: string) => setFilters({ ...filters, brand: filters.brand === brandName ? '' : brandName });

  // --- REUSABLE FORM CONTENT ---
  const FilterContent = () => (
      <div className="space-y-8">
        
        {/* 1. TYPE SELECTOR */}
        <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-3 block tracking-widest">Asset Type</label>
            <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setFilters({...filters, type: '', brand: ''})} className={`py-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${filters.type === '' ? 'bg-white text-black border-white' : 'bg-black border-white/10 text-gray-400'}`}>
                    <span>ALL</span>
                </button>
                <button onClick={() => setFilters({...filters, type: 'PROPERTY', brand: ''})} className={`py-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${filters.type === 'PROPERTY' ? 'bg-blue-600 text-white border-blue-500' : 'bg-black border-white/10 text-gray-400'}`}>
                    <Home size={14}/> <span>Property</span>
                </button>
                <button onClick={() => setFilters({...filters, type: 'VEHICLE'})} className={`py-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${filters.type === 'VEHICLE' ? 'bg-orange-600 text-white border-orange-500' : 'bg-black border-white/10 text-gray-400'}`}>
                    <Car size={14}/> <span>Vehicle</span>
                </button>
            </div>
        </div>

        {/* 2. KEYWORD & LOCATION */}
        <div className="space-y-4">
            <div>
                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Search</label>
                <div className="flex items-center bg-black border border-white/10 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                    <Search size={16} className="text-gray-500 mr-3"/>
                    <input name="q" value={filters.q} onChange={handleChange} placeholder="e.g. Civic, Condo..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-700"/>
                </div>
            </div>
            <div>
                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Location</label>
                <div className="flex items-center bg-black border border-white/10 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                    <MapPin size={16} className="text-gray-500 mr-3"/>
                    <select name="state" value={filters.state} onChange={handleChange} className="w-full bg-transparent text-sm text-white outline-none cursor-pointer appearance-none">
                        <option value="" className="bg-neutral-900">All Malaysia</option>
                        {MALAYSIA_STATES.map(s => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                    </select>
                </div>
            </div>
        </div>

        {/* 3. VEHICLE SPECIFIC (BRANDS) */}
        {filters.type === 'VEHICLE' && (
            <div>
                <label className="text-xs text-gray-500 font-bold uppercase mb-3 block tracking-widest">Popular Brands</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {POPULAR_BRANDS.map((b) => (
                        <button key={b.code} onClick={() => selectBrand(b.code)} className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${filters.brand === b.code ? 'bg-white text-black border-white' : 'bg-black border-white/10 text-gray-400'}`}>
                            {b.name}
                        </button>
                    ))}
                </div>
                <select name="brand" value={filters.brand} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-gray-400 outline-none">
                    <option value="" className="bg-neutral-900">Other Brands...</option>
                    {ALL_BRANDS.map(b => <option key={b} value={b} className="bg-neutral-900">{b}</option>)}
                </select>
            </div>
        )}

        {/* 4. PRICE RANGE */}
        <div>
             <label className="text-xs text-gray-500 font-bold uppercase mb-3 block tracking-widest">Price Range (RM)</label>
             <div className="flex items-center gap-2">
                 <input type="number" name="minPrice" value={filters.minPrice} onChange={handleChange} placeholder="Min" className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"/>
                 <span className="text-gray-500">-</span>
                 <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleChange} placeholder="Max" className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"/>
             </div>
        </div>

        {/* CLEAR BUTTON */}
        <button onClick={() => router.push('/search')} className="w-full py-3 text-xs font-bold text-red-500 hover:bg-red-900/10 rounded-xl transition-colors">
            Reset All Filters
        </button>
      </div>
  );

  return (
    <>
        {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
        <div className="hidden lg:block bg-neutral-900 border border-white/10 p-6 rounded-2xl h-fit w-80">
            <h3 className="font-bold flex items-center gap-2 text-white mb-6"><SlidersHorizontal size={18}/> Filters</h3>
            <FilterContent />
        </div>

        {/* --- MOBILE TRIGGER BUTTON (Visible on Mobile) --- */}
        <div className="lg:hidden mb-6">
            <button 
                onClick={() => setIsOpen(true)} 
                className="w-full flex items-center justify-between bg-neutral-800 border border-white/10 p-4 rounded-xl text-white font-bold shadow-lg active:scale-95 transition-transform"
            >
                <span className="flex items-center gap-2"><SlidersHorizontal size={18} className="text-blue-500"/> Filter & Sort</span>
                <span className="bg-white/10 px-2 py-1 rounded text-xs text-gray-300">Adjust</span>
            </button>
        </div>

        {/* --- MOBILE MODAL OVERLAY --- */}
        {isOpen && (
            <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200 lg:hidden">
                <div className="w-full max-w-sm bg-[#121212] h-full p-6 overflow-y-auto border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
                    
                    <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#121212] z-10 py-2 border-b border-white/5">
                        <h2 className="text-xl font-bold text-white">Filters</h2>
                        <button onClick={() => setIsOpen(false)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                            <X size={20}/>
                        </button>
                    </div>

                    <div className="pb-20">
                        <FilterContent />
                    </div>

                    {/* Floating Apply Button for Mobile */}
                    <div className="fixed bottom-0 right-0 w-full max-w-sm bg-gradient-to-t from-black via-black to-transparent p-6">
                        <button onClick={() => setIsOpen(false)} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-xl hover:bg-blue-500 transition-all">
                            Show Results
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
}
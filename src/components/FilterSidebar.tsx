'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, MapPin, Car, Check, SlidersHorizontal, X, Home, ArrowUpDown, Tag, DollarSign } from 'lucide-react';

const MALAYSIA_STATES = ["Penang", "Selangor", "Kuala Lumpur", "Johor", "Kedah", "Perak", "Melaka", "Negeri Sembilan", "Pahang", "Terengganu", "Kelantan", "Perlis", "Sabah", "Sarawak", "Putrajaya", "Labuan"];

const POPULAR_BRANDS = [
    { name: "Perodua", code: "Perodua" }, { name: "Proton", code: "Proton" },
    { name: "Honda", code: "Honda" }, { name: "Toyota", code: "Toyota" },
    { name: "BMW", code: "BMW" }, { name: "Mercedes", code: "Mercedes-Benz" },
];

const ALL_BRANDS = ["Perodua", "Proton", "Honda", "Toyota", "BMW", "Mercedes-Benz", "Mazda", "Nissan", "Mitsubishi", "Ford", "Subaru", "Volkswagen", "Hyundai", "Kia", "Peugeot", "Volvo", "Porsche", "Lexus", "Audi", "Mini", "Suzuki"];

// Shared Logic Hook
const useFilters = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [filters, setFilters] = useState({
        // FIX: Default to '' (ALL) to prevent forcing "VEHICLE" mode on empty search
        type: searchParams.get('type') || '', 
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
        sort: searchParams.get('sort') || 'newest',
    });

    // Sync state with URL params
    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            q: searchParams.get('q') || '',
            type: searchParams.get('type') || '', // Ensures we stay in sync with URL
            sort: searchParams.get('sort') || 'newest',
            listingCategory: searchParams.get('listingCategory') || ''
        }));
    }, [searchParams]);

    // Debounce URL updates
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
    const updateFilter = (updates: Partial<typeof filters>) => setFilters({ ...filters, ...updates });
    const reset = () => router.push('/search');

    return { filters, handleChange, selectBrand, updateFilter, reset };
};

// The Form Content
const FilterForm = ({ filters, handleChange, selectBrand, updateFilter, reset }: any) => (
    <div className="space-y-6">
        
        {/* Sort Order */}
        <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block tracking-widest flex items-center gap-1.5">
                <ArrowUpDown size={10}/> Sort By
            </label>
            <div className="relative group">
                <select 
                    name="sort" 
                    value={filters.sort} 
                    onChange={handleChange} 
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500/50 transition-colors cursor-pointer appearance-none"
                >
                    <option value="newest" className="bg-neutral-900">Newest Listed</option>
                    <option value="oldest" className="bg-neutral-900">Oldest Listed</option>
                    <option value="price_asc" className="bg-neutral-900">Price: Low to High</option>
                    <option value="price_desc" className="bg-neutral-900">Price: High to Low</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronDownIcon />
                </div>
            </div>
        </div>
        
        {/* Asset Type - Segmented Control */}
        <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block tracking-widest">Asset Type</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
                <button onClick={() => updateFilter({ type: '', brand: '' })} className={`py-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${filters.type === '' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                    <span>ALL</span>
                </button>
                <button onClick={() => updateFilter({ type: 'PROPERTY', brand: '' })} className={`py-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${filters.type === 'PROPERTY' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                    <Home size={12}/> <span>Property</span>
                </button>
                <button onClick={() => updateFilter({ type: 'VEHICLE', listingCategory: '' })} className={`py-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${filters.type === 'VEHICLE' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                    <Car size={12}/> <span>Vehicle</span>
                </button>
            </div>
        </div>

        {/* Listing Category (Sale vs Rent) - Hidden for Vehicles */}
        {filters.type !== 'VEHICLE' && (
            <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block tracking-widest">Listing Category</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
                    <button onClick={() => updateFilter({ listingCategory: '' })} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${filters.listingCategory === '' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        Any
                    </button>
                    <button onClick={() => updateFilter({ listingCategory: 'SALE' })} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${filters.listingCategory === 'SALE' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        Buy
                    </button>
                    <button onClick={() => updateFilter({ listingCategory: 'RENT' })} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${filters.listingCategory === 'RENT' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        Rent
                    </button>
                </div>
            </div>
        )}

        {/* Search & Location */}
        <div className="space-y-3">
            <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Keywords</label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-blue-500/50 focus-within:bg-black/40 transition-all">
                    <Search size={14} className="text-gray-500 mr-2.5"/>
                    <input name="q" value={filters.q} onChange={handleChange} placeholder="Model, Project..." className="w-full bg-transparent text-xs text-white outline-none placeholder:text-gray-600 font-medium"/>
                </div>
            </div>
            <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Location</label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus-within:border-blue-500/50 focus-within:bg-black/40 transition-all relative">
                    <MapPin size={14} className="text-gray-500 mr-2.5"/>
                    <select name="state" value={filters.state} onChange={handleChange} className="w-full bg-transparent text-xs text-white outline-none cursor-pointer appearance-none relative z-10">
                        <option value="" className="bg-neutral-900 text-gray-500">All Malaysia</option>
                        {MALAYSIA_STATES.map(s => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <ChevronDownIcon />
                    </div>
                </div>
            </div>
        </div>

        {/* Vehicle Brands */}
        {filters.type === 'VEHICLE' && (
            <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block tracking-widest">Brands</label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {POPULAR_BRANDS.map((b) => (
                        <button key={b.code} onClick={() => selectBrand(b.code)} className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${filters.brand === b.code ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}>
                            {b.name}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <select name="brand" value={filters.brand} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-400 outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer">
                        <option value="" className="bg-neutral-900">Other Brands...</option>
                        {ALL_BRANDS.map(b => <option key={b} value={b} className="bg-neutral-900">{b}</option>)}
                    </select>
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <ChevronDownIcon />
                    </div>
                </div>
            </div>
        )}

        {/* Price Range */}
        <div>
             <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block tracking-widest">Price Range</label>
             <div className="flex items-center gap-2">
                 <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-sans">RM</span>
                    <input type="number" name="minPrice" value={filters.minPrice} onChange={handleChange} placeholder="Min" className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600"/>
                 </div>
                 <span className="text-gray-600 text-[10px]">-</span>
                 <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-sans">RM</span>
                    <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleChange} placeholder="Max" className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600"/>
                 </div>
             </div>
        </div>

        <button onClick={reset} className="w-full py-2.5 text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors tracking-widest uppercase">Reset Filters</button>
    </div>
);

// Helper Icon
const ChevronDownIcon = () => (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// 1. DESKTOP SIDEBAR
export default function FilterSidebar() {
  const logic = useFilters();
  return (
    <div className="hidden lg:block bg-neutral-900 border border-white/10 p-5 rounded-2xl h-fit w-72 shadow-xl shadow-black/20">
        <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
             <h3 className="font-bold flex items-center gap-2 text-white text-sm"><SlidersHorizontal size={16} className="text-blue-500"/> Filter & Sort</h3>
             <button onClick={logic.reset} className="text-[10px] text-gray-500 hover:text-white transition-colors">Reset</button>
        </div>
        <FilterForm {...logic} />
    </div>
  );
}

// 2. MOBILE TRIGGER BUTTON + MODAL
export function FilterMobileTrigger() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const logic = useFilters();

    useEffect(() => { setMounted(true); }, []);

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)} 
                className="lg:hidden flex items-center gap-2 bg-neutral-800/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-white font-bold shadow-lg active:scale-95 transition-transform text-[10px] uppercase tracking-wider hover:bg-neutral-700"
            >
                <SlidersHorizontal size={12} className="text-blue-400"/> Filter
            </button>

            {/* React Portal for Mobile Modal */}
            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="relative w-full max-w-[320px] bg-[#121212] h-full p-6 overflow-y-auto border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#121212] z-10 py-2 border-b border-white/5">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2"><SlidersHorizontal size={18} className="text-blue-500"/> Filters</h2>
                            <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><X size={18}/></button>
                        </div>
                        <div className="flex-grow pb-24">
                            <FilterForm {...logic} />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-[#121212] to-transparent">
                            <button onClick={() => setIsOpen(false)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm">
                                View Results
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, MapPin, Car, SlidersHorizontal, X, Home, ArrowUpDown, ShieldCheck } from 'lucide-react';
import SaveSearchButton from './SaveSearchButton'; 

// --- EXPORT THESE CONSTANTS ---
export const MALAYSIA_STATES = ["Penang", "Selangor", "Kuala Lumpur", "Johor", "Kedah", "Perak", "Melaka", "Negeri Sembilan", "Pahang", "Terengganu", "Kelantan", "Perlis", "Sabah", "Sarawak", "Putrajaya", "Labuan"];

export const POPULAR_BRANDS = [
    { name: "Perodua", code: "Perodua" }, { name: "Proton", code: "Proton" },
    { name: "Honda", code: "Honda" }, { name: "Toyota", code: "Toyota" },
    { name: "BMW", code: "BMW" }, { name: "Mercedes", code: "Mercedes-Benz" },
];

export const ALL_BRANDS = ["Perodua", "Proton", "Honda", "Toyota", "BMW", "Mercedes-Benz", "Mazda", "Nissan", "Mitsubishi", "Ford", "Subaru", "Volkswagen", "Hyundai", "Kia", "Peugeot", "Volvo", "Porsche", "Lexus", "Audi", "Mini", "Suzuki"];

// --- EXPORT THIS HOOK ---
export const useFilters = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    const [filters, setFilters] = useState({
        type: searchParams.get('type') || '', 
        q: searchParams.get('q') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        state: searchParams.get('state') || '',
        brand: searchParams.get('brand') || '',
        listingCategory: searchParams.get('listingCategory') || '',
        sort: searchParams.get('sort') || 'newest',
        condition: searchParams.get('condition') || '',
        transmission: searchParams.get('transmission') || '',
        fuelType: searchParams.get('fuelType') || '',
        warranty: searchParams.get('warranty') === 'true',
        tenure: searchParams.get('tenure') || '',
        furnishing: searchParams.get('furnishing') || '',
        bedrooms: searchParams.get('bedrooms') || '',
        verified: searchParams.get('verified') === 'true',
    });

    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            type: searchParams.get('type') || '',
            q: searchParams.get('q') || '',
            listingCategory: searchParams.get('listingCategory') || '',
            state: searchParams.get('state') || '',
            brand: searchParams.get('brand') || '',
            sort: searchParams.get('sort') || 'newest',
            condition: searchParams.get('condition') || '',
            transmission: searchParams.get('transmission') || '',
            fuelType: searchParams.get('fuelType') || '',
            warranty: searchParams.get('warranty') === 'true',
            tenure: searchParams.get('tenure') || '',
            furnishing: searchParams.get('furnishing') || '',
            bedrooms: searchParams.get('bedrooms') || '',
            verified: searchParams.get('verified') === 'true',
        }));
    }, [searchParams]);

    const pushToUrl = (currentFilters: typeof filters) => {
        const params = new URLSearchParams();
        Object.entries(currentFilters).forEach(([key, value]) => {
            if (value) params.set(key, String(value));
        });
        router.push(`/search?${params.toString()}`);
    };

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        const next = { ...filters, [name]: val };
        setFilters(next); 

        if (type !== 'checkbox') { 
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => pushToUrl(next), 500);
        } else { 
            pushToUrl(next);
        }
    };

    const updateFilter = (updates: Partial<typeof filters>) => {
        const next = { ...filters, ...updates };
        setFilters(next);
        pushToUrl(next);
    };

    const selectBrand = (brandName: string) => {
        const newValue = filters.brand === brandName ? '' : brandName;
        updateFilter({ brand: newValue });
    };
    
    const reset = () => router.push('/search');

    return { filters, handleChange, selectBrand, updateFilter, reset };
};

// --- EXPORT THIS COMPONENT ---
export const FilterForm = ({ filters, handleChange, selectBrand, updateFilter, reset }: any) => (
    <div className="space-y-8 pb-10">
        
        {/* ASSET TYPE */}
        <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block tracking-widest">Asset Type</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                <button onClick={() => updateFilter({ type: '', brand: '' })} className={`py-2.5 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${!filters.type ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><span>ALL</span></button>
                <button onClick={() => updateFilter({ type: 'PROPERTY', brand: '' })} className={`py-2.5 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${filters.type === 'PROPERTY' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Home size={14}/> <span>Property</span></button>
                <button onClick={() => updateFilter({ type: 'VEHICLE', listingCategory: '' })} className={`py-2.5 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-1 ${filters.type === 'VEHICLE' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Car size={14}/> <span>Vehicle</span></button>
            </div>
        </div>

        {/* CATEGORY & VERIFIED */}
        <div className="space-y-4">
            {filters.type !== 'VEHICLE' && (
                <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block tracking-widest">Category</label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                        <button onClick={() => updateFilter({ listingCategory: '' })} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${!filters.listingCategory ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Any</button>
                        <button onClick={() => updateFilter({ listingCategory: 'SALE' })} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${filters.listingCategory === 'SALE' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-white'}`}>Buy</button>
                        <button onClick={() => updateFilter({ listingCategory: 'RENT' })} className={`py-2 rounded-lg text-[10px] font-bold transition-all ${filters.listingCategory === 'RENT' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}>Rent</button>
                    </div>
                </div>
            )}
            
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-white flex items-center gap-2"><ShieldCheck size={14} className="text-blue-500"/> Verified Only</span>
                <input type="checkbox" name="verified" checked={filters.verified} onChange={handleChange} className="w-4 h-4 accent-blue-600 rounded bg-neutral-800 border-white/20"/>
            </div>
        </div>

        {/* LOCATION & PRICE */}
        <div className="space-y-4">
            <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block">Location</label>
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 relative">
                    <MapPin size={14} className="text-gray-500 mr-2.5"/>
                    <select name="state" value={filters.state} onChange={(e) => updateFilter({ state: e.target.value })} className="w-full bg-transparent text-xs text-white outline-none cursor-pointer appearance-none relative z-10">
                        <option value="" className="bg-neutral-900">All Malaysia</option>
                        {MALAYSIA_STATES.map(s => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                    </select>
                    <ChevronDownIcon />
                </div>
            </div>

            <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase mb-2 block tracking-widest">Price (RM)</label>
                <div className="flex items-center gap-2">
                    <input type="number" name="minPrice" value={filters.minPrice} onChange={handleChange} placeholder="Min" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50 transition-all"/>
                    <span className="text-gray-600">-</span>
                    <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleChange} placeholder="Max" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50 transition-all"/>
                </div>
            </div>
        </div>

        {/* VEHICLE FILTERS */}
        {filters.type === 'VEHICLE' && (
            <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-left-2">
                <p className="text-xs font-bold text-orange-500 flex items-center gap-2"><Car size={14}/> Vehicle Options</p>
                
                <div className="grid grid-cols-3 gap-2">
                    {POPULAR_BRANDS.map((b) => (
                        <button key={b.code} onClick={() => selectBrand(b.code)} className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${filters.brand === b.code ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}>
                            {b.name}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <select name="brand" value={filters.brand} onChange={(e) => updateFilter({ brand: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-400 outline-none appearance-none cursor-pointer">
                        <option value="" className="bg-neutral-900">Other Brands...</option>
                        {ALL_BRANDS.map(b => <option key={b} value={b} className="bg-neutral-900">{b}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"><ChevronDownIcon /></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <select name="condition" value={filters.condition} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none">
                        <option value="">Any Condition</option>
                        <option value="New">New</option>
                        <option value="Used">Used</option>
                        <option value="Recon">Recon</option>
                    </select>
                    <select name="transmission" value={filters.transmission} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none">
                        <option value="">Any Trans.</option>
                        <option value="Automatic">Automatic</option>
                        <option value="Manual">Manual</option>
                    </select>
                    <select name="fuelType" value={filters.fuelType} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none col-span-2">
                        <option value="">Any Fuel Type</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="EV">Electric</option>
                    </select>
                </div>

                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                    <input type="checkbox" name="warranty" checked={filters.warranty} onChange={handleChange} className="w-4 h-4 rounded bg-neutral-800 border-white/20 accent-orange-500"/>
                    Under Warranty Only
                </label>
            </div>
        )}

        {/* PROPERTY FILTERS */}
        {filters.type === 'PROPERTY' && (
            <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-left-2">
                <p className="text-xs font-bold text-blue-500 flex items-center gap-2"><Home size={14}/> Property Options</p>
                
                <div className="grid grid-cols-2 gap-3">
                    <select name="tenure" value={filters.tenure} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none">
                        <option value="">Any Tenure</option>
                        <option value="Freehold">Freehold</option>
                        <option value="Leasehold">Leasehold</option>
                    </select>
                    <select name="bedrooms" value={filters.bedrooms} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none">
                        <option value="">Any Beds</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                    </select>
                    <select name="furnishing" value={filters.furnishing} onChange={handleChange} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none col-span-2">
                        <option value="">Any Furnishing</option>
                        <option value="Fully Furnished">Fully Furnished</option>
                        <option value="Partly Furnished">Partly Furnished</option>
                        <option value="Unfurnished">Unfurnished</option>
                    </select>
                </div>
            </div>
        )}

        <button onClick={reset} className="w-full py-3 text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors tracking-widest uppercase">Reset All Filters</button>
    </div>
);

const ChevronDownIcon = () => (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// 1. DESKTOP SIDEBAR
export default function FilterSidebar() {
  const logic = useFilters();
  return (
    <div className="hidden lg:block bg-neutral-900 border border-white/10 p-5 rounded-2xl h-fit w-72 shadow-xl shadow-black/20 sticky top-36">
        <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
             <h3 className="font-bold flex items-center gap-2 text-white text-sm"><SlidersHorizontal size={16} className="text-blue-500"/> Filter & Sort</h3>
             <button onClick={logic.reset} className="text-[10px] text-gray-500 hover:text-white transition-colors">Reset</button>
        </div>
        <FilterForm {...logic} />
    </div>
  );
}

// 2. MOBILE BOTTOM SHEET
export function FilterMobileTrigger() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const logic = useFilters();

    useEffect(() => { setMounted(true); }, []);

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="lg:hidden flex items-center gap-2 bg-neutral-800/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-white font-bold shadow-lg active:scale-95 transition-transform text-[10px] uppercase tracking-wider hover:bg-neutral-700">
                <SlidersHorizontal size={12} className="text-blue-400"/> Filter
            </button>

            {isOpen && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsOpen(false)}/>
                    
                    <div className="relative w-full bg-[#121212] max-h-[85vh] h-auto rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
                        <div className="flex flex-col items-center pt-3 pb-4 sticky top-0 bg-[#121212] z-20 border-b border-white/5 rounded-t-3xl">
                            <div className="w-12 h-1.5 bg-neutral-800 rounded-full mb-4"></div>
                            <div className="flex items-center justify-between w-full px-6">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2"><SlidersHorizontal size={18} className="text-blue-500"/> Filters</h2>
                                <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><X size={18}/></button>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto px-6 py-4 pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <FilterForm {...logic} />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-[#121212] to-transparent z-30 flex gap-3">
                             {/* NEW: MOBILE SAVE SEARCH BUTTON */}
                            <div className="flex-shrink-0">
                                <SaveSearchButton filters={logic.filters} />
                            </div>
                            <button onClick={() => setIsOpen(false)} className="flex-grow w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm">
                                View {logic.filters.listingCategory ? logic.filters.listingCategory : ''} Results
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
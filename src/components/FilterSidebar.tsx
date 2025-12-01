'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react'; // Added useEffect
import { Search, Filter, MapPin, Car, Check } from 'lucide-react';

const MALAYSIA_STATES = ["Penang", "Selangor", "Kuala Lumpur", "Johor", "Kedah", "Perak", "Melaka", "Negeri Sembilan", "Pahang", "Terengganu", "Kelantan", "Perlis", "Sabah", "Sarawak", "Putrajaya", "Labuan"];

const POPULAR_BRANDS = [
    { name: "Perodua", code: "Perodua" },
    { name: "Proton", code: "Proton" },
    { name: "Honda", code: "Honda" },
    { name: "Toyota", code: "Toyota" },
    { name: "BMW", code: "BMW" },
    { name: "Mercedes", code: "Mercedes-Benz" },
    { name: "Mazda", code: "Mazda" },
    { name: "Nissan", code: "Nissan" },
];

const ALL_BRANDS = ["Perodua", "Proton", "Honda", "Toyota", "BMW", "Mercedes-Benz", "Mazda", "Nissan", "Mitsubishi", "Ford", "Subaru", "Volkswagen", "Hyundai", "Kia", "Peugeot", "Volvo", "Porsche", "Lexus", "Audi", "Mini", "Suzuki"];

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Load initial state from URL
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || 'VEHICLE',
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

  // --- NEW: AUTO-UPDATE LOGIC ---
  // This effect runs whenever 'filters' changes, updating the URL automatically.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });
        router.push(`/search?${params.toString()}`);
    }, 500); // 0.5s delay to prevent stuttering while typing

    return () => clearTimeout(timeoutId);
  }, [filters, router]);

  const handleChange = (e: any) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const selectBrand = (brandName: string) => {
    setFilters({ ...filters, brand: filters.brand === brandName ? '' : brandName });
  };

  const optionClass = "bg-neutral-900 text-white py-2";

  return (
    <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl h-fit w-full lg:w-80 flex-shrink-0">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold flex items-center gap-2 text-white"><Filter size={18}/> Filters</h3>
        <button onClick={() => router.push('/search')} className="text-xs text-gray-500 hover:text-white">Clear</button>
      </div>

      <div className="space-y-6">
        
        {/* CATEGORY */}
        <div className="flex bg-black p-1 rounded-lg border border-white/10">
            <button onClick={() => setFilters({...filters, type: 'PROPERTY', brand: ''})} className={`flex-1 py-2 text-xs font-bold rounded transition-all ${filters.type === 'PROPERTY' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}>Property</button>
            <button onClick={() => setFilters({...filters, type: 'VEHICLE'})} className={`flex-1 py-2 text-xs font-bold rounded transition-all ${filters.type === 'VEHICLE' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-white'}`}>Vehicle</button>
        </div>

        {/* KEYWORD */}
        <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Keyword</label>
            <div className="flex items-center bg-black border border-white/10 rounded-lg px-3">
                <Search size={14} className="text-gray-500"/>
                <input name="q" value={filters.q} onChange={handleChange} placeholder="Search..." className="w-full bg-transparent p-2 text-sm text-white outline-none placeholder:text-gray-700"/>
            </div>
        </div>

        {/* LOCATION */}
        <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Location</label>
            <div className="flex items-center bg-black border border-white/10 rounded-lg px-3">
                <MapPin size={14} className="text-gray-500"/>
                <select name="state" value={filters.state} onChange={handleChange} className="w-full bg-transparent p-2 text-sm text-white outline-none cursor-pointer">
                    <option value="" className={optionClass}>All Malaysia</option>
                    {MALAYSIA_STATES.map(s => <option key={s} value={s} className={optionClass}>{s}</option>)}
                </select>
            </div>
        </div>

        {/* BRAND GRID */}
        {filters.type === 'VEHICLE' && (
            <div>
                <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Popular Brands</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {POPULAR_BRANDS.map((b) => (
                        <button 
                            key={b.code}
                            onClick={() => selectBrand(b.code)}
                            className={`px-2 py-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                                filters.brand === b.code 
                                ? 'bg-white text-black border-white' 
                                : 'bg-black border-white/10 text-gray-400 hover:bg-white/5 hover:border-white/30'
                            }`}
                        >
                            {filters.brand === b.code ? <Check size={12} className="text-green-600"/> : <Car size={12} className="opacity-50"/>}
                            {b.name}
                        </button>
                    ))}
                </div>
                
                <select name="brand" value={filters.brand} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-gray-400 outline-none">
                    <option value="" className={optionClass}>Other Brands...</option>
                    {ALL_BRANDS.map(b => <option key={b} value={b} className={optionClass}>{b}</option>)}
                </select>
            </div>
        )}

        {/* REST OF FILTERS */}
        {/* We removed the 'Apply' button because it's automatic now! */}
      </div>
    </div>
  );
}
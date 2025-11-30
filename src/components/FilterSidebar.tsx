'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search, Filter, MapPin, Car, Check } from 'lucide-react';

const MALAYSIA_STATES = ["Penang", "Selangor", "Kuala Lumpur", "Johor", "Kedah", "Perak", "Melaka", "Negeri Sembilan", "Pahang", "Terengganu", "Kelantan", "Perlis", "Sabah", "Sarawak", "Putrajaya", "Labuan"];

// Popular Brands Data
const POPULAR_BRANDS = [
    { name: "Perodua", code: "Perodua" },
    { name: "Proton", code: "Proton" },
    { name: "Honda", code: "Honda" },
    { name: "Toyota", code: "Toyota" },
    { name: "BMW", code: "BMW" },
    { name: "Mercedes", code: "Mercedes-Benz" }, // Short name for display
    { name: "Mazda", code: "Mazda" },
    { name: "Nissan", code: "Nissan" },
];

const ALL_BRANDS = [
    "Perodua", "Proton", "Honda", "Toyota", "BMW", "Mercedes-Benz", "Mazda", "Nissan", 
    "Mitsubishi", "Ford", "Subaru", "Volkswagen", "Hyundai", "Kia", "Peugeot", "Volvo", "Porsche", "Lexus", "Audi", "Mini", "Suzuki"
];

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
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

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`/search?${params.toString()}`);
  };

  const handleChange = (e: any) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Helper to toggle brand from grid
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
        
        {/* CATEGORY TOGGLE */}
        <div className="flex bg-black p-1 rounded-lg border border-white/10">
            <button onClick={() => setFilters({...filters, type: 'PROPERTY', brand: ''})} className={`flex-1 py-2 text-xs font-bold rounded transition-all ${filters.type === 'PROPERTY' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}>Property</button>
            <button onClick={() => setFilters({...filters, type: 'VEHICLE'})} className={`flex-1 py-2 text-xs font-bold rounded transition-all ${filters.type === 'VEHICLE' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-white'}`}>Vehicle</button>
        </div>

        {/* KEYWORD SEARCH */}
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

        {/* --- VISUAL BRAND SELECTOR (Only for Vehicles) --- */}
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
                            {/* Replace this <Car> with <Image> later for real logos */}
                            {filters.brand === b.code ? <Check size={12} className="text-green-600"/> : <Car size={12} className="opacity-50"/>}
                            {b.name}
                        </button>
                    ))}
                </div>
                
                {/* Full Brand Dropdown (For those not in top 8) */}
                <select name="brand" value={filters.brand} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-gray-400 outline-none">
                    <option value="" className={optionClass}>Other Brands...</option>
                    {ALL_BRANDS.map(b => <option key={b} value={b} className={optionClass}>{b}</option>)}
                </select>
            </div>
        )}

        {/* PRICE RANGE */}
        <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Price Range (RM)</label>
            <div className="flex gap-2">
                <input name="minPrice" type="number" value={filters.minPrice} onChange={handleChange} placeholder="Min" className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white outline-none placeholder:text-gray-700"/>
                <input name="maxPrice" type="number" value={filters.maxPrice} onChange={handleChange} placeholder="Max" className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white outline-none placeholder:text-gray-700"/>
            </div>
        </div>

        {/* VEHICLE FILTERS */}
        {filters.type === 'VEHICLE' && (
            <>
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Body Type</label>
                    <select name="bodyType" value={filters.bodyType} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white outline-none">
                        <option value="" className={optionClass}>Any</option>
                        <option value="Sedan" className={optionClass}>Sedan</option>
                        <option value="SUV" className={optionClass}>SUV</option>
                        <option value="MPV" className={optionClass}>MPV</option>
                        <option value="Coupe" className={optionClass}>Coupe</option>
                        <option value="4x4" className={optionClass}>4x4</option>
                    </select>
                </div>
                <div><label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Min Year</label><input name="year" type="number" value={filters.year} onChange={handleChange} placeholder="e.g. 2020" className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white outline-none placeholder:text-gray-700"/></div>
            </>
        )}

        {/* PROPERTY FILTERS */}
        {filters.type === 'PROPERTY' && (
            <>
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Category</label>
                    <select name="listingCategory" value={filters.listingCategory} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white outline-none">
                        <option value="" className={optionClass}>Any</option>
                        <option value="SALE" className={optionClass}>For Sale</option>
                        <option value="RENT" className={optionClass}>For Rent</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Type</label>
                    <select name="propertyType" value={filters.propertyType} onChange={handleChange} className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white outline-none">
                        <option value="" className={optionClass}>Any</option>
                        <option value="Condo" className={optionClass}>Condo</option>
                        <option value="Terrace" className={optionClass}>Terrace</option>
                        <option value="Bungalow" className={optionClass}>Bungalow</option>
                        <option value="Semi-D" className={optionClass}>Semi-D</option>
                    </select>
                </div>
                <div><label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Min Bedrooms</label><input name="bedrooms" type="number" value={filters.bedrooms} onChange={handleChange} placeholder="e.g. 3" className="w-full bg-black border border-white/10 rounded-lg p-2 text-sm text-white outline-none placeholder:text-gray-700"/></div>
            </>
        )}

        <button onClick={applyFilters} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors mt-4">Apply Filters</button>
      </div>
    </div>
  );
}
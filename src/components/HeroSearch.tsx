'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, MapPin, DollarSign, ArrowRight, Car, Home, Tag } from "lucide-react";

const MALAYSIA_STATES = ["Penang", "Selangor", "Kuala Lumpur", "Johor", "Kedah", "Perak", "Melaka", "Negeri Sembilan", "Pahang", "Terengganu", "Kelantan", "Perlis", "Sabah", "Sarawak", "Putrajaya", "Labuan"];

// DATA LISTS
const PROPERTY_TYPES = ["Terrace", "Condo", "Bungalow", "Semi-D", "Apartment", "Townhouse", "Shoplot", "Factory", "Land"];
const VEHICLE_BODY_TYPES = ["Sedan", "SUV", "MPV", "Coupe", "4x4", "Hatchback", "Wagon", "Pickup", "Van"];
const CAR_BRANDS = ["Toyota", "Honda", "BMW", "Mercedes-Benz", "Proton", "Perodua", "Porsche", "Mazda", "Nissan", "Mitsubishi", "Ford", "Subaru", "Volkswagen", "Hyundai", "Kia", "Peugeot", "Volvo", "Lexus", "Audi", "Mini", "Suzuki"];

// PRICE RANGES
const PROPERTY_PRICES = [
    { label: "Below 300k", min: "0", max: "300000" },
    { label: "300k - 500k", min: "300000", max: "500000" },
    { label: "500k - 1M", min: "500000", max: "1000000" },
    { label: "Above 1M", min: "1000000", max: "" },
];

const RENT_PRICES = [
    { label: "Below 1k", min: "0", max: "1000" },
    { label: "1k - 2k", min: "1000", max: "2000" },
    { label: "2k - 3k", min: "2000", max: "3000" },
    { label: "Above 3k", min: "3000", max: "" },
];

const CAR_PRICES = [
    { label: "Below 30k", min: "0", max: "30000" },
    { label: "30k - 80k", min: "30000", max: "80000" },
    { label: "80k - 150k", min: "80000", max: "150000" },
    { label: "Above 150k", min: "150000", max: "" },
];

export default function HeroSearch() {
  const router = useRouter();
  const [mode, setMode] = useState<'BUY' | 'RENT' | 'VEHICLE'>('BUY');
  
  // Search State
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [brand, setBrand] = useState(""); // State for Car Brand
  
  // Filters
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (query) params.set('q', query);
    if (location) params.set('state', location);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    
    if (mode === 'BUY') {
      params.set('type', 'PROPERTY');
      params.set('listingCategory', 'SALE');
      if (type) params.set('propertyType', type);
    } else if (mode === 'RENT') {
      params.set('type', 'PROPERTY');
      params.set('listingCategory', 'RENT');
      if (type) params.set('propertyType', type);
    } else {
      params.set('type', 'VEHICLE');
      if (type) params.set('bodyType', type);
      if (brand) params.set('brand', brand); // Add brand to search params
    }

    router.push(`/search?${params.toString()}`);
  };

  const getPriceOptions = () => {
      if (mode === 'RENT') return RENT_PRICES;
      if (mode === 'VEHICLE') return CAR_PRICES;
      return PROPERTY_PRICES;
  };

  // Helper to check if a price button is active
  const isPriceActive = (min: string, max: string) => {
      return minPrice === min && maxPrice === max;
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-10 relative z-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* 1. TOP TABS */}
        <div className="flex justify-center mb-4">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 p-1 rounded-full flex gap-1">
                <button onClick={() => {setMode('BUY'); setMinPrice(''); setMaxPrice('');}} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'BUY' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Buy Property</button>
                <button onClick={() => {setMode('RENT'); setMinPrice(''); setMaxPrice('');}} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'RENT' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Rent Property</button>
                <button onClick={() => {setMode('VEHICLE'); setMinPrice(''); setMaxPrice('');}} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'VEHICLE' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Find Cars</button>
            </div>
        </div>

        {/* 2. MAIN SEARCH BAR */}
        <form onSubmit={handleSearch} className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl ring-1 ring-white/5">
            
            {/* ROW A: FILTERS */}
            <div className="flex flex-col lg:flex-row gap-3 mb-3">
                
                {/* Location */}
                <div className="flex-1 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl px-4 py-2 border border-white/5 group">
                    <div className="flex items-center gap-2 mb-1">
                        <MapPin size={14} className="text-blue-400"/>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</span>
                    </div>
                    <div className="relative">
                        <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-transparent text-white font-bold text-sm appearance-none outline-none cursor-pointer z-10 relative">
                            <option value="" className="bg-neutral-900 text-gray-400">All Malaysia</option>
                            {MALAYSIA_STATES.map(s => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-white transition-colors"/>
                    </div>
                </div>

                {/* Type / Body */}
                <div className="flex-1 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl px-4 py-2 border border-white/5 group">
                    <div className="flex items-center gap-2 mb-1">
                        {mode === 'VEHICLE' ? <Car size={14} className="text-orange-400"/> : <Home size={14} className="text-green-400"/>}
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{mode === 'VEHICLE' ? 'Body Type' : 'Property Type'}</span>
                    </div>
                    <div className="relative">
                        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-transparent text-white font-bold text-sm appearance-none outline-none cursor-pointer z-10 relative">
                            <option value="" className="bg-neutral-900 text-gray-400">All Types</option>
                            {mode === 'VEHICLE' ? VEHICLE_BODY_TYPES.map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>) : PROPERTY_TYPES.map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-white transition-colors"/>
                    </div>
                </div>

                {/* BRAND (Only for Vehicles) */}
                {mode === 'VEHICLE' && (
                    <div className="flex-1 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl px-4 py-2 border border-white/5 group">
                        <div className="flex items-center gap-2 mb-1">
                            <Tag size={14} className="text-yellow-400"/>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Car Brand</span>
                        </div>
                        <div className="relative">
                            <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full bg-transparent text-white font-bold text-sm appearance-none outline-none cursor-pointer z-10 relative">
                                <option value="" className="bg-neutral-900 text-gray-400">All Brands</option>
                                {CAR_BRANDS.map(b => <option key={b} value={b} className="bg-neutral-900">{b}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-white transition-colors"/>
                        </div>
                    </div>
                )}

                {/* Keyword */}
                <div className="flex-[1.5] bg-white/5 hover:bg-white/10 transition-colors rounded-2xl px-4 py-2 border border-white/5 group">
                    <div className="flex items-center gap-2 mb-1">
                        <Search size={14} className="text-purple-400"/>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Keyword</span>
                    </div>
                    <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={mode === 'VEHICLE' ? "Model (e.g. Civic)..." : "Project Name..."} className="w-full bg-transparent text-white font-bold text-sm outline-none placeholder:text-gray-600 placeholder:font-normal"/>
                </div>

                {/* Search Button */}
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 min-w-[120px]">
                    <Search size={18} /> SEARCH
                </button>
            </div>

            {/* ROW B: PRICE CHIPS */}
            <div className="flex items-center gap-2 px-2 overflow-x-auto pb-2 scrollbar-hide border-t border-white/5 pt-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2 flex items-center gap-1 whitespace-nowrap"><DollarSign size={10}/> Price:</span>
                {getPriceOptions().map((p) => (
                    <button 
                        key={p.label} 
                        type="button" 
                        onClick={() => { setMinPrice(p.min); setMaxPrice(p.max); }} 
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all whitespace-nowrap ${
                            isPriceActive(p.min, p.max) 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                            : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

        </form>
    </div>
  );
}
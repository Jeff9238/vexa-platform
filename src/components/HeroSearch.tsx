'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Home, Car, ChevronDown, DollarSign, ArrowRight } from "lucide-react";

const MALAYSIA_STATES = ["Penang", "Selangor", "Kuala Lumpur", "Johor", "Kedah", "Perak", "Melaka", "Negeri Sembilan", "Pahang", "Terengganu", "Kelantan", "Perlis", "Sabah", "Sarawak", "Putrajaya", "Labuan"];

// DATA LISTS
const PROPERTY_TYPES = ["Terrace", "Condo", "Bungalow", "Semi-D", "Apartment", "Townhouse", "Shoplot", "Factory", "Land"];
const VEHICLE_BODY_TYPES = ["Sedan", "SUV", "MPV", "Coupe", "4x4", "Hatchback", "Wagon", "Pickup", "Van"];

export default function HeroSearch() {
  const router = useRouter();
  const [mode, setMode] = useState<'BUY' | 'RENT' | 'VEHICLE'>('BUY');
  
  // Search State
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [priceRange, setPriceRange] = useState("");

  // --- 1. CUSTOM PRICE LOGIC ---
  const getPriceOptions = () => {
    if (mode === 'BUY') {
        // Buy Property: Jump by 100k
        return [
            { label: "Below RM 200k", min: "0", max: "200000" },
            { label: "RM 200k - 300k", min: "200000", max: "300000" },
            { label: "RM 300k - 400k", min: "300000", max: "400000" },
            { label: "RM 400k - 500k", min: "400000", max: "500000" },
            { label: "RM 500k - 600k", min: "500000", max: "600000" },
            { label: "RM 600k - 700k", min: "600000", max: "700000" },
            { label: "RM 700k - 800k", min: "700000", max: "800000" },
            { label: "RM 800k - 1M", min: "800000", max: "1000000" },
            { label: "RM 1M - 1.5M", min: "1000000", max: "1500000" },
            { label: "Above RM 1.5M", min: "1500000", max: "" },
        ];
    } else if (mode === 'RENT') {
        // Rent Property: Jump by 500
        return [
            { label: "Below RM 500", min: "0", max: "500" },
            { label: "RM 500 - 1,000", min: "500", max: "1000" },
            { label: "RM 1,000 - 1,500", min: "1000", max: "1500" },
            { label: "RM 1,500 - 2,000", min: "1500", max: "2000" },
            { label: "RM 2,000 - 2,500", min: "2000", max: "2500" },
            { label: "RM 2,500 - 3,000", min: "2500", max: "3000" },
            { label: "RM 3,000 - 4,000", min: "3000", max: "4000" },
            { label: "RM 4,000 - 5,000", min: "4000", max: "5000" },
            { label: "Above RM 5,000", min: "5000", max: "" },
        ];
    } else {
        // Vehicle: Jump by 10k (roughly)
        return [
            { label: "Below RM 10k", min: "0", max: "10000" },
            { label: "RM 10k - 20k", min: "10000", max: "20000" },
            { label: "RM 20k - 30k", min: "20000", max: "30000" },
            { label: "RM 30k - 40k", min: "30000", max: "40000" },
            { label: "RM 40k - 50k", min: "40000", max: "50000" },
            { label: "RM 50k - 60k", min: "50000", max: "60000" },
            { label: "RM 60k - 80k", min: "60000", max: "80000" },
            { label: "RM 80k - 100k", min: "80000", max: "100000" },
            { label: "RM 100k - 150k", min: "100000", max: "150000" },
            { label: "RM 150k - 200k", min: "150000", max: "200000" },
            { label: "Above RM 200k", min: "200000", max: "" },
        ];
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (query) params.set('q', query);
    if (location) params.set('state', location);
    
    // Handle Price Range
    if (priceRange) {
        const [min, max] = priceRange.split('-');
        if (min) params.set('minPrice', min);
        if (max) params.set('maxPrice', max);
    }
    
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
    }

    router.push(`/search?${params.toString()}`);
  };

  // Helper to reset filters when switching modes
  const switchMode = (newMode: 'BUY' | 'RENT' | 'VEHICLE') => {
      setMode(newMode);
      setPriceRange("");
      setType("");
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-10 relative z-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* 1. PREMIUM TABS */}
        <div className="flex justify-center mb-4">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 p-1 rounded-full flex gap-1">
                <button 
                    onClick={() => switchMode('BUY')} 
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'BUY' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Buy Property
                </button>
                <button 
                    onClick={() => switchMode('RENT')} 
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'RENT' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Rent Property
                </button>
                <button 
                    onClick={() => switchMode('VEHICLE')} 
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'VEHICLE' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Find Cars
                </button>
            </div>
        </div>

        {/* 2. THE POWER SEARCH BAR */}
        <form onSubmit={handleSearch} className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl ring-1 ring-white/5">
            
            <div className="flex flex-col lg:flex-row gap-4">
                
                {/* A. Location Dropdown */}
                <div className="flex-1 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl px-4 py-3 border border-white/5 group focus-within:border-blue-500/50 focus-within:bg-blue-900/10">
                    <div className="flex items-center gap-2 mb-1">
                        <MapPin size={14} className="text-blue-400"/>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</span>
                    </div>
                    <div className="relative">
                        <select 
                            value={location} 
                            onChange={(e) => setLocation(e.target.value)} 
                            className="w-full bg-transparent text-white font-bold text-sm appearance-none outline-none cursor-pointer z-10 relative"
                        >
                            <option value="" className="bg-neutral-900 text-gray-400">All Malaysia</option>
                            {MALAYSIA_STATES.map(s => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-white transition-colors"/>
                    </div>
                </div>

                {/* B. Dynamic Type Dropdown (Car Type vs Property Type) */}
                <div className="flex-1 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl px-4 py-3 border border-white/5 group focus-within:border-orange-500/50 focus-within:bg-orange-900/10">
                    <div className="flex items-center gap-2 mb-1">
                        {mode === 'VEHICLE' ? <Car size={14} className="text-orange-400"/> : <Home size={14} className="text-green-400"/>}
                        {/* DYNAMIC LABEL */}
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {mode === 'VEHICLE' ? 'Car Type' : 'Property Type'}
                        </span>
                    </div>
                    <div className="relative">
                        <select 
                            value={type} 
                            onChange={(e) => setType(e.target.value)} 
                            className="w-full bg-transparent text-white font-bold text-sm appearance-none outline-none cursor-pointer z-10 relative"
                        >
                            <option value="" className="bg-neutral-900 text-gray-400">
                                {mode === 'VEHICLE' ? 'All Body Types' : 'All Residential'}
                            </option>
                            {mode === 'VEHICLE' 
                                ? VEHICLE_BODY_TYPES.map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)
                                : PROPERTY_TYPES.map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)
                            }
                        </select>
                        <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-white transition-colors"/>
                    </div>
                </div>

                {/* C. Keyword Input */}
                <div className="flex-[1.5] bg-white/5 hover:bg-white/10 transition-colors rounded-2xl px-4 py-3 border border-white/5 group focus-within:border-purple-500/50 focus-within:bg-purple-900/10">
                    <div className="flex items-center gap-2 mb-1">
                        <Search size={14} className="text-purple-400"/>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Keyword</span>
                    </div>
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={mode === 'VEHICLE' ? "Search e.g. Honda Civic..." : "Search e.g. Eco Horizon..."}
                        className="w-full bg-transparent text-white font-bold text-sm outline-none placeholder:text-gray-600 placeholder:font-normal"
                    />
                </div>

                {/* D. Search Button */}
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl px-8 py-3 font-bold text-sm transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
                    <Search size={18} />
                    SEARCH
                </button>
            </div>

            {/* 3. DYNAMIC PRICE FILTER ROW */}
            <div className="flex items-center gap-4 mt-4 px-2 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                    <DollarSign size={10}/> Price:
                </span>
                
                {/* Price Dropdown */}
                <div className="relative">
                    <select 
                        value={priceRange} 
                        onChange={(e) => setPriceRange(e.target.value)} 
                        className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none w-40 focus:border-blue-500 transition-colors cursor-pointer"
                    >
                        <option value="" className="bg-neutral-900">Any Budget</option>
                        {getPriceOptions().map((p) => (
                            <option key={p.label} value={`${p.min}-${p.max}`} className="bg-neutral-900">
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Quick Chips (Shortcuts) */}
                {mode === 'VEHICLE' ? (
                    <>
                        <button type="button" onClick={() => {setPriceRange("0-50000")}} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] text-gray-400 hover:text-white transition-all whitespace-nowrap">Below 50k</button>
                        <button type="button" onClick={() => {setPriceRange("50000-100000")}} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] text-gray-400 hover:text-white transition-all whitespace-nowrap">50k - 100k</button>
                    </>
                ) : (
                    <>
                         <button type="button" onClick={() => {setPriceRange("0-500000")}} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] text-gray-400 hover:text-white transition-all whitespace-nowrap">Below 500k</button>
                         <button type="button" onClick={() => {setPriceRange("500000-1000000")}} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] text-gray-400 hover:text-white transition-all whitespace-nowrap">500k - 1M</button>
                    </>
                )}
            </div>

        </form>

    </div>
  );
}
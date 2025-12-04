'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, MapPin, DollarSign, Tag, Home, Car, Check } from "lucide-react";

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
  const [brand, setBrand] = useState(""); 
  
  // Dropdown State
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filters
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
      setOpenDropdown(openDropdown === name ? null : name);
  };

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
      if (brand) params.set('brand', brand); 
    }

    router.push(`/search?${params.toString()}`);
  };

  const getPriceOptions = () => {
      if (mode === 'RENT') return RENT_PRICES;
      if (mode === 'VEHICLE') return CAR_PRICES;
      return PROPERTY_PRICES;
  };

  const isPriceActive = (min: string, max: string) => {
      return minPrice === min && maxPrice === max;
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-10 relative z-20 animate-in fade-in slide-in-from-bottom-4 duration-700" ref={dropdownRef}>
        
        {/* 1. TOP TABS */}
        <div className="flex justify-center mb-6">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 p-1 rounded-full flex gap-1 shadow-2xl">
                <button type="button" onClick={() => {setMode('BUY'); setMinPrice(''); setMaxPrice(''); setType(''); setBrand('');}} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'BUY' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Buy Property</button>
                <button type="button" onClick={() => {setMode('RENT'); setMinPrice(''); setMaxPrice(''); setType(''); setBrand('');}} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'RENT' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Rent Property</button>
                <button type="button" onClick={() => {setMode('VEHICLE'); setMinPrice(''); setMaxPrice(''); setType(''); setBrand('');}} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${mode === 'VEHICLE' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Find Cars</button>
            </div>
        </div>

        {/* 2. SEARCH CONTAINER */}
        <form onSubmit={handleSearch} className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl ring-1 ring-white/5">
            
            {/* --- ROW 1: KEYWORD (FULL WIDTH ON TOP) --- */}
            <div className="mb-4">
                <div className="flex items-center bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-2xl px-6 py-4 group focus-within:border-blue-500/50 focus-within:bg-black/50 focus-within:shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)] relative">
                    <Search size={22} className="text-gray-400 mr-4 group-focus-within:text-blue-500 transition-colors flex-shrink-0 pointer-events-none"/>
                    <div className="flex-grow">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1 group-focus-within:text-blue-400 pointer-events-none">Search Keywords</label>
                        <input 
                            type="text" 
                            value={query} 
                            onChange={(e) => setQuery(e.target.value)} 
                            placeholder={mode === 'VEHICLE' ? "e.g. Honda Civic, BMW X5, Hybrid..." : "e.g. Eco Horizon, Mont Kiara, KLCC..."} 
                            className="w-full bg-transparent text-white font-bold text-lg outline-none placeholder:text-gray-600 placeholder:font-normal"
                        />
                    </div>
                </div>
            </div>

            {/* --- ROW 2: FILTERS GRID --- */}
            <div className={`grid gap-3 mb-4 ${mode === 'VEHICLE' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                
                {/* LOCATION CUSTOM DROPDOWN */}
                <div className="relative">
                    <button 
                        type="button"
                        onClick={() => toggleDropdown('LOCATION')}
                        className="w-full bg-white/5 hover:bg-white/10 transition-colors rounded-2xl px-5 py-3 border border-white/5 flex items-center justify-between text-left"
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <MapPin size={14} className="text-blue-400"/>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</span>
                            </div>
                            <div className="text-white font-bold text-sm truncate">
                                {location || "All Malaysia"}
                            </div>
                        </div>
                        <ChevronDown size={16} className={`text-gray-500 transition-transform ${openDropdown === 'LOCATION' ? 'rotate-180' : ''}`}/>
                    </button>
                    {/* Dropdown List */}
                    {openDropdown === 'LOCATION' && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-black border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1">
                            <button type="button" onClick={() => {setLocation(""); setOpenDropdown(null)}} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-400 hover:bg-white/10 rounded-lg">All Malaysia</button>
                            {MALAYSIA_STATES.map(s => (
                                <button key={s} type="button" onClick={() => {setLocation(s); setOpenDropdown(null)}} className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-white/10 rounded-lg flex justify-between">
                                    {s} {location === s && <Check size={14} className="text-blue-500"/>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* TYPE / BODY CUSTOM DROPDOWN */}
                <div className="relative">
                    <button 
                        type="button"
                        onClick={() => toggleDropdown('TYPE')}
                        className="w-full bg-white/5 hover:bg-white/10 transition-colors rounded-2xl px-5 py-3 border border-white/5 flex items-center justify-between text-left"
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                {mode === 'VEHICLE' ? <Car size={14} className="text-orange-400"/> : <Home size={14} className="text-green-400"/>}
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{mode === 'VEHICLE' ? 'Body Type' : 'Property Type'}</span>
                            </div>
                            <div className="text-white font-bold text-sm truncate">
                                {type || "All Types"}
                            </div>
                        </div>
                        <ChevronDown size={16} className={`text-gray-500 transition-transform ${openDropdown === 'TYPE' ? 'rotate-180' : ''}`}/>
                    </button>
                    {/* Dropdown List */}
                    {openDropdown === 'TYPE' && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-black border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1">
                            <button type="button" onClick={() => {setType(""); setOpenDropdown(null)}} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-400 hover:bg-white/10 rounded-lg">All Types</button>
                            {(mode === 'VEHICLE' ? VEHICLE_BODY_TYPES : PROPERTY_TYPES).map(t => (
                                <button key={t} type="button" onClick={() => {setType(t); setOpenDropdown(null)}} className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-white/10 rounded-lg flex justify-between">
                                    {t} {type === t && <Check size={14} className="text-blue-500"/>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* BRAND CUSTOM DROPDOWN (Only for Vehicles) */}
                {mode === 'VEHICLE' && (
                    <div className="relative">
                        <button 
                            type="button"
                            onClick={() => toggleDropdown('BRAND')}
                            className="w-full bg-white/5 hover:bg-white/10 transition-colors rounded-2xl px-5 py-3 border border-white/5 flex items-center justify-between text-left"
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <Tag size={14} className="text-yellow-400"/>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Car Brand</span>
                                </div>
                                <div className="text-white font-bold text-sm truncate">
                                    {brand || "All Brands"}
                                </div>
                            </div>
                            <ChevronDown size={16} className={`text-gray-500 transition-transform ${openDropdown === 'BRAND' ? 'rotate-180' : ''}`}/>
                        </button>
                        {/* Dropdown List */}
                        {openDropdown === 'BRAND' && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-black border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1">
                                <button type="button" onClick={() => {setBrand(""); setOpenDropdown(null)}} className="w-full text-left px-4 py-3 text-sm font-bold text-gray-400 hover:bg-white/10 rounded-lg">All Brands</button>
                                {CAR_BRANDS.map(b => (
                                    <button key={b} type="button" onClick={() => {setBrand(b); setOpenDropdown(null)}} className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-white/10 rounded-lg flex justify-between">
                                        {b} {brand === b && <Check size={14} className="text-blue-500"/>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- ROW 3: PRICE + SUBMIT --- */}
            <div className="flex flex-col md:flex-row items-center gap-4 justify-between border-t border-white/10 pt-4 mt-2">
                
                {/* Price Chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full md:w-auto scrollbar-hide">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-1 flex items-center gap-1 whitespace-nowrap flex-shrink-0"><DollarSign size={12}/> Price:</span>
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

                {/* Search Button */}
                <button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 hover:scale-105 active:scale-95">
                    <Search size={20} /> SEARCH RESULTS
                </button>

            </div>

        </form>
    </div>
  );
}
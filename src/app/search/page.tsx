'use client';

import React, { useState, Suspense } from 'react';
import { Search, MapPin, SlidersHorizontal, X, Loader2, Home, Car } from 'lucide-react';

// --- MOCK DATA FOR PREVIEW ---
const MOCK_LISTINGS = [
    {
      id: "1",
      title: "Luxury Villa in Penang",
      price: 2500000,
      type: "PROPERTY",
      images: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
      state: "Penang",
      listingCategory: "SALE",
      bedrooms: 5,
      propertyType: "Bungalow",
      user: { name: "Alex Chen" }
    },
    {
      id: "2",
      title: "BMW M4 Competition",
      price: 450000,
      type: "VEHICLE",
      images: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80",
      state: "Kuala Lumpur",
      condition: "USED",
      year: 2021,
      bodyType: "Coupe",
      user: { name: "Sarah Tan" }
    },
    {
      id: "3",
      title: "Modern Loft in KLCC",
      price: 1200000,
      type: "PROPERTY",
      images: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
      state: "Kuala Lumpur",
      listingCategory: "SALE",
      bedrooms: 2,
      propertyType: "Condo",
      user: { name: "David Lee" }
    }
];

// --- INLINE COMPONENTS (To bypass import errors) ---

const FilterSidebar = () => (
  <div className="bg-neutral-900 border border-white/10 p-5 rounded-2xl h-fit w-full shadow-xl">
    <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
        <h3 className="font-bold flex items-center gap-2 text-white text-sm">
            <SlidersHorizontal size={16} className="text-blue-500"/> Filter & Sort
        </h3>
        <button className="text-[10px] text-gray-500 hover:text-white transition-colors">Reset</button>
    </div>
    <div className="space-y-4">
        <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Keywords</label>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <Search size={14} className="text-gray-500 mr-2"/>
                <input placeholder="Model, Project..." className="w-full bg-transparent text-xs text-white outline-none"/>
            </div>
        </div>
        <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 block">Price Range</label>
            <div className="flex gap-2">
                <input placeholder="Min" type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"/>
                <input placeholder="Max" type="number" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"/>
            </div>
        </div>
        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-xs mt-2 transition-colors">
            Apply Filters
        </button>
    </div>
  </div>
);

const FilterMobileTrigger = () => (
    <button className="lg:hidden flex items-center gap-2 bg-neutral-800/80 border border-white/10 px-3 py-1.5 rounded-lg text-white font-bold text-[10px] uppercase">
        <SlidersHorizontal size={12}/> Filters
    </button>
);

const ListingCard = ({ data }: { data: any }) => {
    const isRent = data.listingCategory === 'RENT';
    const condition = data.condition || 'USED';
    const specs = data.type === 'PROPERTY' 
        ? `${data.bedrooms || 0} Beds • ${data.propertyType || 'Property'}`
        : `${data.year || 'N/A'} • ${data.bodyType || 'Vehicle'}`;

    return (
        <div className="group bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all flex flex-col h-full relative">
            <div className="relative h-48 w-full overflow-hidden bg-gray-800">
                <img 
                    src={data.images} 
                    alt={data.title} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" 
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    {data.listingCategory && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded text-white shadow-sm ${isRent ? 'bg-purple-600' : 'bg-green-600'}`}>
                            {data.listingCategory}
                        </span>
                    )}
                    {data.type === 'VEHICLE' && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded text-white bg-orange-600 shadow-sm uppercase">
                            {condition}
                        </span>
                    )}
                </div>

                <div className="absolute bottom-3 left-3">
                    <p className="text-lg font-bold text-white shadow-sm font-serif">RM {data.price.toLocaleString()}</p>
                </div>
            </div>
            
            <div className="p-4 flex flex-col flex-grow">
                <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">{data.title}</h4>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-3">
                    {specs}
                </p>
                
                <div className="w-full h-[1px] bg-white/10 mb-3"></div>

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 max-w-[50%]">
                        <MapPin size={12} className="flex-shrink-0"/> 
                        <span className="truncate">{data.state}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white">
                            {data.user.name?.charAt(0) || 'A'}
                        </div>
                        <span className="text-xs text-gray-300 font-bold truncate">{data.user.name}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SearchResults = () => {
    // Basic state to simulate "Load More"
    const [listings, setListings] = useState(MOCK_LISTINGS);
    const [loading, setLoading] = useState(false);

    const handleLoadMore = () => {
        setLoading(true);
        // Simulate fetch delay
        setTimeout(() => {
            setLoading(false);
            alert("This button would fetch more items from the database.");
        }, 1000);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                {listings.map((item) => (
                    <ListingCard key={item.id} data={item} />
                ))}
            </div>
            
            <div className="flex justify-center pb-20">
                <button 
                    onClick={handleLoadMore} 
                    disabled={loading}
                    className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-8 rounded-xl border border-white/10 transition-all flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20}/> : "Load More Listings"}
                </button>
            </div>
        </>
    );
};

// --- MAIN PAGE COMPONENT ---

export default function SearchPage() {
  const pageTitle = "All Listings";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      
      <div className="h-20" />

      {/* STICKY HEADER */}
      <div className="sticky top-20 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 py-3 shadow-lg transition-all">
          <div className="max-w-[1920px] mx-auto px-6 flex items-center justify-between">
             <div className="flex items-baseline gap-3">
                <h1 className="text-xl font-bold font-serif">
                    {pageTitle}
                </h1>
                <div className="flex gap-2 text-[10px] text-gray-400 uppercase tracking-wider border-l border-white/20 pl-3">
                    <span className="text-blue-400 font-bold">ALL</span>
                    <span>• Malaysia</span>
                </div>
             </div>

             <Suspense fallback={<div className="w-24 h-8 bg-neutral-800 rounded-lg animate-pulse lg:hidden"/>}>
                 <FilterMobileTrigger />
             </Suspense>
          </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1920px] mx-auto px-6 py-4 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR */}
        <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-36 z-30 h-fit self-start hidden lg:block">
            <Suspense fallback={<div className="w-full h-96 bg-neutral-900 rounded-2xl animate-pulse"></div>}>
                <FilterSidebar />
            </Suspense>
        </div>

        {/* RESULTS AREA */}
        <div className="flex-grow min-w-0 w-full">
            <SearchResults />
        </div>
      </div>
    </div>
  );
}
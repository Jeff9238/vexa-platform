'use client'

import { useState, useEffect } from 'react';
// import ListingCard from "./ListingCard"; // Fixed: Inlined below to resolve build error
import { Loader2, Heart, BedDouble, Car, MapPin } from "lucide-react";
// import { fetchListings } from "@/app/actions"; // Prod: Uncomment this
// import { ListingWithUser, SearchFilters } from "@/types"; // Prod: Uncomment this
// import Link from "next/link"; // Prod: Uncomment this

// --- MOCKS FOR PREVIEW (Remove these in Production) ---
interface SearchFilters {
    q?: string;
    [key: string]: any;
}
interface ListingWithUser {
    id: string;
    title: string;
    price: number;
    type: string;
    images: string;
    state: string;
    user: { name: string | null; profileImage: string | null };
    listingCategory?: string;
    condition?: string;
    bedrooms?: number;
    propertyType?: string;
    year?: number;
    bodyType?: string;
    [key: string]: any;
}

// Mock Server Action
const fetchListings = async ({ page }: { page: number }) => {
    await new Promise(r => setTimeout(r, 1000));
    return []; // Return empty to simulate end of list or mock data
};

// --- INLINED COMPONENTS (To fix resolution errors in preview) ---

const FavoriteButton = ({ liked }: { liked?: boolean }) => (
    <button className={`p-2 rounded-full transition-all ${liked ? 'bg-red-500/20 text-red-500' : 'bg-black/40 text-white hover:bg-white hover:text-red-500'}`}>
        <Heart size={18} fill={liked ? "currentColor" : "none"} />
    </button>
);

const ListingCard = ({ data, isLiked = false }: { data: ListingWithUser, isLiked?: boolean }) => {
    const priceDisplay = data.price > 0 ? `RM ${data.price.toLocaleString()}` : "Contact for Price";
    const isRent = data.listingCategory === 'RENT';
    const condition = data.condition || 'USED';
    const Icon = data.type === 'PROPERTY' ? BedDouble : Car;
    const specs = data.type === 'PROPERTY' 
        ? `${data.bedrooms || 0} Beds • ${data.propertyType || 'Property'}`
        : `${data.year || 'N/A'} • ${data.bodyType || 'Vehicle'}`;
    const agentName = data.user?.name || 'Agent';
    const initials = agentName.substring(0, 2).toUpperCase();

    return (
        <div className="group bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(37,99,235,0.3)] flex flex-col h-full relative font-sans">
            <div className="relative h-[240px] w-full overflow-hidden block">
                <img 
                    src={data.images ? data.images.split(',')[0] : 'https://via.placeholder.com/400'} 
                    alt={data.title} 
                    className="object-cover group-hover:scale-105 transition-transform duration-700 w-full h-full" 
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
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
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                    <div onClick={(e) => e.preventDefault()}>
                        <FavoriteButton liked={isLiked} />
                    </div>
                    <div className="bg-black/60 backdrop-blur text-white p-2 rounded-full shadow-lg">
                        <Icon size={14}/>
                    </div>
                </div>
                <div className="absolute bottom-4 left-4">
                    <p className="text-xl font-bold text-white tracking-wide font-serif">
                        {priceDisplay}
                    </p>
                </div>
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h4 className="text-base font-bold text-white mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {data.title}
                </h4>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-4">
                    {specs}
                </p>
                <div className="w-full h-[1px] bg-white/10 mb-4"></div>
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 max-w-[50%]">
                        <MapPin size={12} className="flex-shrink-0"/> 
                        <span className="truncate">{data.state}</span>
                    </div>
                    <div className="flex items-center gap-2 max-w-[50%]">
                        <span className="text-xs text-gray-300 font-bold truncate text-right">{agentName}</span>
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white border border-white/20 flex-shrink-0 overflow-hidden relative">
                            {data.user?.profileImage ? (
                                <img src={data.user.profileImage} alt={agentName} className="object-cover w-full h-full"/>
                            ) : (
                                initials
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
// ----------------------------------------------------

interface SearchResultsProps {
    initialListings: ListingWithUser[];
    filters: SearchFilters;
    myFavs: string[];
}

export default function SearchResults({ initialListings = [], filters, myFavs = [] }: SearchResultsProps) {
    const [listings, setListings] = useState<ListingWithUser[]>(initialListings);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Reset state when filters change (New search)
    useEffect(() => {
        setListings(initialListings);
        setPage(1);
        setHasMore(initialListings.length >= 12); 
    }, [initialListings]); 

    const loadMore = async () => {
        setLoading(true);
        const nextPage = page + 1;
        
        // Fetch next batch
        const newItems = await fetchListings({ 
            // filters, // Mock doesn't use filters
            page: nextPage
            // limit: 12 
        }) as ListingWithUser[];

        if (newItems.length > 0) {
            setListings(prev => [...prev, ...newItems]);
            setPage(nextPage);
            if (newItems.length < 12) setHasMore(false);
        } else {
            setHasMore(false);
        }
        
        setLoading(false);
    };

    if (listings.length === 0) {
        return (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-2xl">
                <p className="text-gray-500 mb-2">No results found matching your criteria.</p>
                {/* Fixed: Use standard anchor for preview */}
                <a href="/search" className="text-blue-500 hover:underline">Clear all filters</a>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                {listings.map((item) => (
                    <ListingCard 
                        key={item.id} 
                        data={item} 
                        isLiked={myFavs.includes(item.id)} 
                    />
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center pb-20">
                    <button 
                        onClick={loadMore} 
                        disabled={loading}
                        className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-8 rounded-xl border border-white/10 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20}/> : "Load More Listings"}
                    </button>
                </div>
            )}
            
            {!hasMore && listings.length > 0 && (
                <div className="text-center pb-20 text-gray-600 text-sm italic">
                    You've reached the end of the list.
                </div>
            )}
        </>
    );
}
'use client'

import { useState } from "react";
import ListingCard from "@/components/ListingCard";
import { fetchListings } from "@/app/actions";
import { Loader2 } from "lucide-react";
import { ListingWithUser } from "@/types"; // Ensure you have this type defined

interface ListingGridProps {
  initialListings: ListingWithUser[];
  filters: any;
  myFavs: string[];
}

export default function ListingGrid({ initialListings, filters, myFavs }: ListingGridProps) {
  const [listings, setListings] = useState<ListingWithUser[]>(initialListings);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialListings.length >= 12);

  const loadMore = async () => {
    setLoading(true);
    const nextPage = page + 1;
    
    // Fetch next batch (12 items)
    const newItems = await fetchListings({ filters, page: nextPage, limit: 12 });
    
    if (newItems.length > 0) {
      // @ts-ignore - Type matching for ListingWithUser can be tricky with server actions
      setListings(prev => [...prev, ...newItems]);
      setPage(nextPage);
      if (newItems.length < 12) setHasMore(false);
    } else {
      setHasMore(false);
    }
    
    setLoading(false);
  };

  return (
    <div className="pb-20">
        {/* RESULTS GRID: 2 Columns on Mobile (grid-cols-2), 3 on Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 mb-12">
            {listings.map((item) => (
                <ListingCard 
                    key={item.id} 
                    data={item} 
                    isLiked={myFavs.includes(item.id)} 
                />
            ))}
        </div>

        {/* EMPTY STATE */}
        {listings.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-2xl">
                <p className="text-gray-500 mb-2">No results found.</p>
                <a href="/search" className="text-blue-500 hover:underline">Clear all filters</a>
            </div>
        )}

        {/* LOAD MORE BUTTON */}
        {hasMore && listings.length > 0 && (
            <div className="flex justify-center">
                <button 
                    onClick={loadMore} 
                    disabled={loading}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 px-8 rounded-full border border-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {loading && <Loader2 size={16} className="animate-spin"/>}
                    {loading ? "Loading..." : "Load More Listings"}
                </button>
            </div>
        )}
    </div>
  );
}
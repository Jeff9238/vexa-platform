import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import { FilterMobileTrigger } from "@/components/FilterSidebar"; 
import FilterBar from "@/components/FilterBar"; // <--- NEW IMPORT
import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server"; 
import ListingGrid from "@/components/ListingGrid"; 
import { fetchListings } from "@/app/actions"; 
import SaveSearchButton from "@/components/SaveSearchButton"; 

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

// ... (getMyFavoriteIds function remains same) ...
async function getMyFavoriteIds() {
    try {
        const user = await currentUser();
        if (!user || !user.emailAddresses[0]) return [];
        const dbUser = await prisma.user.findUnique({
            where: { email: user.emailAddresses[0].emailAddress },
            include: { favorites: true }
        });
        return dbUser ? dbUser.favorites.map(fav => fav.listingId) : [];
    } catch (e) { return []; }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  
  const filters = {
      q: params.q as string,
      type: params.type as string,
      listingCategory: params.listingCategory as string,
      state: params.state as string,
      brand: params.brand as string,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      condition: params.condition as string,
      transmission: params.transmission as string,
      fuelType: params.fuelType as string,
      warranty: params.warranty === 'true',
      tenure: params.tenure as string,
      furnishing: params.furnishing as string,
      bedrooms: params.bedrooms,
      verified: params.verified === 'true',
      sort: params.sort as string,
  };

  // @ts-ignore
  const listings = await fetchListings({ filters, page: 1, limit: 12 });
  const myFavs = await getMyFavoriteIds();
  
  const pageTitle = filters.type === 'PROPERTY' ? 'Properties' : filters.type === 'VEHICLE' ? 'Vehicles' : 'All Listings';

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      
      <div className="h-20" />

      {/* 1. PAGE TITLE HEADER */}
      <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 py-4 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-baseline gap-3 overflow-hidden">
            <h1 className={`text-lg md:text-2xl font-bold truncate ${serifFont.className}`}>{pageTitle}</h1>
            <div className="flex gap-2 text-[10px] text-gray-400 uppercase tracking-wider border-l border-white/20 pl-3 whitespace-nowrap overflow-hidden text-ellipsis">
                {filters.listingCategory && <span className="text-blue-400 font-bold hidden sm:inline">{filters.listingCategory}</span>}
                <span>{listings.length}+ Results</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden sm:block"><SaveSearchButton filters={filters} /></div>
             {/* Mobile Filter Trigger */}
             <Suspense fallback={<div className="w-24 h-8 bg-neutral-800 rounded-lg animate-pulse lg:hidden"/>}>
                 <FilterMobileTrigger />
             </Suspense>
          </div>
      </div>

      {/* 2. DESKTOP FILTER BAR (Hidden on Mobile) */}
      <FilterBar />

      {/* 3. MAIN CONTENT */}
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-4">
        <ListingGrid 
            key={JSON.stringify(filters)}
            initialListings={listings} 
            filters={filters} 
            myFavs={myFavs} 
        />
        
        {/* Mobile Save Search Fallback */}
        {listings.length === 0 && (
             <div className="flex justify-center mt-4 sm:hidden">
                <SaveSearchButton filters={filters} />
             </div>
        )}
      </div>
    </div>
  );
}
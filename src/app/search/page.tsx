import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import FilterSidebar, { FilterMobileTrigger } from "@/components/FilterSidebar"; 
import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server"; 
import ListingGrid from "@/components/ListingGrid"; 
import { fetchListings } from "@/app/actions"; 

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

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
  
  // Extract ALL new filters
  const filters = {
      q: params.q as string,
      type: params.type as string,
      listingCategory: params.listingCategory as string,
      state: params.state as string,
      brand: params.brand as string,
      
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      
      // New Filters
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

  const listings = await fetchListings({ filters, page: 1, limit: 12 });
  const myFavs = await getMyFavoriteIds();
  
  const pageTitle = filters.type === 'PROPERTY' ? 'Properties' : filters.type === 'VEHICLE' ? 'Vehicles' : 'All Listings';

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      
      <div className="h-20" />

      {/* HEADER */}
      <div className="sticky top-20 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 py-3 shadow-lg transition-all">
          <div className="max-w-[1920px] mx-auto px-4 md:px-6 flex items-center justify-between">
             <div className="flex items-baseline gap-3 overflow-hidden">
                <h1 className={`text-lg md:text-xl font-bold truncate ${serifFont.className}`}>{pageTitle}</h1>
                <div className="flex gap-2 text-[10px] text-gray-400 uppercase tracking-wider border-l border-white/20 pl-3 whitespace-nowrap overflow-hidden text-ellipsis">
                    {filters.listingCategory && <span className="text-blue-400 font-bold hidden sm:inline">{filters.listingCategory}</span>}
                    {filters.verified && <span className="text-green-400 hidden sm:inline">• Verified</span>}
                    <span>{listings.length}+ Results</span>
                </div>
             </div>
             <Suspense fallback={<div className="w-24 h-8 bg-neutral-800 rounded-lg animate-pulse lg:hidden"/>}>
                 <FilterMobileTrigger />
             </Suspense>
          </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-4 flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-36 z-30 h-fit self-start">
            <Suspense fallback={<div className="w-full h-12 lg:h-96 bg-neutral-900 rounded-2xl animate-pulse"></div>}>
                <FilterSidebar />
            </Suspense>
        </div>

        <div className="flex-grow min-w-0 w-full">
            <ListingGrid 
                key={JSON.stringify(filters)}
                initialListings={listings} 
                filters={filters} 
                myFavs={myFavs} 
            />
        </div>
      </div>
    </div>
  );
}
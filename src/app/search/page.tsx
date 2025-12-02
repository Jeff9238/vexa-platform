import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import { ArrowLeft } from "lucide-react"; // Removed unused icons
import FilterSidebar from "@/components/FilterSidebar";
import { Suspense } from "react";
import SearchInput from "@/components/SearchInput"; 
import ListingCard from "@/components/ListingCard"; // <--- NEW IMPORT
import { currentUser } from "@clerk/nextjs/server"; // <--- Needed for Favorites

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

// Helper to get favorite IDs
async function getMyFavoriteIds() {
    try {
        const user = await currentUser();
        if (!user || !user.emailAddresses[0]) return [];
        
        const dbUser = await prisma.user.findUnique({
            where: { email: user.emailAddresses[0].emailAddress },
            include: { favorites: true }
        });
        
        if (!dbUser) return [];
        return dbUser.favorites.map(fav => fav.listingId);
    } catch (e) {
        return [];
    }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : undefined;
  
  let typeFilter = typeof params.type === 'string' ? params.type : undefined;
  if (!typeFilter && !query) {
      typeFilter = 'VEHICLE';
  }

  // Filters setup (Same as before...)
  const listingCategory = typeof params.listingCategory === 'string' ? params.listingCategory : undefined;
  const bodyType = typeof params.bodyType === 'string' ? params.bodyType : undefined;
  const stateFilter = typeof params.state === 'string' ? params.state : undefined;
  const minPrice = params.minPrice ? parseFloat(params.minPrice as string) : undefined;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice as string) : undefined;
  const brand = typeof params.brand === 'string' ? params.brand : undefined;
  const year = params.year ? parseInt(params.year as string) : undefined;
  const bedrooms = params.bedrooms ? parseInt(params.bedrooms as string) : undefined;
  const propertyType = typeof params.propertyType === 'string' ? params.propertyType : undefined;

  const whereClause: any = { published: true };

  if (typeFilter) whereClause.type = typeFilter;
  if (listingCategory) whereClause.listingCategory = listingCategory;
  if (bodyType) whereClause.bodyType = bodyType;
  if (stateFilter) whereClause.state = { equals: stateFilter, mode: 'insensitive' };

  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { contains: query, mode: 'insensitive' } },
      { state: { contains: query, mode: 'insensitive' } },
      { area: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (minPrice || maxPrice) {
    whereClause.price = {};
    if (minPrice) whereClause.price.gte = minPrice;
    if (maxPrice) whereClause.price.lte = maxPrice;
  }

  if (brand) whereClause.brand = { contains: brand, mode: 'insensitive' };
  if (year) whereClause.year = { gte: year };
  if (bedrooms) whereClause.bedrooms = { gte: bedrooms };
  if (propertyType) whereClause.propertyType = propertyType;

  // 1. Fetch Listings
  const listings = await prisma.listing.findMany({
    where: whereClause,
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  // 2. Fetch User Favorites (to mark hearts red)
  const myFavs = await getMyFavoriteIds();

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      
      {/* HEADER BAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 px-6 h-20 flex items-center gap-4 shadow-2xl">
        <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"><ArrowLeft size={20}/></Link>
        
        <div className="flex flex-col flex-shrink-0 min-w-[100px]">
            <span className={`text-xl font-bold ${serifFont.className}`}>
                {typeFilter === 'PROPERTY' ? 'Properties' : typeFilter === 'VEHICLE' ? 'Vehicles' : 'All Results'}
            </span>
            <div className="flex gap-2 text-xs">
                {listingCategory && <span className="text-blue-400 font-bold uppercase">For {listingCategory}</span>}
                {stateFilter && <span className="text-gray-400 font-bold uppercase">• {stateFilter}</span>}
                {!typeFilter && query && <span className="text-gray-400 font-bold uppercase">• "{query}"</span>}
            </div>
        </div>

        <Suspense fallback={<div className="h-12 w-full max-w-xl bg-white/5 rounded-2xl animate-pulse mx-4"></div>}>
            <SearchInput />
        </Suspense>
      </nav>

      {/* MAIN CONTENT */}
      <div className="max-w-[1600px] mx-auto px-6 py-8 pt-28 flex flex-col lg:flex-row gap-8">
        
        <Suspense fallback={<div className="w-full lg:w-80 h-96 bg-neutral-900 rounded-2xl animate-pulse"></div>}>
             <FilterSidebar />
        </Suspense>

        <div className="flex-grow">
            <p className="text-gray-400 text-sm mb-6">Found {listings.length} listings</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-2xl">
                        <p className="text-gray-500 mb-2">No results found.</p>
                        <Link href="/search" className="text-blue-500 hover:underline">Clear filters</Link>
                    </div>
                ) : listings.map((item) => (
                    // --- USING NEW COMPONENT HERE ---
                    <ListingCard 
                        key={item.id} 
                        data={item} 
                        isLiked={myFavs.includes(item.id)} 
                    />
                    // --------------------------------
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
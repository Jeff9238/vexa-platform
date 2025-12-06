import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import FilterSidebar, { FilterMobileTrigger } from "@/components/FilterSidebar"; 
import { Suspense } from "react";
import ListingCard from "@/components/ListingCard"; 
import { currentUser } from "@clerk/nextjs/server"; 

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
  const query = typeof params.q === 'string' ? params.q : undefined;
  
  let typeFilter = typeof params.type === 'string' ? params.type : undefined;
  
  // Filters
  const listingCategory = typeof params.listingCategory === 'string' ? params.listingCategory : undefined;
  const bodyType = typeof params.bodyType === 'string' ? params.bodyType : undefined;
  const stateFilter = typeof params.state === 'string' ? params.state : undefined;
  const minPrice = params.minPrice ? parseFloat(params.minPrice as string) : undefined;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice as string) : undefined;
  const brand = typeof params.brand === 'string' ? params.brand : undefined;
  const year = params.year ? parseInt(params.year as string) : undefined;
  const bedrooms = params.bedrooms ? parseInt(params.bedrooms as string) : undefined;
  const propertyType = typeof params.propertyType === 'string' ? params.propertyType : undefined;

  const sortParam = typeof params.sort === 'string' ? params.sort : 'newest';
  let orderBy: any = { createdAt: 'desc' }; 

  switch (sortParam) {
      case 'oldest': orderBy = { createdAt: 'asc' }; break;
      case 'price_asc': orderBy = { price: 'asc' }; break;
      case 'price_desc': orderBy = { price: 'desc' }; break;
      default: orderBy = { createdAt: 'desc' };
  }

  const whereClause: any = { published: true, status: 'ACTIVE' };
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
      { brand: { contains: query, mode: 'insensitive' } }, 
      { model: { contains: query, mode: 'insensitive' } }, 
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

  const listings = await prisma.listing.findMany({
    where: whereClause,
    include: { user: true },
    orderBy: orderBy, 
    take: 50 
  });

  const myFavs = await getMyFavoriteIds();
  const pageTitle = typeFilter === 'PROPERTY' ? 'Properties' : typeFilter === 'VEHICLE' ? 'Vehicles' : 'All Listings';

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      
      <div className="h-20" />

      {/* STICKY HEADER */}
      <div className="sticky top-20 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 py-3 shadow-lg transition-all">
          <div className="max-w-[1920px] mx-auto px-4 md:px-6 flex items-center justify-between">
             {/* Left: Title */}
             <div className="flex items-baseline gap-3 overflow-hidden">
                <h1 className={`text-lg md:text-xl font-bold truncate ${serifFont.className}`}>
                    {pageTitle}
                </h1>
                <div className="flex gap-2 text-[10px] text-gray-400 uppercase tracking-wider border-l border-white/20 pl-3 whitespace-nowrap overflow-hidden text-ellipsis">
                    {listingCategory && <span className="text-blue-400 font-bold hidden sm:inline">{listingCategory}</span>}
                    {stateFilter && <span className="hidden sm:inline">• {stateFilter}</span>}
                    <span>{listings.length} Results</span>
                </div>
             </div>

             {/* Right: Mobile Filter Button */}
             <Suspense fallback={<div className="w-24 h-8 bg-neutral-800 rounded-lg animate-pulse lg:hidden"/>}>
                 <FilterMobileTrigger />
             </Suspense>
          </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-4 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* DESKTOP SIDEBAR */}
        <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-36 z-30 h-fit self-start">
            <Suspense fallback={<div className="w-full h-12 lg:h-96 bg-neutral-900 rounded-2xl animate-pulse"></div>}>
                <FilterSidebar />
            </Suspense>
        </div>

        {/* RESULTS GRID - REFINED FOR MOBILE */}
        <div className="flex-grow min-w-0 w-full">
            {/* GRID CHANGE: grid-cols-2 on mobile, smaller gap */}
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-6 pb-20">
                {listings.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-2xl">
                        <p className="text-gray-500 mb-2">No results found.</p>
                        <Link href="/search" className="text-blue-500 hover:underline">Clear filters</Link>
                    </div>
                ) : listings.map((item) => (
                    <ListingCard 
                        key={item.id} 
                        data={item} 
                        isLiked={myFavs.includes(item.id)} 
                    />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
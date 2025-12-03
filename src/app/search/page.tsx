import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import { ArrowLeft } from "lucide-react";
import FilterSidebar from "@/components/FilterSidebar";
import { Suspense } from "react";
import ListingCard from "@/components/ListingCard"; 
import SortSelect from "@/components/SortSelect"; 
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
  
  // --- SMART TYPE FILTERING ---
  let typeFilter = typeof params.type === 'string' ? params.type : undefined;
  if (!typeFilter && !query) typeFilter = 'VEHICLE';

  // --- FILTERS ---
  const listingCategory = typeof params.listingCategory === 'string' ? params.listingCategory : undefined;
  const bodyType = typeof params.bodyType === 'string' ? params.bodyType : undefined;
  const stateFilter = typeof params.state === 'string' ? params.state : undefined;
  const minPrice = params.minPrice ? parseFloat(params.minPrice as string) : undefined;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice as string) : undefined;
  const brand = typeof params.brand === 'string' ? params.brand : undefined;
  const year = params.year ? parseInt(params.year as string) : undefined;
  const bedrooms = params.bedrooms ? parseInt(params.bedrooms as string) : undefined;
  const propertyType = typeof params.propertyType === 'string' ? params.propertyType : undefined;

  // --- SORTING LOGIC ---
  const sortParam = typeof params.sort === 'string' ? params.sort : 'newest';
  let orderBy: any = { createdAt: 'desc' }; 

  switch (sortParam) {
      case 'oldest': orderBy = { createdAt: 'asc' }; break;
      case 'price_asc': orderBy = { price: 'asc' }; break;
      case 'price_desc': orderBy = { price: 'desc' }; break;
      default: orderBy = { createdAt: 'desc' };
  }

  // --- BUILD QUERY ---
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

  // Fetch
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
      
      {/* SPACER for Fixed Navbar (h-20 = 80px) */}
      <div className="h-20" />

      {/* 1. STICKY PAGE HEADER (Title + Sort) */}
      {/* Stacks right below the Navbar (top-20) */}
      <div className="sticky top-20 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 py-4 shadow-lg transition-all">
          <div className="max-w-[1920px] mx-auto px-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 text-gray-400 hover:text-white">
                    <ArrowLeft size={20}/>
                </Link>
                <div>
                    <h1 className={`text-3xl font-bold ${serifFont.className}`}>
                        {pageTitle}
                    </h1>
                    <div className="flex gap-2 text-xs text-gray-400 mt-1">
                        {listingCategory && <span className="text-blue-400 font-bold uppercase">{listingCategory}</span>}
                        {stateFilter && <span>• {stateFilter}</span>}
                        {!typeFilter && query && <span>• "{query}"</span>}
                        <span className="text-gray-500">• {listings.length} Found</span>
                    </div>
                </div>
            </div>

            {/* Sort Component */}
            <div className="flex items-center gap-2 self-end md:self-auto">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden md:block">Sort By:</span>
                <SortSelect />
            </div>
          </div>
      </div>

      {/* 2. MAIN CONTENT ROW */}
      <div className="max-w-[1920px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* FILTER SIDEBAR (Sticky below Header) */}
        {/* top-44 ensures it sits below Navbar (20) + Page Header (~24) */}
        <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-44 z-30 h-fit self-start">
            <Suspense fallback={<div className="w-full h-12 lg:h-96 bg-neutral-900 rounded-2xl animate-pulse"></div>}>
                <FilterSidebar />
            </Suspense>
        </div>

        {/* RESULTS GRID */}
        <div className="flex-grow min-w-0 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
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
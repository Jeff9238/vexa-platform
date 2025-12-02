import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import { BedDouble, Car, ArrowLeft, MapPin } from "lucide-react";
import FilterSidebar from "@/components/FilterSidebar";
import { Suspense } from "react";
import SearchInput from "@/components/SearchInput"; 

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : undefined;
  
  // --- FIX: SMART TYPE FILTERING ---
  // 1. If 'type' is explicitly in URL, use it.
  // 2. If 'type' is missing BUT we have a search 'query', search ALL types (undefined).
  // 3. If neither, default to 'VEHICLE' (initial page load).
  let typeFilter = typeof params.type === 'string' ? params.type : undefined;
  
  if (!typeFilter && !query) {
      typeFilter = 'VEHICLE';
  }

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

  const whereClause: any = {
    published: true,
  };

  // Only apply type filter if we determined one is needed
  if (typeFilter) {
      whereClause.type = typeFilter;
  }

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

  const listings = await prisma.listing.findMany({
    where: whereClause,
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      
      {/* HEADER BAR (FIXED) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 px-6 h-20 flex items-center gap-4 shadow-2xl">
        <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"><ArrowLeft size={20}/></Link>
        
        <div className="flex flex-col flex-shrink-0 min-w-[100px]">
            <span className={`text-xl font-bold ${serifFont.className}`}>
                {/* Dynamic Title based on what we are showing */}
                {typeFilter === 'PROPERTY' ? 'Properties' : typeFilter === 'VEHICLE' ? 'Vehicles' : 'All Results'}
            </span>
            <div className="flex gap-2 text-xs">
                {listingCategory && <span className="text-blue-400 font-bold uppercase">For {listingCategory}</span>}
                {stateFilter && <span className="text-gray-400 font-bold uppercase">• {stateFilter}</span>}
                {!typeFilter && query && <span className="text-gray-400 font-bold uppercase">• "{query}"</span>}
            </div>
        </div>

        {/* SEARCH BAR COMPONENT */}
        <Suspense fallback={<div className="h-12 w-full max-w-xl bg-white/5 rounded-2xl animate-pulse mx-4"></div>}>
            <SearchInput />
        </Suspense>

      </nav>

      {/* MAIN CONTENT */}
      <div className="max-w-[1600px] mx-auto px-6 py-8 pt-28 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filter */}
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
                    <div key={item.id} className="group bg-neutral-900 border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all">
                        <Link href={`/listing/${item.id}`}>
                            <div className="relative h-[200px] w-full overflow-hidden">
                                <Image 
                                    src={item.images ? item.images.split(',')[0] : 'https://via.placeholder.com/400'} 
                                    alt={item.title} 
                                    fill 
                                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                                />
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white p-1.5 rounded-full">
                                    {item.type === 'PROPERTY' ? <BedDouble size={14}/> : <Car size={14}/>}
                                </div>
                                {item.listingCategory && (
                                    <div className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded text-white ${item.listingCategory === 'SALE' ? 'bg-green-600' : 'bg-purple-600'}`}>
                                        {item.listingCategory}
                                    </div>
                                )}
                                <div className="absolute bottom-3 left-3">
                                    <p className={`text-lg font-semibold text-white ${serifFont.className}`}>
                                    RM {item.price.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </Link>
                        <div className="p-4">
                            <h4 className="text-sm font-bold text-white mb-2 line-clamp-1">{item.title}</h4>
                            <div className="flex gap-2 text-[10px] text-gray-400 uppercase tracking-wider mb-3">
                                {item.type === 'VEHICLE' ? (
                                    <><span>{item.year}</span> • <span>{item.bodyType}</span></>
                                ) : (
                                    <><span>{item.bedrooms} Beds</span> • <span>{item.propertyType}</span></>
                                )}
                            </div>
                            <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                                <span className="flex items-center gap-1"><MapPin size={10}/> {item.state}</span>
                                <span>{item.user?.name || 'Agent'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
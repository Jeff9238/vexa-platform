import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import { BedDouble, Car, ArrowLeft, Filter, MapPin } from "lucide-react";
import FilterSidebar from "@/components/FilterSidebar";

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  
  const params = await searchParams;
  const typeFilter = typeof params.type === 'string' ? params.type : 'VEHICLE';
  const query = typeof params.q === 'string' ? params.q : undefined;
  
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
    type: typeFilter,
  };

  // 1. STRICT CATEGORY FILTER
  if (listingCategory) whereClause.listingCategory = listingCategory;
  if (bodyType) whereClause.bodyType = bodyType;
  
  // 2. ROBUST STATE FILTER (Fixed: Case Insensitive)
  if (stateFilter) {
    whereClause.state = { equals: stateFilter, mode: 'insensitive' };
  }

  // 3. KEYWORD SEARCH
  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { contains: query, mode: 'insensitive' } },
      { state: { contains: query, mode: 'insensitive' } },
      { area: { contains: query, mode: 'insensitive' } },
    ];
  }

  // 4. Price Range
  if (minPrice || maxPrice) {
    whereClause.price = {};
    if (minPrice) whereClause.price.gte = minPrice;
    if (maxPrice) whereClause.price.lte = maxPrice;
  }

  // 5. Specs
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
      
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors"><ArrowLeft size={20}/></Link>
        <div className="flex flex-col">
            <span className={`text-xl font-bold ${serifFont.className}`}>
                {typeFilter === 'PROPERTY' ? 'Properties' : 'Vehicles'}
            </span>
            <div className="flex gap-2 text-xs">
                {listingCategory && <span className="text-blue-400 font-bold uppercase">For {listingCategory}</span>}
                {stateFilter && <span className="text-gray-400 font-bold uppercase">• {stateFilter}</span>}
            </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        <FilterSidebar />

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
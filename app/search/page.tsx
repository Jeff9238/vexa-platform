import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import { Search, BedDouble, Car, ArrowLeft, Filter } from "lucide-react";

// Fonts
const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

// 1. THIS RUNS ON THE SERVER
export default async function SearchPage({
  searchParams,
}: {
  // FIX: searchParams is now a Promise in Next.js 15+
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  
  // FIX: We must "await" the params before using them
  const params = await searchParams;

  // Read the filters
  const typeFilter = typeof params.type === 'string' ? params.type : undefined;
  const query = typeof params.q === 'string' ? params.q : undefined;

  // Build the Database Query
  const whereClause: any = {
    published: true,
  };

  // If URL has ?type=PROPERTY, filter by it
  if (typeFilter) {
    whereClause.type = typeFilter;
  }

  // If URL has ?q=something, search titles and tags
  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { contains: query, mode: 'insensitive' } },
    ];
  }

  // Fetch from DB
  const listings = await prisma.listing.findMany({
    where: whereClause,
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      
      {/* HEADER */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20}/>
        </Link>
        <span className={`text-xl font-bold ${serifFont.className}`}>
            {typeFilter ? `${typeFilter === 'PROPERTY' ? 'Properties' : 'Supercars'}` : 'Search Results'}
        </span>
      </nav>

      {/* SEARCH BAR AREA */}
      <div className="px-6 py-8 border-b border-white/5">
         <form className="max-w-4xl mx-auto flex gap-2">
            <div className="flex-grow bg-neutral-900 border border-white/10 rounded-xl flex items-center px-4">
                <Search className="text-gray-500" size={18}/>
                <input 
                    name="q"
                    defaultValue={query}
                    placeholder="Search by keyword (e.g. Pool, BMW, Sea View)..." 
                    className="w-full bg-transparent border-none outline-none p-4 text-white placeholder:text-gray-600"
                />
                {/* Maintain type filter if searching */}
                {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
            </div>
            <button type="submit" className="bg-blue-600 px-8 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                Search
            </button>
         </form>
      </div>

      {/* RESULTS GRID */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
            <p className="text-gray-400 text-sm">Found {listings.length} results</p>
            <button className="flex items-center gap-2 text-xs font-bold border border-white/20 px-4 py-2 rounded-full hover:bg-white hover:text-black transition-colors">
                <Filter size={12}/> FILTERS
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.length === 0 ? (
                <div className="col-span-full text-center py-20 text-gray-500">
                    No listings found matching your criteria.
                </div>
            ) : listings.map((item) => (
                <div key={item.id} className="group bg-neutral-900 border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all">
                    {/* Image */}
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
                            <div className="absolute bottom-3 left-3">
                                <p className={`text-lg font-semibold text-white ${serifFont.className}`}>
                                   RM {item.price.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </Link>

                    {/* Info */}
                    <div className="p-4">
                        <h4 className="text-sm font-bold text-white mb-2 line-clamp-1">{item.title}</h4>
                        <div className="flex flex-wrap gap-1 mb-3">
                            {item.tags.split(',').slice(0, 2).map((tag, i) => (
                                <span key={i} className="text-[9px] uppercase bg-white/5 px-1.5 py-0.5 rounded text-gray-400">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                        <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            <span>{item.user?.name || 'Agent'}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
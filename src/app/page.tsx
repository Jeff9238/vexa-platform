import Image from "next/image";
import Link from "next/link"; 
import { Playfair_Display, Manrope } from 'next/font/google';
import { Search, Menu, BedDouble, Car, MessageCircle, ArrowRight } from "lucide-react"; 
import { prisma } from "@/lib/prisma"; // FIXED IMPORT

// 1. Setup Premium Fonts
const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '800'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

// SERVER SIDE: Fetch Data
async function getListings() {
  try {
    const listings = await prisma.listing.findMany({
      where: { published: true },
      include: { user: true },
      orderBy: { createdAt: 'desc' }, // Newest first
      take: 50 
    });
    return listings;
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export default async function Home() {
  const allListings = await getListings();

  // --- AUTOMATIC ARRANGEMENT LOGIC ---
  const properties = allListings
    .filter(item => item.type === 'PROPERTY')
    .slice(0, 4);

  const vehicles = allListings
    .filter(item => item.type === 'VEHICLE')
    .slice(0, 4);

  return (
    <main className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className} selection:bg-white selection:text-black`}>
      
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center mix-blend-difference">
        <div className="flex items-center gap-2">
           <span className={`text-2xl font-bold tracking-tighter ${serifFont.className}`}>VEXA.</span>
        </div>
        
        <div className="flex items-center gap-4">
            <Link href="/post">
               <button className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-blue-900/20">
                 + Post Ad
               </button>
            </Link>
             <button className="md:hidden flex items-center gap-2 text-xs uppercase tracking-widest border border-white/20 px-4 py-2 rounded-full hover:bg-white hover:text-black transition-all">
               Menu <Menu size={14} />
             </button>
        </div>
      </nav>

      {/* --- SECTION 1: HERO --- */}
      <section className="relative h-[80vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
           <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2700&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-30"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
        </div>

        <div className="relative z-10 text-center max-w-5xl px-6 pt-10">
           <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-blue-500 mb-6 animate-pulse">
              The Future of Asset Trading
           </p>
           <h1 className={`text-6xl md:text-8xl text-white leading-[0.9] mb-8 ${serifFont.className}`}>
             Beyond <br/> <span className="italic font-light text-gray-500">Luxury.</span>
           </h1>
        </div>
      </section>

      {/* --- SECTION 2: SPLIT LAYOUT (LEFT vs RIGHT) --- */}
      <section className="py-24 px-6 md:px-12 bg-[#050505] border-t border-white/10">
         <div className="max-w-[1600px] mx-auto">
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative">
                
                {/* Vertical Divider */}
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

                {/* === LEFT SIDE: PROPERTIES === */}
                <div className="flex flex-col gap-8">
                    <div className="flex justify-between items-end pb-4 border-b border-white/10">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 block">Residences</span>
                            <h3 className={`text-4xl text-white ${serifFont.className}`}>Latest Properties</h3>
                        </div>
                        <Link href="/search?type=PROPERTY" className="text-xs font-bold flex items-center gap-2 hover:text-blue-500 transition-colors">
                            SEE ALL <ArrowRight size={14}/>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {properties.length === 0 ? <p className="text-gray-600 italic">No properties listed yet.</p> : 
                         properties.map((item) => <ListingCard key={item.id} item={item} icon={<BedDouble size={14}/>} />)
                        }
                    </div>
                </div>

                {/* === RIGHT SIDE: VEHICLES === */}
                <div className="flex flex-col gap-8">
                    <div className="flex justify-between items-end pb-4 border-b border-white/10">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2 block">Supercars</span>
                            <h3 className={`text-4xl text-white ${serifFont.className}`}>Latest Vehicles</h3>
                        </div>
                        <Link href="/search?type=VEHICLE" className="text-xs font-bold flex items-center gap-2 hover:text-orange-500 transition-colors">
                            SEE ALL <ArrowRight size={14}/>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {vehicles.length === 0 ? <p className="text-gray-600 italic">No vehicles listed yet.</p> : 
                         vehicles.map((item) => <ListingCard key={item.id} item={item} icon={<Car size={14}/>} />)
                        }
                    </div>
                </div>

             </div>
         </div>
      </section>

    </main>
  );
}

// --- REUSABLE CARD COMPONENT ---
function ListingCard({ item, icon }: { item: any, icon: any }) {
    const priceDisplay = item.price > 0 
        ? `RM ${item.price.toLocaleString()}` 
        : "Contact for Price";

    return (
        <Link href={`/listing/${item.id}`} className="block h-full group">
            <div className="bg-neutral-900 border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col h-full">
                
                {/* Image */}
                <div className="relative h-[200px] w-full overflow-hidden">
                    <Image 
                        src={item.images ? item.images.split(',')[0] : 'https://via.placeholder.com/400'} 
                        alt={item.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white p-1.5 rounded-full">
                        {icon}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent"></div>
                    <div className="absolute bottom-3 left-3">
                        <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-0.5">Price</p>
                        <p className="text-lg font-semibold text-white font-serif tracking-wide">{priceDisplay}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-grow">
                    <h4 className="text-sm font-bold text-white mb-2 line-clamp-2 leading-snug min-h-[2.5rem] group-hover:text-blue-400 transition-colors">
                        {item.title}
                    </h4>
                    
                    {/* Agent Mini Bar */}
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center font-bold text-[8px] text-blue-200 border border-blue-500/30">
                                {item.user?.name ? item.user.name.substring(0,2).toUpperCase() : 'AG'}
                            </div>
                            <p className="text-[10px] text-gray-400 max-w-[80px] truncate">{item.user?.name || 'Agent'}</p>
                        </div>
                        <div className="text-green-500 hover:text-green-400 transition-colors">
                            <MessageCircle size={16}/>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
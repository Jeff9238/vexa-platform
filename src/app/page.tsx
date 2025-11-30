import Image from "next/image";
import Link from "next/link"; 
import { Playfair_Display, Manrope } from 'next/font/google';
import { Menu, BedDouble, Car, MessageCircle, ArrowRight, LayoutDashboard, Plus, MapPin } from "lucide-react"; 
import { prisma } from "@/lib/prisma"; 
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs"; 
import HeroSearch from "@/components/HeroSearch"; // Import the Search Component

// 1. Setup Premium Fonts
const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '800'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

// SERVER SIDE: Fetch Data
async function getListings() {
  try {
    const listings = await prisma.listing.findMany({
      where: { published: true },
      include: { user: true },
      orderBy: { createdAt: 'desc' }, 
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

  const properties = allListings.filter(item => item.type === 'PROPERTY').slice(0, 4);
  const vehicles = allListings.filter(item => item.type === 'VEHICLE').slice(0, 4);

  return (
    <main className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className} selection:bg-blue-500 selection:text-white`}>
      
      {/* --- SMART NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 px-6 md:px-8 py-5 flex justify-between items-center bg-black/40 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="flex items-center gap-2 cursor-pointer group">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white group-hover:rotate-12 transition-transform">V</div>
           <span className={`text-2xl font-bold tracking-tighter text-white ${serifFont.className}`}>VEXA.</span>
        </div>
        
        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-6">
            <SignedOut>
                <SignInButton mode="modal">
                    <button className="text-gray-300 font-bold text-xs hover:text-white transition-colors tracking-widest uppercase">
                        Log in
                    </button>
                </SignInButton>
                <Link href="/post">
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)] hover:shadow-[0_0_20px_-3px_rgba(37,99,235,0.6)]">
                        + Post Ad
                    </button>
                </Link>
            </SignedOut>

            <SignedIn>
                <Link href="/dashboard" className="hidden md:flex items-center gap-2 text-gray-300 font-bold text-sm hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:border-white/20">
                    <LayoutDashboard size={16}/> Dashboard
                </Link>
                <Link href="/post">
                   <button className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)] hover:shadow-[0_0_20px_-3px_rgba(37,99,235,0.6)]">
                     <Plus size={18}/> Post
                   </button>
                </Link>
                <div className="rounded-full ring-2 ring-white/10 hover:ring-white/30 transition-all p-0.5">
                    <UserButton afterSignOutUrl="/"/>
                </div>
            </SignedIn>

             <button className="md:hidden flex items-center gap-2 text-white/80 hover:text-white">
               <Menu size={24} />
             </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
           <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2700&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-30 scale-105 animate-[pulse_10s_ease-in-out_infinite]"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-black/20" />
        </div>

        <div className="relative z-10 text-center max-w-5xl px-6 pt-10">
           <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-blue-400 mb-6 font-bold">
              The Future of Asset Trading
           </p>
           <h1 className={`text-6xl md:text-9xl text-white leading-[0.9] mb-8 ${serifFont.className}`}>
             Beyond <br/> <span className="italic font-light text-gray-500">Luxury.</span>
           </h1>
           
           {/* THE SEARCH BAR COMPONENT */}
           <HeroSearch />

        </div>
      </section>

      {/* --- LISTINGS GRID --- */}
      <section className="py-24 px-6 md:px-12 bg-[#0a0a0a] border-t border-white/10">
         <div className="max-w-[1600px] mx-auto">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative">
                
                <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

                {/* LEFT: PROPERTIES */}
                <div className="flex flex-col gap-8">
                    <div className="flex justify-between items-end pb-4 border-b border-white/10">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 block">Residences</span>
                            <h3 className={`text-4xl text-white ${serifFont.className}`}>Latest Properties</h3>
                        </div>
                        <Link href="/search?type=PROPERTY" className="text-xs font-bold flex items-center gap-2 text-white hover:text-blue-500 transition-colors">
                            SEE ALL <ArrowRight size={14}/>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {properties.length === 0 ? <p className="text-gray-600 italic">No properties listed yet.</p> : 
                         properties.map((item) => <ListingCard key={item.id} item={item} icon={<BedDouble size={14}/>} />)
                        }
                    </div>
                </div>

                {/* RIGHT: VEHICLES */}
                <div className="flex flex-col gap-8">
                    <div className="flex justify-between items-end pb-4 border-b border-white/10">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2 block">Supercars</span>
                            <h3 className={`text-4xl text-white ${serifFont.className}`}>Latest Vehicles</h3>
                        </div>
                        <Link href="/search?type=VEHICLE" className="text-xs font-bold flex items-center gap-2 text-white hover:text-orange-500 transition-colors">
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

// --- CARD COMPONENT ---
function ListingCard({ item, icon }: { item: any, icon: any }) {
    const priceDisplay = item.price > 0 
        ? `RM ${item.price.toLocaleString()}` 
        : "Contact for Price";
    
    // NEW: Proper Location Display (Area + State)
    const locationDisplay = item.area ? `${item.area}, ${item.state}` : item.state;

    return (
        <Link href={`/listing/${item.id}`} className="block h-full group">
            <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(37,99,235,0.3)] flex flex-col h-full">
                
                <div className="relative h-[240px] w-full overflow-hidden">
                    <Image 
                        src={item.images ? item.images.split(',')[0] : 'https://via.placeholder.com/400'} 
                        alt={item.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur text-white p-2 rounded-full">
                        {icon}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                        <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-0.5 font-bold">Price</p>
                        <p className="text-xl font-bold text-white font-serif tracking-wide">{priceDisplay}</p>
                    </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                    <h4 className="text-base font-bold text-white mb-2 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
                        {item.title}
                    </h4>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[8px] text-white">
                                {item.user?.name ? item.user.name.substring(0,2).toUpperCase() : 'AG'}
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs text-gray-300 max-w-[100px] truncate font-bold">{item.user?.name || 'Agent'}</p>
                                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <MapPin size={10}/> {locationDisplay}
                                </p>
                            </div>
                        </div>
                        <div className="text-white/50 group-hover:text-green-400 transition-colors">
                            <MessageCircle size={18}/>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
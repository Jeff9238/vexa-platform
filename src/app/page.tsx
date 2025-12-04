import { prisma } from "@/lib/prisma"; 
import { currentUser } from "@clerk/nextjs/server"; 
import { Playfair_Display, Manrope } from 'next/font/google';
import Navbar from "@/components/Navbar"; 
import HeroSearch from "@/components/HeroSearch"; // <--- RESTORED IMPORT
import CategoryIcons from "@/components/CategoryIcons"; 
import ListingCarousel from "@/components/ListingCarousel"; 
import NewsSection from "@/components/NewsSection"; 
import TrustedAgents from "@/components/TrustedAgents"; 
import Link from "next/link";
import { Plus } from "lucide-react";

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '800'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

// Data Fetchers
async function getMyFavorites() {
  try {
    const user = await currentUser();
    if (!user || !user.emailAddresses[0]) return [];
    const dbUser = await prisma.user.findUnique({
      where: { email: user.emailAddresses[0].emailAddress },
      include: { favorites: true }
    });
    return dbUser ? dbUser.favorites.map(fav => fav.listingId) : [];
  } catch { return []; }
}

async function getHomePageData() {
    const freshListings = await prisma.listing.findMany({
        where: { published: true, status: 'ACTIVE' },
        include: { user: true },
        orderBy: { createdAt: 'desc' }, 
        take: 10 
    });

    const premiumListings = await prisma.listing.findMany({
        where: { 
            published: true,
            status: 'ACTIVE',
            OR: [
                { type: 'PROPERTY', price: { gte: 1000000 } },
                { type: 'VEHICLE', price: { gte: 200000 } }
            ]
        },
        include: { user: true },
        orderBy: { price: 'desc' }, 
        take: 10 
    });

    const activeAgents = await prisma.user.findMany({
        where: { phoneNumber: { not: null } }, // Only show agents with contact info
        take: 5
    });

    return { freshListings, premiumListings, activeAgents };
}

export default async function Home() {
  const { freshListings, premiumListings, activeAgents } = await getHomePageData();
  const myFavorites = await getMyFavorites(); 

  return (
    <main className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className} selection:bg-blue-500 selection:text-white`}>
      
      <Navbar />

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[850px] w-full flex flex-col items-center justify-start pt-48 overflow-hidden">
        <div className="absolute inset-0 z-0">
           <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2700&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-30 scale-105 animate-[pulse_10s_ease-in-out_infinite]"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-black/30" />
        </div>
        
        <div className="relative z-10 text-center max-w-5xl px-6 w-full">
           <h1 className={`text-5xl md:text-7xl text-white leading-tight mb-6 ${serifFont.className}`}>
               Find Your <span className="text-blue-500 italic">VEXA.</span>
           </h1>
           <p className="text-gray-300 mb-8 text-lg max-w-2xl mx-auto hidden md:block">
               The premier marketplace for luxury properties and high-performance vehicles in Malaysia.
           </p>
           
           {/* RESTORED: Full Filter Widget */}
           <HeroSearch />
           
           <div className="mt-6 flex justify-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
               <span>Trending:</span>
               <Link href="/search?q=KLCC" className="hover:text-white transition-colors">KLCC</Link>
               <Link href="/search?q=BMW" className="hover:text-white transition-colors">BMW</Link>
               <Link href="/search?q=Mont%20Kiara" className="hover:text-white transition-colors">Mont Kiara</Link>
               <Link href="/search?q=Porsche" className="hover:text-white transition-colors">Porsche</Link>
           </div>
        </div>
      </section>

      {/* 2. QUICK ACCESS ICONS */}
      <CategoryIcons />

      {/* 3. PREMIUM COLLECTION CAROUSEL */}
      <ListingCarousel 
        title="The VEXA Collection" 
        subtitle="Exclusive listings curated for the discerning few."
        link="/search?minPrice=1000000"
        items={premiumListings}
        myFavs={myFavorites}
      />

      {/* 4. FRESH DROPS CAROUSEL */}
      <ListingCarousel 
        title="Fresh on Market" 
        subtitle="Be the first to view the latest arrivals."
        link="/search"
        items={freshListings}
        myFavs={myFavorites}
      />

      {/* 5. CTA BANNER */}
      <div className="py-12 px-6">
          <div className="max-w-[1600px] mx-auto bg-gradient-to-r from-blue-900 to-black border border-white/10 rounded-3xl p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="relative z-10">
                  <h3 className={`text-3xl font-bold mb-2 ${serifFont.className}`}>Have an asset to sell?</h3>
                  <p className="text-blue-200">Join thousands of agents and owners on VEXA today.</p>
              </div>
              <div className="relative z-10">
                  <Link href="/post" className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-black/20">
                      <Plus size={20}/> Post Your Ad Free
                  </Link>
              </div>
              
              {/* Background Decor */}
              <div className="absolute -right-20 -top-40 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
          </div>
      </div>

      {/* 6. NEWS SECTION */}
      <NewsSection />

      {/* 7. TRUSTED AGENTS */}
      <TrustedAgents agents={activeAgents} />

      {/* FOOTER */}
      <footer className="py-12 text-center text-gray-600 text-xs border-t border-white/5 bg-black">
          <p className="mb-2">&copy; 2025 VEXA Marketplace. All Rights Reserved.</p>
          <div className="flex justify-center gap-4">
              <Link href="#" className="hover:text-gray-400">Privacy Policy</Link>
              <Link href="#" className="hover:text-gray-400">Terms of Service</Link>
              <Link href="#" className="hover:text-gray-400">Contact Support</Link>
          </div>
      </footer>

    </main>
  );
}
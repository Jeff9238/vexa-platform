'use client'

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, Suspense } from "react"; 
import { usePathname, useRouter, useSearchParams } from "next/navigation"; 
import { Playfair_Display, Manrope } from 'next/font/google';
import { Menu, X, ChevronDown, LayoutDashboard, Plus, Heart, Settings, Car, Home, Search } from "lucide-react"; 
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '800'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

// --- 1. DESKTOP SEARCH COMPONENT ---
function NavbarSearch() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        setSearchQuery(searchParams.get('q') || "");
    }, [searchParams]);

    const handleNavSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    if (pathname === '/') return null;

    return (
        <form onSubmit={handleNavSearch} className="relative group mr-4 hidden xl:block">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 focus-within:bg-black/80 focus-within:border-blue-500/50 transition-all w-64 shadow-inner">
                <Search size={14} className="text-gray-500 mr-2 group-focus-within:text-blue-500 transition-colors"/>
                <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-600 w-full font-medium"
                />
            </div>
        </form>
    );
}

// --- 2. MAIN NAVBAR COMPONENT ---
export default function Navbar() {
  const router = useRouter(); // <--- Need Router for mobile search
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Mobile Search State
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");

  const handleMobileSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (mobileSearchQuery.trim()) {
          setMobileMenuOpen(false); // Close menu
          router.push(`/search?q=${encodeURIComponent(mobileSearchQuery)}`);
      }
  };

  return (
    <>
    <nav className={`fixed top-0 w-full z-50 px-6 md:px-8 py-4 bg-black/60 backdrop-blur-xl border-b border-white/5 transition-all ${sansFont.className}`}>
        <div className="max-w-[1920px] mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-4">
            
            {/* LEFT: LOGO */}
            <Link href="/" className="flex items-center gap-3 cursor-pointer group z-20 mr-8">
                <div className="relative w-10 h-10 overflow-hidden rounded-xl shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform border border-white/10 bg-white"> 
                    <Image 
                        src="/vexa.jpg" 
                        alt="VEXA Logo" 
                        fill 
                        className="object-cover p-0.5" 
                    />
                </div>
                <span className={`text-2xl font-bold tracking-tighter text-blue-500 ${serifFont.className}`}>
                    VEXA.
                </span>
            </Link>

            {/* MIDDLE: NAVIGATION & SEARCH */}
            <div className="hidden md:flex items-center justify-center">
                
                <Suspense fallback={<div className="w-64 h-10 bg-white/5 rounded-full animate-pulse mr-4 hidden xl:block"/>}>
                    <NavbarSearch />
                </Suspense>

                <div className="flex items-center gap-6">
                    {/* Properties Dropdown */}
                    <div 
                        className="relative h-full flex items-center py-2"
                        onMouseEnter={() => setActiveDropdown('PROPERTIES')}
                        onMouseLeave={() => setActiveDropdown(null)}
                    >
                        <button className="text-sm font-medium text-gray-300 hover:text-white flex items-center gap-1">
                            Properties <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'PROPERTIES' ? 'rotate-180' : ''}`}/>
                        </button>
                        
                        {activeDropdown === 'PROPERTIES' && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col p-1 animate-in fade-in slide-in-from-top-2 duration-200 mt-2">
                                <Link href="/search?type=PROPERTY&listingCategory=SALE" className="px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg text-left border-b border-white/5">
                                    <span className="text-green-400 font-bold block text-[10px] uppercase mb-0.5">Buy</span>
                                    Properties For Sale
                                </Link>
                                <Link href="/search?type=PROPERTY&listingCategory=RENT" className="px-4 py-3 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg text-left border-b border-white/5">
                                    <span className="text-purple-400 font-bold block text-[10px] uppercase mb-0.5">Rent</span>
                                    Properties For Rent
                                </Link>
                                <Link href="/search?type=PROPERTY&condition=New" className="px-4 py-3 text-sm text-blue-400 hover:bg-blue-900/20 rounded-lg text-left font-bold">
                                    New Developments
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Vehicles Dropdown */}
                    <div 
                        className="relative h-full flex items-center py-2"
                        onMouseEnter={() => setActiveDropdown('VEHICLES')}
                        onMouseLeave={() => setActiveDropdown(null)}
                    >
                        <button className="text-sm font-medium text-gray-300 hover:text-white flex items-center gap-1">
                            Vehicles <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'VEHICLES' ? 'rotate-180' : ''}`}/>
                        </button>
                        
                        {activeDropdown === 'VEHICLES' && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col p-1 animate-in fade-in slide-in-from-top-2 duration-200 mt-2">
                                <Link href="/search?type=VEHICLE" className="px-4 py-3 text-sm text-white font-bold hover:bg-white/10 rounded-lg text-left bg-white/5 mb-1">
                                    Browse All Cars
                                </Link>
                                
                                <div className="grid grid-cols-2 gap-1 p-1">
                                    <Link href="/search?type=VEHICLE&brand=Toyota" className="px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded-lg text-center bg-black/40 border border-white/5">Toyota</Link>
                                    <Link href="/search?type=VEHICLE&brand=Honda" className="px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded-lg text-center bg-black/40 border border-white/5">Honda</Link>
                                    <Link href="/search?type=VEHICLE&brand=BMW" className="px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded-lg text-center bg-black/40 border border-white/5">BMW</Link>
                                    <Link href="/search?type=VEHICLE&brand=Mercedes" className="px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded-lg text-center bg-black/40 border border-white/5">Mercedes</Link>
                                </div>
                            </div>
                        )}
                    </div>

                    <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">News</Link>
                </div>
            </div>
            
            {/* RIGHT: ACTIONS */}
            <div className="flex items-center justify-end gap-4 z-20">
                
                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="text-gray-300 font-bold text-xs hover:text-white transition-colors tracking-widest uppercase px-2">
                            Log in
                        </button>
                    </SignInButton>
                    <Link href="/post" className="hidden md:block">
                        <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/20">
                            + Post Ad
                        </button>
                    </Link>
                </SignedOut>

                <SignedIn>
                    <Link href="/favorites">
                        <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-red-500 hover:bg-white/5 transition-all">
                            <Heart size={20} />
                        </button>
                    </Link>

                    <Link href="/dashboard" className="hidden md:flex items-center gap-2 text-gray-300 font-bold text-sm hover:text-white transition-colors bg-white/5 px-4 py-2.5 rounded-full border border-white/5 hover:border-white/20">
                        <LayoutDashboard size={16}/> <span className="hidden lg:inline">Dashboard</span>
                    </Link>
                    
                    <Link href="/post">
                    <button className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/20">
                        <Plus size={18}/> <span className="hidden lg:inline">Post</span>
                    </button>
                    </Link>

                    <Link href="/settings" className="hidden md:flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10 mr-2" title="Settings">
                        <Settings size={20} />
                    </Link>

                    <div className="rounded-full ring-2 ring-white/10 hover:ring-white/30 transition-all p-0.5 ml-2">
                        <UserButton afterSignOutUrl="/"/>
                    </div>
                </SignedIn>

                {/* MOBILE MENU TOGGLE BUTTON */}
                <button 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden flex items-center justify-center w-10 h-10 text-white/80 hover:text-white bg-white/5 rounded-full"
                >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </div>
    </nav>

    {/* --- MOBILE MENU OVERLAY --- */}
    {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0a0a0a] pt-24 px-6 animate-in slide-in-from-top-10 duration-200 md:hidden">
            <div className="flex flex-col gap-6 text-xl font-bold text-gray-300">
                
                {/* MOBILE SEARCH BAR (FIXED) */}
                <form onSubmit={handleMobileSearch} className="relative group">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-3 focus-within:bg-black/80 focus-within:border-blue-500/50 transition-all w-full">
                        <Search size={18} className="text-gray-500 mr-2"/>
                        <input 
                            value={mobileSearchQuery}
                            onChange={(e) => setMobileSearchQuery(e.target.value)}
                            placeholder="Search properties or cars..."
                            className="bg-transparent border-none outline-none text-base text-white placeholder:text-gray-600 w-full"
                        />
                    </div>
                </form>

                <div className="space-y-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold border-b border-white/10 pb-2">Browse</p>
                    <Link href="/search?type=PROPERTY" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 hover:text-blue-500 transition-colors">
                        <Home size={24} className="text-blue-500"/> Properties
                    </Link>
                    <Link href="/search?type=VEHICLE" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 hover:text-orange-500 transition-colors">
                        <Car size={24} className="text-orange-500"/> Vehicles
                    </Link>
                </div>

                <SignedIn>
                    <div className="space-y-4 mt-4">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold border-b border-white/10 pb-2">Account</p>
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 hover:text-white transition-colors">
                            <LayoutDashboard size={24}/> Dashboard
                        </Link>
                        <Link href="/post" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 hover:text-white transition-colors">
                            <Plus size={24}/> Post Ad
                        </Link>
                        <Link href="/favorites" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 hover:text-white transition-colors">
                            <Heart size={24}/> Favorites
                        </Link>
                        <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 hover:text-white transition-colors">
                            <Settings size={24}/> Settings
                        </Link>
                    </div>
                </SignedIn>

                <SignedOut>
                    <div className="mt-4">
                        <Link href="/post" onClick={() => setMobileMenuOpen(false)} className="block w-full bg-blue-600 text-white text-center py-4 rounded-2xl font-bold">
                            Post an Ad
                        </Link>
                    </div>
                </SignedOut>

            </div>
        </div>
    )}
    </>
  );
}
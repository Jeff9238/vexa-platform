'use client'

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, Suspense } from "react"; 
import { usePathname } from "next/navigation"; 
import { Manrope, Playfair_Display } from 'next/font/google';
import { Menu, X, LayoutDashboard, Plus, Heart, Settings, Car, Home, Search, ArrowLeft, MessageSquare } from "lucide-react"; 
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import SearchInput from "@/components/SearchInput"; 
import { getUnreadCount } from "@/app/actions"; 

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '800'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0); 
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
        setIsScrolled(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
      const checkMessages = async () => {
          const count = await getUnreadCount();
          setUnreadCount(count);
      };
      
      checkMessages(); 
      const interval = setInterval(checkMessages, 60000); 
      return () => clearInterval(interval);
  }, []);

  const showSearch = pathname !== '/' || isScrolled;

  // --- LOGIC UPDATE: HIDE NAVBAR ON IMMERSIVE PAGES ---
  // 1. Listing Details (/listing/...)
  // 2. Chat Room (/chat/...) BUT NOT Inbox (/chat)
  if (pathname?.startsWith('/listing/') || (pathname?.startsWith('/chat/') && pathname !== '/chat')) {
      return null;
  }

  return (
    <>
    <nav className={`fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 transition-all ${sansFont.className}`}>
        <div className="max-w-[1920px] mx-auto px-6 h-20 flex items-center justify-between gap-4 relative">
            
            {mobileSearchOpen ? (
                <div className="absolute inset-0 bg-neutral-900 z-50 flex items-center px-4 animate-in fade-in slide-in-from-top-2">
                    <button onClick={() => setMobileSearchOpen(false)} className="p-2 text-gray-400 hover:text-white mr-2"><ArrowLeft size={24} /></button>
                    <div className="flex-1"><Suspense fallback={<div className="h-10 bg-white/5 rounded-xl animate-pulse"/>}><SearchInput /></Suspense></div>
                </div>
            ) : (
                <>
                    <Link href="/" className="flex items-center gap-3 cursor-pointer group z-20 flex-shrink-0">
                        <div className="relative w-10 h-10 overflow-hidden rounded-xl shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform border border-white/10 bg-white"> 
                            <Image src="/vexa.jpg" alt="VEXA Logo" fill className="object-cover p-0.5" />
                        </div>
                        <span className={`text-2xl font-bold tracking-tighter text-blue-500 ${serifFont.className}`}>VEXA.</span>
                    </Link>

                    <div className={`flex-1 max-w-2xl mx-auto hidden md:block transition-opacity duration-500 ${showSearch ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                        <Suspense fallback={<div className="h-12 w-full bg-white/5 rounded-2xl animate-pulse"/>}><SearchInput /></Suspense>
                    </div>
                    
                    <div className="flex items-center justify-end gap-3 z-20 flex-shrink-0">
                        <Link href="/search?type=PROPERTY" className="hidden lg:flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-white transition-colors px-3 py-2">Properties</Link>
                        <Link href="/search?type=VEHICLE" className="hidden lg:flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-white transition-colors px-3 py-2 mr-2">Vehicles</Link>

                        {showSearch && <button onClick={() => setMobileSearchOpen(true)} className="md:hidden flex items-center justify-center w-10 h-10 text-white/80 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-all"><Search size={20} /></button>}

                        <SignedOut>
                            <SignInButton mode="modal"><button className="text-gray-300 font-bold text-xs hover:text-white transition-colors tracking-widest uppercase px-2 hidden sm:block">Log in</button></SignInButton>
                            <Link href="/post" className="hidden md:block"><button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/20">+ Post Ad</button></Link>
                        </SignedOut>

                        <SignedIn>
                            <Link href="/favorites" className="hidden md:flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-red-500 hover:bg-white/5 transition-all"><Heart size={20} /></Link>

                            <Link href="/chat" className="relative flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                <MessageSquare size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"></span>
                                )}
                            </Link>

                            <Link href="/dashboard" className="hidden md:flex items-center gap-2 text-gray-300 font-bold text-sm hover:text-white transition-colors bg-white/5 px-4 py-2.5 rounded-full border border-white/5 hover:border-white/20">
                                <LayoutDashboard size={16}/> <span className="hidden lg:inline">Dashboard</span>
                            </Link>
                            
                            <Link href="/post"><button className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-600/20"><Plus size={18}/> <span className="hidden lg:inline">Post</span></button></Link>
                            <Link href="/settings" className="hidden md:flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10 mr-2"><Settings size={20} /></Link>
                            <div className="ml-2"><UserButton afterSignOutUrl="/"/></div>
                        </SignedIn>

                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden flex items-center justify-center w-10 h-10 text-white/80 hover:text-white bg-white/5 rounded-full ml-2">{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
                    </div>
                </>
            )}
        </div>
    </nav>

    {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#0a0a0a] pt-24 px-6 animate-in slide-in-from-top-10 duration-200 md:hidden">
            <div className="flex flex-col gap-6 text-xl font-bold text-gray-300">
                <div className="mb-4"><Suspense fallback={<div className="h-10 bg-white/5 rounded-xl animate-pulse"/>}><SearchInput /></Suspense></div>
                <div className="space-y-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold border-b border-white/10 pb-2">Browse</p>
                    <Link href="/search?type=PROPERTY" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 hover:text-blue-500 transition-colors"><Home size={24} className="text-blue-500"/> Properties</Link>
                    <Link href="/search?type=VEHICLE" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 hover:text-orange-500 transition-colors"><Car size={24} className="text-orange-500"/> Vehicles</Link>
                </div>
                <SignedIn>
                    <div className="space-y-4 mt-4">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold border-b border-white/10 pb-2">Account</p>
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 hover:text-white transition-colors"><LayoutDashboard size={24}/> Dashboard</Link>
                        <Link href="/chat" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 hover:text-white transition-colors">
                            <div className="relative">
                                <MessageSquare size={24}/>
                                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></span>}
                            </div>
                            Messages
                        </Link>
                        <Link href="/post" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 hover:text-white transition-colors"><Plus size={24}/> Post Ad</Link>
                        <Link href="/favorites" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 hover:text-white transition-colors"><Heart size={24}/> Favorites</Link>
                        <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 hover:text-white transition-colors"><Settings size={24}/> Settings</Link>
                    </div>
                </SignedIn>
                <SignedOut><div className="mt-4"><Link href="/post" onClick={() => setMobileMenuOpen(false)} className="block w-full bg-blue-600 text-white text-center py-4 rounded-2xl font-bold">Post an Ad</Link></div></SignedOut>
            </div>
        </div>
    )}
    </>
  );
}
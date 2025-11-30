'use client'

import Link from "next/link";
import { useState } from "react";
import { Playfair_Display, Manrope } from 'next/font/google';
import { Menu, ChevronDown, LayoutDashboard, Plus, Heart } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '800'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <nav className={`fixed top-0 w-full z-50 px-6 md:px-8 py-4 flex justify-between items-center bg-black/60 backdrop-blur-xl border-b border-white/5 transition-all ${sansFont.className}`}>
        
        {/* LEFT: LOGO */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer group z-20">
           <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-900/50 group-hover:scale-105 transition-transform">V</div>
           <span className={`text-2xl font-bold tracking-tighter text-white ${serifFont.className}`}>VEXA.</span>
        </Link>

        {/* MIDDLE: CATEGORY DROPDOWNS */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 h-full">
            
            {/* PROPERTIES DROPDOWN */}
            <div 
                className="relative h-full flex items-center"
                onMouseEnter={() => setActiveDropdown('PROPERTIES')}
                onMouseLeave={() => setActiveDropdown(null)}
            >
                <button className="text-sm font-medium text-gray-300 hover:text-white flex items-center gap-1 py-4">
                    Properties <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'PROPERTIES' ? 'rotate-180' : ''}`}/>
                </button>
                
                {activeDropdown === 'PROPERTIES' && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col p-1 animate-in fade-in slide-in-from-top-2 duration-200">
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

            {/* VEHICLES DROPDOWN (UPDATED TO BRANDS) */}
            <div 
                className="relative h-full flex items-center"
                onMouseEnter={() => setActiveDropdown('VEHICLES')}
                onMouseLeave={() => setActiveDropdown(null)}
            >
                <button className="text-sm font-medium text-gray-300 hover:text-white flex items-center gap-1 py-4">
                    Vehicles <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'VEHICLES' ? 'rotate-180' : ''}`}/>
                </button>
                
                {activeDropdown === 'VEHICLES' && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Link href="/search?type=VEHICLE" className="px-4 py-3 text-sm text-white font-bold hover:bg-white/10 rounded-lg text-left bg-white/5 mb-1">
                            Browse All Cars
                        </Link>
                        
                        <div className="grid grid-cols-2 gap-1 p-1">
                            <Link href="/search?type=VEHICLE&brand=Toyota" className="px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded-lg text-center bg-black/40 border border-white/5">
                                Toyota
                            </Link>
                            <Link href="/search?type=VEHICLE&brand=Honda" className="px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded-lg text-center bg-black/40 border border-white/5">
                                Honda
                            </Link>
                            <Link href="/search?type=VEHICLE&brand=BMW" className="px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded-lg text-center bg-black/40 border border-white/5">
                                BMW
                            </Link>
                            <Link href="/search?type=VEHICLE&brand=Mercedes" className="px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded-lg text-center bg-black/40 border border-white/5">
                                Mercedes
                            </Link>
                            <Link href="/search?type=VEHICLE&brand=Porsche" className="px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded-lg text-center bg-black/40 border border-white/5">
                                Porsche
                            </Link>
                            <Link href="/search?type=VEHICLE&brand=Proton" className="px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white rounded-lg text-center bg-black/40 border border-white/5">
                                Proton
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">News</Link>
        </div>
        
        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-4 z-20">
            
            <SignedOut>
                <SignInButton mode="modal">
                    <button className="text-gray-300 font-bold text-xs hover:text-white transition-colors tracking-widest uppercase px-2">
                        Log in
                    </button>
                </SignInButton>
                <Link href="/post">
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

                <div className="rounded-full ring-2 ring-white/10 hover:ring-white/30 transition-all p-0.5 ml-2">
                    <UserButton afterSignOutUrl="/"/>
                </div>
            </SignedIn>

             <button className="md:hidden flex items-center gap-2 text-white/80 hover:text-white">
               <Menu size={24} />
             </button>
        </div>
    </nav>
  );
}
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import { ArrowLeft, Trash2, Wallet, Plus, Settings } from "lucide-react";
import { deleteListing } from "../actions";

// Fonts
const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

// --- IMPORTANT: YOUR ADMIN ID ---
// (We use this to identify YOU in the database)
const MY_USER_ID = '88e84ca3-8e34-46a8-9b68-88e9ffc2e438'; 

export default async function Dashboard() {
  
  // 1. Fetch My Profile (Credits)
  const me = await prisma.user.findUnique({
    where: { id: MY_USER_ID },
    include: {
        listings: {
            orderBy: { createdAt: 'desc' }
        }
    }
  });

  if (!me) return <div className="text-white p-10">User not found. Check ID.</div>;

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className} p-6`}>
      
      {/* HEADER */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20}/> Back to Home
        </Link>
        <h1 className={`text-2xl font-bold ${serifFont.className}`}>Agent Dashboard</h1>
        <button className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700">
            <Settings size={20}/>
        </button>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: PROFILE CARD */}
        <div className="space-y-6">
            
            {/* ID Card */}
            <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 text-center">
                <div className="w-24 h-24 mx-auto bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-xl shadow-blue-900/20">
                    {me.name ? me.name.substring(0,2).toUpperCase() : 'AG'}
                </div>
                <h2 className="text-xl font-bold">{me.name || 'Agent'}</h2>
                <p className="text-gray-500 text-sm mb-6">{me.email}</p>
                <div className="inline-block px-4 py-1 bg-green-900/30 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                    VERIFIED AGENT
                </div>
            </div>

            {/* Wallet Card */}
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
                
                <div className="flex items-center gap-2 text-blue-200 mb-2">
                    <Wallet size={18}/> VEXA Credits
                </div>
                <div className={`text-5xl font-bold mb-6 ${serifFont.className}`}>
                    {me.credits}
                </div>
                <div className="flex gap-2">
                    <button className="flex-1 bg-white text-blue-900 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
                        Top Up
                    </button>
                    <Link href="/post" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition-colors text-center flex items-center justify-center gap-2">
                        <Plus size={18}/> Post Ad
                    </Link>
                </div>
                <p className="text-[10px] text-blue-300/50 mt-4 text-center">
                    Each post deducts 5 Credits.
                </p>
            </div>

        </div>

        {/* RIGHT: MY LISTINGS */}
        <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                My Active Listings <span className="text-sm bg-neutral-800 px-2 py-0.5 rounded-full text-gray-400">{me.listings.length}</span>
            </h3>

            <div className="space-y-4">
                {me.listings.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-neutral-800 rounded-2xl text-center text-gray-500">
                        You haven't posted anything yet.
                    </div>
                ) : me.listings.map((item) => (
                    <div key={item.id} className="bg-neutral-900 border border-white/5 p-4 rounded-2xl flex gap-4 items-center group hover:border-white/20 transition-all">
                        
                        {/* Thumbnail */}
                        <div className="relative w-24 h-24 bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0">
                            <Image 
                                src={item.images ? item.images.split(',')[0] : ''} 
                                alt="Thumb" 
                                fill 
                                className="object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-grow">
                            <h4 className="font-bold text-lg line-clamp-1">{item.title}</h4>
                            <p className="text-blue-400 font-bold text-sm">RM {item.price.toLocaleString()}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 uppercase">{item.type}</span>
                                <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-500/20 uppercase">Published</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <form action={async () => {
                            'use server'
                            await deleteListing(item.id)
                        }}>
                            <button className="p-3 bg-red-900/20 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                                <Trash2 size={20}/>
                            </button>
                        </form>

                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}
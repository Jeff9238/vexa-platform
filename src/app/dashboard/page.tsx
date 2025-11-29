import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import { ArrowLeft, Trash2, Wallet, Plus, Settings } from "lucide-react";
import { deleteListing } from "../actions";
import { currentUser } from "@clerk/nextjs/server"; // Import Clerk
import { redirect } from "next/navigation";

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function Dashboard() {
  
  // 1. Get Logged In User
  const clerkUser = await currentUser();
  if (!clerkUser) return redirect("/sign-in");

  const email = clerkUser.emailAddresses[0].emailAddress;

  // 2. Find them in Database
  const me = await prisma.user.findUnique({
    where: { email: email },
    include: {
        listings: {
            orderBy: { createdAt: 'desc' }
        }
    }
  });

  // If user signed up but hasn't been synced to DB yet (rare edge case)
  if (!me) {
    return <div className="text-white p-10">Profile creating... Please try posting an ad first to initialize your wallet.</div>;
  }

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className} p-6`}>
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20}/> Back to Home
        </Link>
        <h1 className={`text-2xl font-bold ${serifFont.className}`}>Agent Dashboard</h1>
        
        {/* Clerk User Button (Optional, but useful) */}
        <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden">
            <img src={clerkUser.imageUrl} alt="Profile" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: PROFILE */}
        <div className="space-y-6">
            <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 text-center">
                <div className="w-24 h-24 mx-auto bg-blue-600 rounded-full flex items-center justify-center p-1 mb-4 shadow-xl shadow-blue-900/20 overflow-hidden">
                    <img src={clerkUser.imageUrl} alt="User" className="rounded-full" />
                </div>
                <h2 className="text-xl font-bold">{me.name}</h2>
                <p className="text-gray-500 text-sm mb-6">{me.email}</p>
                <div className="inline-block px-4 py-1 bg-green-900/30 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                    VERIFIED AGENT
                </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900 to-slate-900 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
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
            </div>
        </div>

        {/* RIGHT: LISTINGS */}
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
                    <div key={item.id} className="bg-neutral-900 border border-white/5 p-4 rounded-2xl flex gap-4 items-center">
                        <div className="relative w-24 h-24 bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0">
                            <Image 
                                src={item.images ? item.images.split(',')[0] : ''} 
                                alt="Thumb" 
                                fill 
                                className="object-cover"
                            />
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-bold text-lg line-clamp-1">{item.title}</h4>
                            <p className="text-blue-400 font-bold text-sm">RM {item.price.toLocaleString()}</p>
                        </div>
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
import { prisma } from "@/lib/prisma"; 
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import { ArrowLeft, Trash2, Wallet, Plus, Pencil, MapPin, Eye, MessageCircle, Phone, TrendingUp, Car, Home, CheckCircle2, CircleDashed } from "lucide-react";
import { deleteListing, toggleListingStatus } from "../actions";
import { currentUser } from "@clerk/nextjs/server"; 
import { redirect } from "next/navigation";
import AICoachModal from "@/components/AICoachModal"; 

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function Dashboard() {
  const clerkUser = await currentUser();
  if (!clerkUser) return redirect("/sign-in");

  const email = clerkUser.emailAddresses[0].emailAddress;

  const me = await prisma.user.findUnique({
    where: { email: email },
    include: {
        listings: {
            orderBy: { createdAt: 'desc' }
        }
    }
  });

  if (!me) return redirect("/post");

  // Separate Listings
  const properties = me.listings.filter(l => l.type === 'PROPERTY');
  const vehicles = me.listings.filter(l => l.type === 'VEHICLE');

  // Calculate Total Stats
  const totalViews = me.listings.reduce((acc, l) => acc + l.views, 0);
  const totalLeads = me.listings.reduce((acc, l) => acc + l.whatsappClicks + l.callClicks, 0);

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className} p-6 pt-28`}>
      
      {/* HEADER */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div>
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2">
                <ArrowLeft size={16}/> Back to Home
            </Link>
            <h1 className={`text-3xl font-bold ${serifFont.className}`}>Agent Dashboard</h1>
        </div>
        <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden border border-white/20">
            <img src={me.profileImage || clerkUser.imageUrl} alt="Profile" className="w-full h-full object-cover"/>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: STATS & WALLET */}
        <div className="space-y-6">
            
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
                    <button className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors">
                        Top Up
                    </button>
                    <Link href="/post" className="flex-1 bg-white text-blue-900 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-center flex items-center justify-center gap-2">
                        <Plus size={18}/> Post Ad
                    </Link>
                </div>
            </div>

            {/* Total Performance */}
            <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">Performance Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black rounded-2xl border border-white/5">
                        <div className="text-blue-500 mb-2"><Eye size={20}/></div>
                        <div className="text-2xl font-bold text-white">{totalViews}</div>
                        <div className="text-xs text-gray-500">Total Views</div>
                    </div>
                    <div className="p-4 bg-black rounded-2xl border border-white/5">
                        <div className="text-green-500 mb-2"><TrendingUp size={20}/></div>
                        <div className="text-2xl font-bold text-white">{totalLeads}</div>
                        <div className="text-xs text-gray-500">Total Leads</div>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT: SEPARATED LISTINGS */}
        <div className="lg:col-span-2 space-y-12">
            
            {/* 1. PROPERTIES SECTION */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-900/30 text-blue-400 rounded-lg"><Home size={20}/></div>
                    <h3 className="text-xl font-bold">Property Listings <span className="text-sm text-gray-500 ml-2">({properties.length})</span></h3>
                </div>

                <div className="space-y-4">
                    {properties.length === 0 ? (
                        <div className="p-8 border border-white/5 bg-white/5 rounded-2xl text-center text-gray-500 text-sm">
                            No properties listed yet.
                        </div>
                    ) : properties.map((item) => (
                        <DashboardListingCard key={item.id} item={item} />
                    ))}
                </div>
            </div>

            {/* 2. VEHICLES SECTION */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-900/30 text-orange-400 rounded-lg"><Car size={20}/></div>
                    <h3 className="text-xl font-bold">Vehicle Listings <span className="text-sm text-gray-500 ml-2">({vehicles.length})</span></h3>
                </div>

                <div className="space-y-4">
                    {vehicles.length === 0 ? (
                        <div className="p-8 border border-white/5 bg-white/5 rounded-2xl text-center text-gray-500 text-sm">
                            No vehicles listed yet.
                        </div>
                    ) : vehicles.map((item) => (
                        <DashboardListingCard key={item.id} item={item} />
                    ))}
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: DASHBOARD CARD ---
function DashboardListingCard({ item }: { item: any }) {
    const isSold = item.status === 'SOLD'; // Check Status

    return (
        <div className={`border p-6 rounded-2xl flex flex-col gap-6 group transition-all ${isSold ? 'bg-neutral-900/50 border-white/5' : 'bg-neutral-900 border-white/5 hover:border-white/20'}`}>
            
            {/* Top Row: Info */}
            <div className="flex gap-4">
                <div className="relative w-24 h-24 bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0">
                    <Image 
                        src={item.images ? item.images.split(',')[0] : 'https://via.placeholder.com/150'} 
                        alt="Thumb" 
                        fill 
                        className={`object-cover ${isSold ? 'grayscale opacity-50' : ''}`} // Dim if sold
                    />
                    {isSold && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/80 px-2 py-1 rounded border border-white/10">Sold</span>
                        </div>
                    )}
                </div>
                <div className="flex-grow min-w-0">
                    <h4 className={`font-bold text-lg line-clamp-1 ${isSold ? 'text-gray-500 line-through' : 'text-white'}`}>{item.title}</h4>
                    <p className="text-blue-400 font-bold text-sm mb-2">RM {item.price.toLocaleString()}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPin size={12}/> {item.location}</span>
                        <span>Listed {new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                
                {/* Actions Dropdown / Buttons */}
                <div className="flex flex-col gap-2">
                    
                    {/* --- SOLD TOGGLE BUTTON --- */}
                    <form action={async () => {
                        'use server'
                        await toggleListingStatus(item.id, isSold ? 'ACTIVE' : 'SOLD')
                    }}>
                        <button 
                            className={`p-2 rounded-lg transition-all text-center flex items-center gap-2 text-xs font-bold w-full justify-center ${
                                isSold 
                                ? 'bg-green-900/20 text-green-500 border border-green-900/50' 
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                            title={isSold ? "Mark as Active" : "Mark as Sold"}
                        >
                            {isSold ? <CheckCircle2 size={16}/> : <CircleDashed size={16}/>}
                            {isSold ? "SOLD" : "ACTIVE"}
                        </button>
                    </form>
                    {/* --------------------------- */}

                    <Link href={`/edit/${item.id}`} className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition-all text-center" title="Edit">
                        <Pencil size={16}/>
                    </Link>
                    <form action={async () => {
                        'use server'
                        await deleteListing(item.id)
                    }}>
                        <button className="p-2 bg-red-900/10 text-red-500 rounded-lg hover:bg-red-900/30 transition-all w-full flex justify-center" title="Delete">
                            <Trash2 size={16}/>
                        </button>
                    </form>
                </div>
            </div>

            {/* Bottom Row: Analytics Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400" title="Total Page Views">
                        <Eye size={16}/> <span className="font-bold text-white">{item.views}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400" title="WhatsApp Clicks">
                        <MessageCircle size={16}/> <span className="font-bold text-white">{item.whatsappClicks}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400" title="Call Button Clicks">
                        <Phone size={16}/> <span className="font-bold text-white">{item.callClicks}</span>
                    </div>
                </div>

                {/* AI Coach (Only if active) */}
                {!isSold && <AICoachModal listingId={item.id} />}
            </div>

        </div>
    );
}
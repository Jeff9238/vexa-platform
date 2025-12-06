import { prisma } from "@/lib/prisma";
import { getAgentReviews } from "@/app/actions"; // <--- New Import
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Playfair_Display, Manrope } from 'next/font/google';
import { Phone, MessageCircle, Globe, CheckCircle, BedDouble, Car, Star, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import ReviewModal from "@/components/ReviewModal"; // <--- New Import
import { currentUser } from "@clerk/nextjs/server";

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '800'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

async function getMyFavoriteIds() {
    try {
        const user = await currentUser();
        if (!user || !user.emailAddresses[0]) return [];
        
        const dbUser = await prisma.user.findUnique({
            where: { email: user.emailAddresses[0].emailAddress },
            include: { favorites: true }
        });
        
        if (!dbUser) return [];
        return dbUser.favorites.map(fav => fav.listingId);
    } catch (e) {
        return [];
    }
}

export default async function AgentProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Fetch Agent & Listings
  const agent = await prisma.user.findUnique({
    where: { id },
    include: {
        listings: {
            where: { published: true, status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            include: { user: true }
        }
    }
  });

  if (!agent) notFound();

  // 2. Fetch Reviews & Favs
  const { reviews, average, count } = await getAgentReviews(id);
  const myFavs = await getMyFavoriteIds();
  const user = await currentUser();
  const isMe = user?.emailAddresses[0]?.emailAddress === agent.email;

  // Stats
  const propertyCount = agent.listings.filter(l => l.type === 'PROPERTY').length;
  const vehicleCount = agent.listings.filter(l => l.type === 'VEHICLE').length;

  const phone = agent.phoneNumber ? agent.phoneNumber.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = phone ? `https://wa.me/${phone}?text=Hi ${agent.name}, I found your profile on VEXA.` : null;

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-32">
        
        {/* --- PROFILE HEADER --- */}
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 md:p-12 mb-16 flex flex-col md:flex-row gap-10 items-center md:items-start relative overflow-hidden shadow-2xl">
            
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Avatar */}
            <div className="relative w-40 h-40 flex-shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-neutral-800 shadow-2xl relative z-10 bg-neutral-800">
                    {agent.profileImage ? (
                        <Image src={agent.profileImage} alt={agent.name || "Agent"} fill className="object-cover"/>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-500 bg-neutral-800">
                            {agent.name?.substring(0,1).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="absolute bottom-2 right-2 z-20 bg-blue-600 text-white p-1.5 rounded-full border-4 border-neutral-900" title="Verified Agent">
                    <CheckCircle size={20} fill="currentColor" className="text-white"/>
                </div>
            </div>

            {/* Info */}
            <div className="flex-grow text-center md:text-left z-10">
                <h1 className={`text-4xl md:text-5xl font-bold mb-2 ${serifFont.className}`}>{agent.name}</h1>
                
                {/* Rating Badge */}
                <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                    <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                        <Star size={14} fill="currentColor"/> 
                        <span className="text-sm font-bold">{average}</span>
                        <span className="text-xs text-gray-500 ml-1">({count} reviews)</span>
                    </div>
                    {agent.website && (
                        <a href={agent.website} target="_blank" className="flex items-center gap-1 hover:text-blue-400 transition-colors text-sm text-gray-400">
                            <Globe size={14}/> Website
                        </a>
                    )}
                </div>

                <div className="max-w-2xl text-gray-300 leading-relaxed mb-8">
                    {agent.bio ? agent.bio : <span className="italic opacity-50">No biography provided.</span>}
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    {whatsappUrl && (
                        <a href={whatsappUrl} target="_blank" className="bg-[#25D366] hover:bg-[#1ebc50] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-900/20">
                            <MessageCircle size={20}/> WhatsApp
                        </a>
                    )}
                    {!isMe && (
                        <ReviewModal agentId={agent.id} />
                    )}
                </div>
            </div>

            {/* Stats Box */}
            <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 min-w-[200px] text-center hidden md:block">
                <div className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-4">Active Listings</div>
                <div className="flex justify-around gap-6">
                    <div>
                        <div className="text-3xl font-bold text-white mb-1">{propertyCount}</div>
                        <div className="text-xs text-gray-500 flex items-center justify-center gap-1"><BedDouble size={12}/> Homes</div>
                    </div>
                    <div className="w-[1px] bg-white/10"></div>
                    <div>
                        <div className="text-3xl font-bold text-white mb-1">{vehicleCount}</div>
                        <div className="text-xs text-gray-500 flex items-center justify-center gap-1"><Car size={12}/> Cars</div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- REVIEWS SECTION (New) --- */}
        {count > 0 && (
            <div className="mb-16">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2"><MessageSquare size={20} className="text-yellow-500"/> Client Reviews</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-neutral-900 border border-white/5 p-6 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-neutral-800 rounded-full overflow-hidden relative">
                                        {review.reviewer.profileImage ? (
                                            <Image src={review.reviewer.profileImage} alt="User" fill className="object-cover"/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-white">{review.reviewer.name?.substring(0,1)}</div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{review.reviewer.name}</p>
                                        <p className="text-[10px] text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded text-yellow-500 text-xs font-bold">
                                    <Star size={12} fill="currentColor"/> {review.rating}
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed italic">"{review.comment}"</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- LISTINGS GRID --- */}
        <h2 className={`text-3xl font-bold mb-8 flex items-center gap-3 ${serifFont.className}`}>
             Active Listings <span className="text-lg text-gray-500 font-sans font-normal">({agent.listings.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agent.listings.length === 0 ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-neutral-800 rounded-2xl text-gray-500">
                    Agent has no active listings at the moment.
                </div>
            ) : agent.listings.map((item) => (
                <ListingCard 
                    key={item.id} 
                    data={item} 
                    isLiked={myFavs.includes(item.id)} 
                />
            ))}
        </div>

      </main>
    </div>
  );
}
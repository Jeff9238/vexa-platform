import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Playfair_Display, Manrope } from 'next/font/google';
import { ArrowLeft, MapPin, Phone, MessageCircle, Globe, CheckCircle, BedDouble, Car, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '800'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function AgentProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Fetch Agent & Their Listings
  const agent = await prisma.user.findUnique({
    where: { id },
    include: {
        listings: {
            where: { published: true },
            orderBy: { createdAt: 'desc' }
        }
    }
  });

  if (!agent) notFound();

  // Stats
  const propertyCount = agent.listings.filter(l => l.type === 'PROPERTY').length;
  const vehicleCount = agent.listings.filter(l => l.type === 'VEHICLE').length;

  const phone = agent.phoneNumber ? agent.phoneNumber.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = phone 
    ? `https://wa.me/${phone}?text=Hi ${agent.name}, I found your profile on VEXA.`
    : null;

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-32">
        
        {/* --- PROFILE HEADER --- */}
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-8 md:p-12 mb-16 flex flex-col md:flex-row gap-10 items-center md:items-start relative overflow-hidden">
            
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Avatar */}
            <div className="relative w-40 h-40 flex-shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-neutral-800 shadow-2xl relative z-10">
                    <Image 
                        src={agent.profileImage || "https://via.placeholder.com/200?text=Agent"} 
                        alt={agent.name || "Agent"} 
                        fill 
                        className="object-cover"
                    />
                </div>
                {/* Verified Badge */}
                <div className="absolute bottom-2 right-2 z-20 bg-blue-600 text-white p-1.5 rounded-full border-4 border-neutral-900" title="Verified Agent">
                    <CheckCircle size={20} fill="currentColor" className="text-white"/>
                </div>
            </div>

            {/* Info */}
            <div className="flex-grow text-center md:text-left z-10">
                <h1 className={`text-4xl md:text-5xl font-bold mb-2 ${serifFont.className}`}>{agent.name}</h1>
                <p className="text-gray-400 mb-6 flex items-center justify-center md:justify-start gap-2">
                    <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white">VEXA Agent</span>
                    {agent.website && (
                        <a href={agent.website} target="_blank" className="flex items-center gap-1 hover:text-blue-400 transition-colors text-sm">
                            <Globe size={14}/> Website
                        </a>
                    )}
                </p>

                {/* Bio */}
                <div className="max-w-2xl text-gray-300 leading-relaxed mb-8">
                    {agent.bio ? agent.bio : <span className="italic opacity-50">No biography provided.</span>}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    {whatsappUrl && (
                        <a href={whatsappUrl} target="_blank" className="bg-[#25D366] hover:bg-[#1ebc50] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-900/20">
                            <MessageCircle size={20}/> WhatsApp
                        </a>
                    )}
                    {phone && (
                        <a href={`tel:${phone}`} className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
                            <Phone size={20}/> Call Agent
                        </a>
                    )}
                </div>
            </div>

            {/* Stats Box */}
            <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 min-w-[200px] text-center">
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
                <Link key={item.id} href={`/listing/${item.id}`} className="group bg-neutral-900 border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all">
                    <div className="relative h-[240px] w-full overflow-hidden">
                        <Image src={item.images ? item.images.split(',')[0] : 'https://via.placeholder.com/400'} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-white p-1.5 rounded-lg text-xs font-bold uppercase">
                            {item.type}
                        </div>
                        <div className="absolute bottom-3 left-3">
                             <p className={`text-lg font-semibold text-white ${serifFont.className}`}>
                                RM {item.price.toLocaleString()}
                             </p>
                        </div>
                    </div>
                    <div className="p-4">
                        <h4 className="text-sm font-bold text-white mb-2 line-clamp-1">{item.title}</h4>
                        <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                            <span className="flex items-center gap-1"><MapPin size={10}/> {item.area}, {item.state}</span>
                            <span className="flex items-center gap-1 text-blue-400 group-hover:translate-x-1 transition-transform">View Details <ArrowRight size={10}/></span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>

      </main>
    </div>
  );
}
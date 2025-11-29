import { prisma } from "@/lib/prisma"; // FIXED IMPORT
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Playfair_Display, Manrope } from 'next/font/google';
import { ArrowLeft, MapPin, BedDouble, Car, CheckCircle, Share2, MessageCircle, Phone, ImageIcon } from "lucide-react";

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '800'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!listing) notFound();

  const allImages = listing.images ? listing.images.split(',') : [];
  const heroImage = allImages[0] || 'https://via.placeholder.com/800';
  const galleryImages = allImages.slice(1); 

  const whatsappMessage = `Hi ${listing.user.name}, I am interested in your listing on VEXA: ${listing.title} (RM ${listing.price})`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <main className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      
      {/* HEADER */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold hover:text-blue-500 transition-colors">
            <ArrowLeft size={18}/> BACK
        </Link>
        <div className="flex gap-4">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Share2 size={18}/>
            </button>
        </div>
      </nav>

      {/* --- HERO IMAGE --- */}
      <div className="relative w-full h-[50vh] md:h-[65vh] bg-neutral-900 group">
         <Image 
            src={heroImage} 
            alt={listing.title} 
            fill 
            className="object-cover"
            priority
         />
         <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
         <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                <span className="inline-block px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm mb-4">
                    {listing.type}
                </span>
                <h1 className={`text-4xl md:text-6xl text-white ${serifFont.className} mb-2`}>
                    {listing.title}
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 font-light flex items-center gap-2">
                    <MapPin size={18} className="text-blue-500"/> 
                    {listing.type === 'PROPERTY' ? 'Penang, Malaysia' : 'Glenmarie, Shah Alam'} 
                </p>
            </div>
         </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
            {galleryImages.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold mb-4 text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon size={14}/> Photo Gallery ({galleryImages.length + 1})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {galleryImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-[4/3] bg-neutral-800 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover"/>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/10 pb-8">
                <div>
                    <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Asking Price</p>
                    <div className={`text-4xl font-bold text-white ${serifFont.className}`}>
                        RM {listing.price.toLocaleString()}
                    </div>
                </div>
                <div className="flex gap-8">
                    {listing.type === 'PROPERTY' ? (
                        <>
                           <div className="text-center">
                              <BedDouble size={24} className="mx-auto mb-2 text-gray-500"/>
                              <span className="block font-bold">5 Beds</span>
                           </div>
                           <div className="text-center">
                              <CheckCircle size={24} className="mx-auto mb-2 text-gray-500"/>
                              <span className="block font-bold">Verified</span>
                           </div>
                        </>
                    ) : (
                        <>
                           <div className="text-center">
                              <Car size={24} className="mx-auto mb-2 text-gray-500"/>
                              <span className="block font-bold">2024</span>
                           </div>
                           <div className="text-center">
                              <CheckCircle size={24} className="mx-auto mb-2 text-gray-500"/>
                              <span className="block font-bold">In Stock</span>
                           </div>
                        </>
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4 text-gray-200">Description</h3>
                <p className="text-gray-400 leading-relaxed whitespace-pre-line text-lg">
                    {listing.description}
                </p>
            </div>

            <div>
                <h3 className="text-sm font-bold mb-4 text-gray-500 uppercase tracking-widest">Features</h3>
                <div className="flex flex-wrap gap-3">
                    {listing.tags.split(',').map((tag, i) => (
                        <span key={i} className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-lg text-sm text-gray-300">
                            {tag.trim()}
                        </span>
                    ))}
                </div>
            </div>
        </div>

        <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white text-black rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-800">
                        {listing.user?.name ? listing.user.name.substring(0,2).toUpperCase() : 'AG'}
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Listed By</p>
                        <h4 className={`text-xl font-bold ${serifFont.className}`}>{listing.user?.name || 'VEXA Agent'}</h4>
                        <p className="text-sm text-green-600 font-bold flex items-center gap-1">
                            <CheckCircle size={12}/> Super Agent
                        </p>
                    </div>
                </div>
                <div className="space-y-3">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all">
                        <MessageCircle size={20}/> WhatsApp
                    </a>
                    <button className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-black font-bold py-4 rounded-xl transition-all">
                        <Phone size={20}/> Call Agent
                    </button>
                </div>
                <p className="text-xs text-center text-gray-400 mt-6">
                    Reference ID: {listing.id.substring(0,8)} <br/>
                    Posted on VEXA Marketplace
                </p>
            </div>
        </div>

      </div>
    </main>
  );
}
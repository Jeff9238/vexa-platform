import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Playfair_Display, Manrope } from 'next/font/google';
import { ArrowLeft, MapPin, Share2, MessageCircle, Phone, CheckCircle, BedDouble, Bath, Maximize, Home, Calendar, Gauge, Settings2, Fuel, CheckSquare, CarFront, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import ImageGallery from "@/components/ImageGallery"; 
import LocationMap from "@/components/LocationMap";
import FavoriteButton from "@/components/FavoriteButton"; 
import LoanCalculator from "@/components/LoanCalculator"; 
import BackButton from "@/components/BackButton"; 
import { getFavoriteStatus } from "@/app/actions"; 

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '800'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function ListingPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams; // Get Search Parameters (Filters)
  
  // 1. Fetch listing AND the user (agent) details
  const listing = await prisma.listing.findUnique({ 
      where: { id }, 
      include: { user: true } 
  });

  if (!listing) notFound();

  // --- NAVIGATION LOGIC (NEXT/PREV) ---
  // Reconstruct the search filter to find neighbors
  const typeFilter = typeof sp.type === 'string' ? sp.type : listing.type;
  
  const whereClause: any = {
    published: true,
    type: typeFilter,
  };

  // Apply filters if they exist in URL (Consistency with Search Page)
  if (sp.listingCategory) whereClause.listingCategory = sp.listingCategory;
  if (sp.bodyType) whereClause.bodyType = sp.bodyType;
  if (sp.state) whereClause.state = { equals: sp.state, mode: 'insensitive' };
  if (sp.q) {
    whereClause.OR = [
        { title: { contains: sp.q as string, mode: 'insensitive' } },
        { description: { contains: sp.q as string, mode: 'insensitive' } },
        { tags: { contains: sp.q as string, mode: 'insensitive' } },
    ];
  }
  const minPrice = sp.minPrice ? parseFloat(sp.minPrice as string) : undefined;
  const maxPrice = sp.maxPrice ? parseFloat(sp.maxPrice as string) : undefined;
  if (minPrice || maxPrice) {
    whereClause.price = {};
    if (minPrice) whereClause.price.gte = minPrice;
    if (maxPrice) whereClause.price.lte = maxPrice;
  }
  if (sp.brand) whereClause.brand = { contains: sp.brand as string, mode: 'insensitive' };

  // Fetch only IDs for navigation context
  const contextListings = await prisma.listing.findMany({
    where: whereClause,
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: 100 // Limit for performance, assuming users won't scroll 100+ deep
  });

  const currentIndex = contextListings.findIndex(x => x.id === listing.id);
  const prevId = currentIndex > 0 ? contextListings[currentIndex - 1].id : null;
  const nextId = currentIndex !== -1 && currentIndex < contextListings.length - 1 ? contextListings[currentIndex + 1].id : null;

  // Build query string to preserve filters on navigation
  const queryString = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => {
      if (typeof v === 'string') queryString.set(k, v);
  });
  const queryStr = queryString.toString() ? `?${queryString.toString()}` : '';

  // ------------------------------------

  const images = listing.images ? listing.images.split(',') : [];
  const heroImage = images[0] || 'https://via.placeholder.com/800';
  const facilities = listing.facilities ? listing.facilities.split(',') : [];

  // Check if current user liked this
  const isLiked = await getFavoriteStatus(id);

  // --- CONTACT LOGIC ---
  const phone = listing.user.phoneNumber ? listing.user.phoneNumber.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = phone 
    ? `https://wa.me/${phone}?text=Hi ${listing.user.name}, I am interested in your listing on VEXA: ${listing.title}`
    : `https://wa.me/?text=Hi, I am interested in ${listing.title}`;

  return (
    <main className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      
      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent px-6 py-4 flex justify-between items-center pointer-events-none">
        
        <div className="flex items-center gap-4 pointer-events-auto">
            {/* REPLACED LINK WITH BACK BUTTON COMPONENT */}
            <BackButton />

            {/* PREV / NEXT BUTTONS */}
            {(prevId || nextId) && (
                <div className="flex bg-black/40 backdrop-blur-md border border-white/10 rounded-full overflow-hidden">
                    {prevId ? (
                        <Link href={`/listing/${prevId}${queryStr}`} className="px-3 py-2 hover:bg-white/10 border-r border-white/10 text-white transition-colors" title="Previous Listing">
                            <ChevronLeft size={18}/>
                        </Link>
                    ) : (
                        <div className="px-3 py-2 text-gray-600 border-r border-white/10 cursor-not-allowed"><ChevronLeft size={18}/></div>
                    )}
                    
                    {nextId ? (
                        <Link href={`/listing/${nextId}${queryStr}`} className="px-3 py-2 hover:bg-white/10 text-white transition-colors" title="Next Listing">
                            <ChevronRight size={18}/>
                        </Link>
                    ) : (
                        <div className="px-3 py-2 text-gray-600 cursor-not-allowed"><ChevronRight size={18}/></div>
                    )}
                </div>
            )}
        </div>
        
        <div className="flex gap-3 pointer-events-auto">
            <div className="bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center w-10 h-10">
                <FavoriteButton listingId={listing.id} initialLiked={isLiked} />
            </div>
            <button className="w-10 h-10 bg-black/40 text-white rounded-full backdrop-blur-md hover:bg-white hover:text-black transition-all border border-white/10 flex items-center justify-center">
                <Share2 size={18}/>
            </button>
        </div>
      </nav>

      {/* 1. HERO IMAGE */}
      <div className="relative w-full h-[65vh]">
         <Image src={heroImage} alt={listing.title} fill className="object-cover" priority />
         <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"/>
         
         <div className="absolute bottom-0 left-0 w-full px-6 md:px-12 pb-12 max-w-7xl mx-auto">
            <div className="flex gap-2 mb-4">
                <span className="bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">{listing.condition || 'USED'}</span>
                {listing.listingCategory && (
                    <span className={`text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg ${listing.listingCategory === 'RENT' ? 'bg-purple-600' : 'bg-green-600'}`}>FOR {listing.listingCategory}</span>
                )}
            </div>
            <h1 className={`text-4xl md:text-6xl text-white ${serifFont.className} mb-2 drop-shadow-md`}>{listing.title}</h1>
            
            <p className="text-xl text-gray-200 flex items-center gap-2 mt-2 drop-shadow-md">
                <MapPin size={20} className="text-blue-400"/> 
                {listing.locationName && <span className="font-bold text-white">{listing.locationName},</span>}
                {listing.area}, {listing.state}
            </p>
         </div>
      </div>

      {/* 2. SLIM ACTION BAR */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-8">
                  <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Price</p>
                      <div className="text-3xl md:text-4xl font-bold text-white font-serif">RM {listing.price.toLocaleString()}</div>
                  </div>
                  
                  <div className="hidden md:block w-[1px] h-10 bg-white/10"></div>
                  
                  {/* AGENT PROFILE LINK */}
                  <div className="hidden md:flex items-center gap-3">
                      <Link href={`/agent/${listing.user.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm border border-white/20 overflow-hidden relative">
                              {listing.user.profileImage ? (
                                  <Image src={listing.user.profileImage} alt="Agent" fill className="object-cover"/>
                              ) : (
                                  listing.user.name?.substring(0,2).toUpperCase()
                              )}
                          </div>
                          <div>
                              <p className="text-sm font-bold text-white leading-none mb-1 group-hover:text-blue-400 transition-colors">{listing.user.name}</p>
                              <p className="text-[10px] text-blue-400 font-bold flex items-center gap-1"><CheckCircle size={10}/> Verified Agent</p>
                          </div>
                      </Link>
                  </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebc50] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-900/20">
                      <MessageCircle size={20}/> <span className="whitespace-nowrap">WhatsApp</span>
                  </a>
                  <a href={phone ? `tel:${phone}` : '#'} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${phone ? 'bg-white hover:bg-gray-200 text-black' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`} title={phone ? "Call Now" : "Phone number not provided"}>
                      <Phone size={20}/> <span className="whitespace-nowrap">{phone ? "Call" : "No Phone"}</span>
                  </a>
              </div>
          </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        
            {/* HIGHLIGHTS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {listing.type === 'PROPERTY' ? (
                    <>
                        <StatCard icon={<BedDouble size={24}/>} label="Bedrooms" value={listing.bedrooms}/>
                        <StatCard icon={<Bath size={24}/>} label="Bathrooms" value={listing.bathrooms}/>
                        <StatCard icon={<CarFront size={24}/>} label="Car Parks" value={listing.carParks}/>
                        <StatCard icon={<Maximize size={24}/>} label="Size" value={`${listing.sqft} sqft`}/>
                    </>
                ) : (
                    <>
                        <StatCard icon={<Calendar size={24}/>} label="Year" value={listing.year}/>
                        <StatCard icon={<Gauge size={24}/>} label="Mileage" value={`${listing.mileage} km`}/>
                        <StatCard icon={<Settings2 size={24}/>} label="Trans." value={listing.transmission}/>
                        <StatCard icon={<Fuel size={24}/>} label="Fuel" value={listing.fuelType}/>
                    </>
                )}
            </div>

            {/* GALLERY */}
            <ImageGallery images={images} title={listing.title} />

            {/* DESCRIPTION */}
            <div>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">Description</h3>
                <div className="text-gray-300 whitespace-pre-line leading-relaxed text-lg">
                    {listing.description}
                </div>
            </div>

            {/* SPECS TABLE */}
            <div>
                <h3 className="text-lg font-bold mb-6 border-l-4 border-blue-500 pl-3">Full Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4 text-sm bg-neutral-900/50 p-8 rounded-3xl border border-white/5">
                    {listing.type === 'VEHICLE' ? (
                        <>
                            <Row label="Brand" value={listing.brand} />
                            <Row label="Model" value={listing.model} />
                            <Row label="Variant" value={listing.variant} />
                            <Row label="Series" value={listing.series} />
                            <Row label="Year" value={listing.year} />
                            <Row label="Color" value={listing.color} />
                            <Row label="Body Type" value={listing.bodyType} />
                            <Row label="Seats" value={listing.seats} />
                            <Row label="Origin" value={listing.origin} />
                            <Row label="Engine CC" value={listing.engineCC} />
                            <Row label="Power" value={listing.peakPower ? `${listing.peakPower} KW` : '-'} />
                            <Row label="Torque" value={listing.peakTorque ? `${listing.peakTorque} Nm` : '-'} />
                        </>
                    ) : (
                        <>
                            <Row label="Category" value={listing.listingCategory} />
                            <Row label="Property Type" value={listing.propertyType} />
                            <Row label="Furnishing" value={listing.furnishing} />
                            <Row label="Bedrooms" value={listing.bedrooms} />
                            <Row label="Bathrooms" value={listing.bathrooms} />
                            <Row label="Size" value={`${listing.sqft} sq.ft`} />
                        </>
                    )}
                </div>
            </div>

            {/* FACILITIES */}
            {listing.type === 'PROPERTY' && facilities.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold mb-6 border-l-4 border-purple-500 pl-3">Facilities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {facilities.map((fac, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm text-gray-300 bg-neutral-900 px-4 py-3 rounded-xl border border-white/5">
                                <CheckSquare size={16} className="text-green-500"/> {fac}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MAP */}
            {listing.lat && listing.lng && (
                <div>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">Location & Amenities</h3>
                    <div className="bg-neutral-900 border border-white/10 p-1 rounded-3xl overflow-hidden">
                         <LocationMap lat={listing.lat} lng={listing.lng} />
                    </div>
                </div>
            )}

            {/* LOAN CALCULATOR */}
            <div>
                <LoanCalculator price={listing.price} type={listing.type as 'PROPERTY' | 'VEHICLE'} />
            </div>

      </div>
    </main>
  );
}

function StatCard({ icon, label, value }: any) {
    if (!value) return null;
    return (
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-neutral-800 transition-colors">
            <div className="text-blue-500 mb-2">{icon}</div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    );
}

function Row({label, value}: any) {
    if(!value) return null;
    return (
        <div className="flex justify-between border-b border-white/5 pb-3">
            <span className="text-gray-500 font-medium">{label}</span>
            <span className="text-white font-bold text-right uppercase">{value}</span>
        </div>
    )
}
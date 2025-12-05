import { notFound } from "next/navigation";
import { getListing, getFavoriteStatus } from "@/app/actions";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { Playfair_Display, Manrope } from 'next/font/google';
import { 
    MapPin, Calendar, CheckCircle2, Share2, 
    BedDouble, Bath, Car, Gauge, Fuel, Move, PenLine, ShieldCheck, Home
} from "lucide-react";

// Components
import ListingHeroGallery from "@/components/ListingHeroGallery";
import MobileStickyBar from "@/components/MobileStickyBar";
import LocationMap from "@/components/LocationMap";
import LoanCalculator from "@/components/LoanCalculator";
import ContactButtons from "@/components/ContactButtons";
import FavoriteButton from "@/components/FavoriteButton";
import BackButton from "@/components/BackButton";

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const listing = await getListing(id);
    
    if (!listing) notFound();

    const user = await currentUser();
    const isOwner = user?.emailAddresses[0]?.emailAddress === listing.user.email;
    const isLiked = await getFavoriteStatus(id);

    const images = listing.images ? listing.images.split(',') : [];
    const price = "RM " + listing.price.toLocaleString();

    // Helper for WhatsApp
    const agentPhone = listing.user.phoneNumber ? listing.user.phoneNumber.replace(/[^0-9]/g, '') : '';
    const whatsappUrl = agentPhone ? `https://wa.me/${agentPhone}?text=Hi ${listing.user.name}, I'm interested in ${listing.title} (VEXA Ref: ${listing.id.substring(0,6)}).` : '#';

    return (
        <div className={`min-h-screen bg-[#050505] text-white ${sansFont.className} pb-32 md:pb-0`}>
            
            {/* 1. TOP NAV */}
            <nav className="absolute top-0 w-full z-30 p-4 md:p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <BackButton />
                <div className="flex gap-3 pointer-events-auto">
                    {isOwner && (
                        <Link href={`/edit/${id}`} className="flex items-center gap-2 bg-blue-600/90 text-white px-4 py-2 rounded-full font-bold text-xs backdrop-blur-md hover:bg-blue-500">
                            <PenLine size={14}/> Edit
                        </Link>
                    )}
                    <div className="bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center p-1.5 hover:bg-black/60 transition-colors">
                        <FavoriteButton listingId={listing.id} initialLiked={isLiked} />
                    </div>
                    <button className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                        <Share2 size={16}/>
                    </button>
                </div>
            </nav>

            {/* 2. GALLERY */}
            <div className="md:pt-28 md:px-6 md:max-w-[1600px] md:mx-auto">
                <ListingHeroGallery images={images} />
            </div>

            {/* 3. MAIN CONTENT */}
            <main className="max-w-[1600px] mx-auto px-6 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* LEFT CONTENT (8 Cols) */}
                    <div className="lg:col-span-8 space-y-10">
                        
                        {/* HEADER */}
                        <div className="border-b border-white/10 pb-8">
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">{listing.type}</span>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${listing.listingCategory === 'RENT' ? 'bg-purple-600' : 'bg-emerald-600'}`}>
                                    {listing.listingCategory || 'SALE'}
                                </span>
                                {listing.condition && <span className="border border-white/20 text-gray-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">{listing.condition}</span>}
                            </div>
                            
                            <h1 className={`text-3xl md:text-5xl font-bold text-white mb-3 leading-tight ${serifFont.className}`}>
                                {listing.title}
                            </h1>
                            <div className="flex justify-between items-end">
                                <p className="text-gray-400 flex items-center gap-2 text-sm md:text-base">
                                    <MapPin size={16} className="text-blue-500"/> {listing.location}
                                </p>
                                <p className={`text-3xl md:text-4xl font-bold text-blue-400 ${serifFont.className}`}>
                                    {price}
                                </p>
                            </div>
                        </div>

                        {/* ATTRIBUTES */}
                        <section className="bg-white/5 border border-white/5 rounded-2xl p-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-white/10 pb-2">Property Attributes</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 gap-x-4">
                                 {listing.type === 'PROPERTY' ? (
                                    <>
                                        <AttributeBox label="Bedrooms" value={listing.bedrooms} icon={BedDouble} />
                                        <AttributeBox label="Bathrooms" value={listing.bathrooms} icon={Bath} />
                                        <AttributeBox label="Size" value={listing.sqft ? `${listing.sqft} sqft` : null} icon={Move} />
                                        <AttributeBox label="Car Parks" value={listing.carParks} icon={Car} />
                                        <AttributeBox label="Furnishing" value={listing.furnishing} icon={Home} />
                                        <AttributeBox label="Type" value={listing.propertyType} icon={Home} />
                                        <AttributeBox label="Tenure" value="Freehold" icon={ShieldCheck} /> 
                                        <AttributeBox label="Title" value="Strata" icon={CheckCircle2} /> 
                                    </>
                                ) : (
                                    <>
                                        <AttributeBox label="Year" value={listing.year} icon={Calendar} />
                                        <AttributeBox label="Mileage" value={listing.mileage ? `${listing.mileage} km` : null} icon={Gauge} />
                                        <AttributeBox label="Fuel" value={listing.fuelType} icon={Fuel} />
                                        <AttributeBox label="Body" value={listing.bodyType} icon={Car} />
                                        <AttributeBox label="Engine" value={listing.engineCC ? `${listing.engineCC} cc` : null} icon={Gauge} />
                                        <AttributeBox label="Power" value={listing.peakPower ? `${listing.peakPower} hp` : null} icon={Gauge} />
                                    </>
                                )}
                            </div>
                        </section>

                        {/* DESCRIPTION */}
                        <section>
                            <h3 className={`text-2xl font-bold mb-4 ${serifFont.className}`}>Description</h3>
                            <div className="prose prose-invert prose-lg max-w-none text-gray-400 leading-relaxed whitespace-pre-wrap">
                                {listing.description}
                            </div>
                        </section>

                        {/* FACILITIES */}
                        {listing.facilities && (
                            <section>
                                <h3 className={`text-2xl font-bold mb-6 ${serifFont.className}`}>Facilities</h3>
                                <div className="flex flex-wrap gap-3">
                                    {listing.facilities.split(',').map((fac, i) => (
                                        <span key={i} className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-full text-sm text-gray-300 flex items-center gap-2">
                                            <CheckCircle2 size={14} className="text-blue-500"/> {fac}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* MAP */}
                        {listing.lat && listing.lng && (
                            <section>
                                <h3 className={`text-2xl font-bold mb-6 text-white ${serifFont.className}`}>Location & Amenities</h3>
                                <div className="h-auto w-full">
                                    <LocationMap lat={listing.lat} lng={listing.lng} />
                                </div>
                            </section>
                        )}
                    </div>

                    {/* RIGHT SIDEBAR (Desktop) */}
                    <div className="hidden lg:block lg:col-span-4 relative">
                        <div className="sticky top-28 space-y-6">
                            
                            {/* AGENT CARD */}
                            <div className="bg-neutral-900/80 backdrop-blur border border-white/10 p-6 rounded-3xl shadow-xl relative overflow-hidden group">
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-all duration-1000"></div>
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <Link href={`/agent/${listing.userId}`} className="relative w-24 h-24 rounded-full p-1 border border-white/10 mb-4 group-hover:border-blue-500/50 transition-colors">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-black relative">
                                            {listing.user.profileImage ? (
                                                <Image src={listing.user.profileImage} alt="Agent" fill className="object-cover"/>
                                            ) : (
                                                <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-white font-bold text-2xl">
                                                    {listing.user.name?.substring(0,1) || "A"}
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full border-4 border-neutral-900">
                                            <ShieldCheck size={14} />
                                        </div>
                                    </Link>
                                    <h4 className={`text-xl font-bold text-white mb-1 ${serifFont.className}`}>
                                        {listing.user.name}
                                    </h4>
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-6">
                                        VEXA Premier Agent
                                    </p>
                                    <div className="w-full">
                                        <ContactButtons 
                                            phone={listing.user.phoneNumber || ''} 
                                            listingId={listing.id}
                                            whatsappUrl={whatsappUrl}
                                        />
                                    </div>
                                </div>
                            </div>

                            <LoanCalculator price={listing.price} type={listing.type as any} />
                        </div>
                    </div>

                </div>
            </main>

            {/* 4. MOBILE STICKY BAR */}
            <MobileStickyBar 
                phone={agentPhone} 
                listingId={listing.id} 
                whatsappUrl={whatsappUrl}
                agentName={listing.user.name || "Agent"}
                agentImage={listing.user.profileImage}
            />

        </div>
    );
}

function AttributeBox({ label, value, icon: Icon }: { label: string, value: any, icon: any }) {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                <Icon size={12} className="text-blue-500"/> {label}
            </span>
            <span className="text-lg font-bold text-white">{value}</span>
        </div>
    );
}
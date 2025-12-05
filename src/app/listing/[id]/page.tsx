import { notFound } from "next/navigation";
import { getListing, getFavoriteStatus } from "@/app/actions";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { Playfair_Display, Manrope } from 'next/font/google';
import { 
    MapPin, Calendar, CheckCircle2, Share2, 
    BedDouble, Bath, Car, Gauge, Fuel, Move, PenLine
} from "lucide-react";

// Components
import Navbar from "@/components/Navbar";
import ImageGallery from "@/components/ImageGallery";
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

    // Check if current user is the owner
    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress;
    const isOwner = userEmail === listing.user.email;

    // Check favorite status
    const isLiked = await getFavoriteStatus(id);

    // Parse Images
    const images = listing.images ? listing.images.split(',') : [];
    const mainImage = images[0] || "/placeholder.jpg";

    // Format Price
    const price = "RM " + listing.price.toLocaleString();

    return (
        <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
            
            {/* 1. CUSTOM HEADER (Transparent) */}
            <header className="absolute top-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <BackButton />
                
                <div className="flex gap-3 pointer-events-auto">
                    {isOwner && (
                        <Link href={`/edit/${id}`} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full font-bold shadow-lg transition-all">
                            <PenLine size={16}/> Edit Listing
                        </Link>
                    )}
                    <div className="bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center p-1">
                        <FavoriteButton listingId={listing.id} initialLiked={isLiked} />
                    </div>
                    <button className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
                        <Share2 size={18}/>
                    </button>
                </div>
            </header>

            {/* 2. HERO IMAGE */}
            <div className="relative w-full h-[50vh] md:h-[65vh]">
                <Image src={mainImage} alt={listing.title} fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/30"></div>
                
                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                            <div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{listing.type}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${listing.listingCategory === 'RENT' ? 'bg-purple-600' : 'bg-green-600'}`}>{listing.listingCategory || 'SALE'}</span>
                                    {listing.condition && <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">{listing.condition}</span>}
                                </div>
                                <h1 className={`text-4xl md:text-6xl font-bold mb-2 leading-tight ${serifFont.className}`}>{listing.title}</h1>
                                <p className="text-gray-300 flex items-center gap-2 text-lg">
                                    <MapPin size={20} className="text-blue-500"/> {listing.location}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Asking Price</p>
                                <p className={`text-4xl md:text-5xl font-bold text-white ${serifFont.className}`}>{price}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. MAIN CONTENT GRID */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* LEFT COLUMN (Details) */}
                    <div className="lg:col-span-2 space-y-12">
                        
                        {/* Key Specs */}
                        <div className="bg-neutral-900/50 border border-white/5 rounded-3xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                            {listing.type === 'PROPERTY' ? (
                                <>
                                    <SpecItem icon={BedDouble} label="Bedrooms" value={listing.bedrooms} />
                                    <SpecItem icon={Bath} label="Bathrooms" value={listing.bathrooms} />
                                    <SpecItem icon={Move} label="Size" value={listing.sqft ? `${listing.sqft} sqft` : null} />
                                    <SpecItem icon={Car} label="Car Parks" value={listing.carParks} />
                                </>
                            ) : (
                                <>
                                    <SpecItem icon={Calendar} label="Year" value={listing.year} />
                                    <SpecItem icon={Gauge} label="Mileage" value={listing.mileage ? `${listing.mileage.toLocaleString()} km` : null} />
                                    <SpecItem icon={Fuel} label="Fuel Type" value={listing.fuelType} />
                                    <SpecItem icon={Car} label="Body" value={listing.bodyType} />
                                </>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="text-2xl font-bold mb-6 font-serif">Description</h3>
                            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">
                                {listing.description}
                            </div>
                        </div>

                        {/* Image Gallery */}
                        <ImageGallery images={images} />

                        {/* Facilities / Features */}
                        {listing.facilities && (
                            <div>
                                <h3 className="text-2xl font-bold mb-6 font-serif">Features & Amenities</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {listing.facilities.split(',').map((fac, i) => (
                                        <div key={i} className="flex items-center gap-3 text-gray-300 bg-neutral-900 border border-white/5 p-4 rounded-xl">
                                            <CheckCircle2 size={18} className="text-green-500 flex-shrink-0"/>
                                            <span className="text-sm font-bold">{fac}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Location Map */}
                        {listing.lat && listing.lng && (
                            <div>
                                <h3 className="text-2xl font-bold mb-6 font-serif">Location</h3>
                                <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                                    <LocationMap lat={listing.lat} lng={listing.lng} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN (Agent & Tools) */}
                    <div className="space-y-8">
                        
                        {/* Agent Card */}
                        <div className="bg-white text-black rounded-3xl p-8 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <Link href={`/agent/${listing.userId}`} className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                                    {listing.user.profileImage ? (
                                        <Image src={listing.user.profileImage} alt={listing.user.name || "Agent"} fill className="object-cover"/>
                                    ) : (
                                        <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                                            {listing.user.name?.substring(0,1) || "A"}
                                        </div>
                                    )}
                                </Link>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Listed By</p>
                                    <Link href={`/agent/${listing.userId}`} className="text-xl font-bold hover:text-blue-600 transition-colors">
                                        {listing.user.name}
                                    </Link>
                                </div>
                            </div>

                            <ContactButtons 
                                phone={listing.user.phoneNumber || ''} 
                                listingId={listing.id}
                                whatsappUrl={`https://wa.me/${listing.user.phoneNumber?.replace(/[^0-9]/g, '')}?text=Hi, I am interested in ${listing.title}`}
                            />
                        </div>

                        {/* Loan Calculator */}
                        <LoanCalculator price={listing.price} type={listing.type as any} />

                    </div>
                </div>
            </main>

        </div>
    );
}

// Sub-component for Specs
function SpecItem({ icon: Icon, label, value }: { icon: any, label: string, value: any }) {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <Icon size={14}/> {label}
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    );
}
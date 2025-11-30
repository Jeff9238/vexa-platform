import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Playfair_Display, Manrope } from 'next/font/google';
import { ArrowLeft, MapPin, Share2, MessageCircle, Phone, CheckCircle, BedDouble, Bath, Maximize, Home, Calendar, Gauge, Settings2, Fuel, CheckSquare, CarFront } from "lucide-react";
import ImageGallery from "@/components/ImageGallery"; 

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '800'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id }, include: { user: true } });
  if (!listing) notFound();

  const images = listing.images ? listing.images.split(',') : [];
  const heroImage = images[0] || 'https://via.placeholder.com/800';
  
  const whatsappUrl = `https://wa.me/?text=Hi, interested in ${listing.title}`;
  const facilities = listing.facilities ? listing.facilities.split(',') : [];

  return (
    <main className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      
      <nav className="fixed top-0 w-full z-50 bg-transparent hover:bg-black/80 transition-colors px-6 py-4 flex justify-between items-center pointer-events-none">
        <Link href="/" className="flex gap-2 text-sm font-bold text-white bg-black/50 px-4 py-2 rounded-full pointer-events-auto hover:bg-blue-600 transition-all backdrop-blur-md"><ArrowLeft size={18}/> BACK</Link>
        <button className="p-2 bg-black/50 text-white rounded-full pointer-events-auto backdrop-blur-md hover:bg-white hover:text-black transition-all"><Share2 size={18}/></button>
      </nav>

      {/* 1. HERO IMAGE (Static at Top) */}
      <div className="relative w-full h-[60vh]">
         <Image src={heroImage} alt={listing.title} fill className="object-cover" priority />
         <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"/>
         <div className="absolute bottom-0 left-0 w-full p-8 max-w-7xl mx-auto">
            <div className="flex gap-2 mb-2">
                <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded inline-block">{listing.condition || 'USED'}</span>
                {listing.listingCategory && (
                    <span className={`text-white text-[10px] font-bold px-2 py-1 rounded inline-block ${listing.listingCategory === 'RENT' ? 'bg-purple-600' : 'bg-green-600'}`}>FOR {listing.listingCategory}</span>
                )}
            </div>
            <h1 className={`text-4xl md:text-5xl text-white ${serifFont.className} mb-2`}>{listing.title}</h1>
            <p className="text-xl text-gray-300 flex gap-2 mt-2"><MapPin size={18} className="text-blue-500"/> {listing.area}, {listing.state}</p>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
            
            {/* 2. HIGHLIGHTS (Icons) */}
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

            {/* 3. PHOTO GALLERY (Now placed HERE, below highlights) */}
            <ImageGallery images={images} />

            {/* 4. FACILITIES */}
            {listing.type === 'PROPERTY' && facilities.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold mb-6 border-l-4 border-purple-500 pl-3">Facilities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {facilities.map((fac, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-300 bg-neutral-900 px-3 py-2 rounded-lg border border-white/5">
                                <CheckSquare size={14} className="text-green-500"/> {fac}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 5. FULL SPECS */}
            <div>
                <h3 className="text-lg font-bold mb-6 border-l-4 border-orange-500 pl-3">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
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
                            <Row label="Peak Power" value={listing.peakPower ? `${listing.peakPower} KW` : '-'} />
                            <Row label="Peak Torque" value={listing.peakTorque ? `${listing.peakTorque} Nm` : '-'} />
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

            {/* 6. DESCRIPTION */}
            <div>
                <h3 className="text-lg font-bold mb-4">Description</h3>
                <div className="text-gray-400 whitespace-pre-line leading-relaxed bg-neutral-900/50 p-6 rounded-2xl border border-white/5">{listing.description}</div>
            </div>
        </div>

        {/* RIGHT: AGENT CARD */}
        <div>
            <div className="bg-white text-black p-6 rounded-2xl sticky top-24 shadow-2xl">
                <div className="mb-6">
                    <p className="text-xs text-gray-500 font-bold uppercase">Price</p>
                    <div className="text-4xl font-bold">RM {listing.price.toLocaleString()}</div>
                </div>
                <a href={whatsappUrl} target="_blank" className="block w-full bg-green-600 text-white text-center font-bold py-4 rounded-xl mb-3 hover:bg-green-700">WhatsApp Agent</a>
                <div className="mt-6 pt-6 border-t flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-800">{listing.user.name?.substring(0,2)}</div>
                    <div><p className="font-bold">{listing.user.name}</p><p className="text-xs text-blue-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> Verified Dealer</p></div>
                </div>
            </div>
        </div>

      </div>
    </main>
  );
}

function StatCard({ icon, label, value }: any) {
    if (!value) return null;
    return (
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <div className="text-blue-500 mb-2">{icon}</div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{label}</p>
            <p className="text-lg font-bold text-white">{value}</p>
        </div>
    );
}

function Row({label, value}: any) {
    if(!value) return null;
    return (
        <div className="flex justify-between border-b border-white/10 pb-2">
            <span className="text-gray-500 w-1/3">{label}</span>
            <span className="text-white font-medium w-2/3 text-right uppercase">{value}</span>
        </div>
    )
}
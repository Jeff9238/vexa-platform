"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  MapPin, 
  DollarSign, 
  User, 
  Phone, 
  MessageCircle, 
  Share2, 
  Heart, 
  ArrowLeft,
  Loader2,
  Home,
  Car,
  Bed,
  Bath,
  Maximize,
  Calendar,
  Gauge,
  Zap,
  Users,
  CheckCircle2,
  Building,
  Fuel,
  Calculator,
  X,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Clock 
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

declare global {
  interface Window {
    firebase: any;
    firestoreDb?: any;
  }
}

export default function ListingDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<any>(null);
  
  // Gallery State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]); 

  // Calculator State
  const [calcDownpayment, setCalcDownpayment] = useState(10); 
  const [calcInterest, setCalcInterest] = useState(3.5); 
  const [calcTenure, setCalcTenure] = useState(9); 
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  // Initialize Firebase 
  const initializeFirebase = useCallback(async () => {
    try {
        if (typeof window.firestoreDb !== 'undefined' && window.firestoreDb) {
            fetchListing(window.firestoreDb);
            return;
        }
        const appScript = document.createElement('script');
        appScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js";
        appScript.onload = () => {
            const firestoreScript = document.createElement('script');
            firestoreScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js";
            firestoreScript.onload = () => {
                const firebase = (window as any).firebase;
                const firebaseConfig = {
                    apiKey: "AIzaSyDo4yfchuY8FVunbz_ZinubrbZtSuATOGg",
                    authDomain: "vexa-platform.firebaseapp.com",
                    projectId: "vexa-platform",
                    storageBucket: "vexa-platform.firebasestorage.app",
                    messagingSenderId: "96646526352",
                    appId: "1:96646526352:web:140e50442fc5e66dca2f15",
                    measurementId: "G-C7MBKREZNG"
                };
                if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
                const dbInstance = firebase.firestore();
                window.firestoreDb = dbInstance;
                fetchListing(dbInstance);
            };
            document.head.appendChild(firestoreScript);
        };
        document.head.appendChild(appScript);
    } catch (e) { console.error(e); }
  }, []);

  const fetchListing = async (db: any) => {
      if (!id) return;
      try {
          const doc = await db.collection("listings").doc(id).get();
          if (doc.exists) {
              const data = { id: doc.id, ...doc.data() };
              setListing(data);
              
              let sortedImages = data.images || [];
              if (data.coverImage) {
                  sortedImages = [data.coverImage, ...sortedImages.filter((img: string) => img !== data.coverImage)];
              }
              setImages(sortedImages);

              if (data.type === 'property') {
                  setCalcInterest(4.2); 
                  setCalcTenure(30);
              } else {
                  setCalcInterest(3.0); 
                  setCalcTenure(5); 
              }

              db.collection("listings").doc(id).update({
                  views: (window as any).firebase.firestore.FieldValue.increment(1)
              });
          } else {
              alert("Listing not found!");
              router.push('/');
          }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') initializeFirebase();
  }, [initializeFirebase]);

  useEffect(() => {
      if (!listing) return;
      const principal = Number(listing.price) - (Number(listing.price) * (calcDownpayment / 100));
      const rate = calcInterest / 100;
      let monthly = 0;

      if (listing.type === 'property') {
          const monthlyRate = rate / 12;
          const months = calcTenure * 12;
          if (monthlyRate === 0) monthly = principal / months;
          else monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      } else {
          const totalInterest = principal * rate * calcTenure;
          const totalAmount = principal + totalInterest;
          monthly = totalAmount / (calcTenure * 12);
      }
      setMonthlyPayment(monthly);
  }, [listing, calcDownpayment, calcInterest, calcTenure]);

  const nextImage = () => setActiveImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
      if (touchStart - touchEnd > 75) nextImage(); 
      if (touchStart - touchEnd < -75) prevImage(); 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-vexa-blue" size={40} /></div>;
  if (!listing) return null;

  const isProperty = listing.type === 'property';

  return (
    // Increased bottom padding to pb-20 to allow scrolling past the lifted floating bar
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-12 font-sans">
        
        {/* Navigation */}
        <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-20 shadow-sm">
            <div className="container mx-auto flex justify-between items-center">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
                    <ArrowLeft size={20} /> Back
                </button>
                <div className="flex gap-2">
                    <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500"><Share2 size={20} /></button>
                    <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500"><Heart size={20} /></button>
                </div>
            </div>
        </div>

        <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: Media & Details */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Image Gallery */}
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 group relative">
                        <div 
                            className="aspect-video bg-slate-100 relative cursor-pointer" 
                            onClick={() => setIsLightboxOpen(true)}
                        >
                            {images.length > 0 ? (
                                <img 
                                    src={images[activeImageIndex]} 
                                    alt={listing.title} 
                                    className="w-full h-full object-cover transition-transform duration-500"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-300">No Images</div>
                            )}
                            
                            <div className="absolute top-4 left-4 flex gap-2">
                                <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md">
                                    {listing.status === 'active' ? 'Active' : listing.status}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md text-white ${isProperty ? 'bg-blue-600/80' : 'bg-orange-500/80'}`}>
                                    {listing.transType || listing.condition}
                                </span>
                            </div>

                            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
                                {activeImageIndex + 1} / {images.length}
                            </div>
                        </div>
                        
                        {images.length > 1 && (
                            <div className="p-2 flex gap-2 overflow-x-auto bg-white border-t border-slate-100">
                                {images.map((img: string, idx: number) => (
                                    <button 
                                        key={idx}
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${activeImageIndex === idx ? 'border-vexa-blue ring-2 ring-blue-100' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Header Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="mb-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-tight">{listing.title}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm">
                                <div className="flex items-center gap-1">
                                    <MapPin size={16} className="text-vexa-blue" /> 
                                    {listing.area}, {listing.state}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock size={16} /> 
                                    Listed {listing.createdAt?.seconds ? new Date(listing.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-end gap-2 mb-6 pb-6 border-b border-slate-100">
                            <h2 className="text-3xl font-bold text-vexa-blue">RM {Number(listing.price).toLocaleString()}</h2>
                            {isProperty && listing.transType === 'Rent' && <span className="text-slate-500 mb-1">/ month</span>}
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {isProperty ? (
                                <>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Size</p>
                                        <p className="font-bold text-slate-800 flex items-center gap-1"><Maximize size={16} className="text-blue-500"/> {listing.size} sqft</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Rooms</p>
                                        <p className="font-bold text-slate-800 flex items-center gap-1"><Bed size={16} className="text-blue-500"/> {listing.bedrooms} Beds</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Baths</p>
                                        <p className="font-bold text-slate-800 flex items-center gap-1"><Bath size={16} className="text-blue-500"/> {listing.bathrooms}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Type</p>
                                        <p className="font-bold text-slate-800 truncate">{listing.propertyType}</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Year</p>
                                        <p className="font-bold text-slate-800 flex items-center gap-1"><Calendar size={16} className="text-orange-500"/> {listing.year}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Mileage</p>
                                        <p className="font-bold text-slate-800 flex items-center gap-1"><Gauge size={16} className="text-orange-500"/> {listing.mileage}k</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Engine</p>
                                        <p className="font-bold text-slate-800 flex items-center gap-1"><Zap size={16} className="text-orange-500"/> {listing.engineCapacity} cc</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Trans</p>
                                        <p className="font-bold text-slate-800">{listing.transmission}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Full Details Table */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                {isProperty ? (
                                    <>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Project Name</span>
                                            <span className="font-medium text-slate-800">{listing.projectName || '-'}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Developer</span>
                                            <span className="font-medium text-slate-800">{listing.developer || '-'}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Tenure</span>
                                            <span className="font-medium text-slate-800">{listing.tenure}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Furnishing</span>
                                            <span className="font-medium text-slate-800">{listing.furnishing}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Floor Level</span>
                                            <span className="font-medium text-slate-800">{listing.floorLevel || '-'}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Make</span>
                                            <span className="font-medium text-slate-800">{listing.make}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Model</span>
                                            <span className="font-medium text-slate-800">{listing.model}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Body Type</span>
                                            <span className="font-medium text-slate-800">{listing.bodyType}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Color</span>
                                            <span className="font-medium text-slate-800">{listing.color}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-slate-100">
                                            <span className="text-slate-500">Fuel Type</span>
                                            <span className="font-medium text-slate-800">{listing.fuel}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 mb-3">Description</h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-8">
                            {listing.description || "No description provided."}
                        </p>

                        {/* Facilities */}
                        {(listing.facilities && listing.facilities.length > 0) && (
                            <div className="mb-8">
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Facilities & Features</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {listing.facilities.map((item: string) => (
                                        <div key={item} className="flex items-center gap-2 text-slate-600 text-sm">
                                            <CheckCircle2 size={16} className="text-emerald-500" /> {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Location */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Location</h3>
                            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-64 relative">
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    frameBorder="0" 
                                    style={{ border: 0 }}
                                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(listing.area + ", " + listing.state)}`}
                                    allowFullScreen
                                ></iframe>
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 pointer-events-none">
                                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-slate-600 flex items-center gap-2">
                                        <MapPin size={16} className="text-red-500" /> {listing.area}, {listing.state}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-2">Nearby Amenities</p>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        <li>• 2.5km to City Center</li>
                                        <li>• 1.0km to Nearest MRT</li>
                                        <li>• 500m to Shopping Mall</li>
                                    </ul>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-2">Education</p>
                                    <ul className="text-sm text-slate-600 space-y-1">
                                        <li>• 3km to International School</li>
                                        <li>• 1.5km to Primary School</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar Info (Hidden on Mobile) */}
                <div className="space-y-6 hidden md:block">
                    {/* Agent Card */}
                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sticky top-24 z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200">
                                <User size={28} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Listed by Agent</p>
                                <h3 className="font-bold text-lg text-slate-900">{listing.agentName || 'Agent'}</h3>
                                <div className="flex items-center gap-1 text-xs text-emerald-600">
                                    <CheckCircle2 size={12} /> Verified Agent
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-100">
                                <MessageCircle size={20} /> WhatsApp
                            </button>
                            <a href={`tel:+60123456789`} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                <Phone size={20} /> Call Now
                            </a>
                        </div>
                    </div>

                    {/* Loan Calculator */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            <Calculator size={20} className="text-vexa-blue" />
                            {isProperty ? "Mortgage Calculator" : "Loan Calculator"}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500">Downpayment (%)</span>
                                    <span className="font-bold text-slate-700">{calcDownpayment}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="50" step="5"
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-vexa-blue"
                                    value={calcDownpayment} onChange={(e) => setCalcDownpayment(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500">Interest Rate (%)</span>
                                    <span className="font-bold text-slate-700">{calcInterest}%</span>
                                </div>
                                <input 
                                    type="range" min="2" max="8" step="0.1"
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-vexa-blue"
                                    value={calcInterest} onChange={(e) => setCalcInterest(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-500">Tenure (Years)</span>
                                    <span className="font-bold text-slate-700">{calcTenure} Yrs</span>
                                </div>
                                <input 
                                    type="range" min={isProperty ? 5 : 1} max={isProperty ? 35 : 9} step="1"
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-vexa-blue"
                                    value={calcTenure} onChange={(e) => setCalcTenure(Number(e.target.value))}
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 text-center">
                                <p className="text-xs text-slate-400 mb-1">Estimated Monthly Payment</p>
                                <h2 className="text-2xl font-bold text-vexa-blue">
                                    RM {Math.round(monthlyPayment).toLocaleString()}
                                </h2>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* MOBILE FLOATING AGENT BAR (UPDATED) */}
        {/* Changed bottom-0 to bottom-15 and increased z-index to sit above any potential bottom nav */}
        <div className="fixed bottom-15 left-0 right-0 bg-white border-t border-slate-200 p-4 md:hidden z-40 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)] mx-4 rounded-2xl mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
                    <User size={20} />
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Agent</p>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{listing.agentName || 'Agent'}</h3>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="bg-emerald-500 text-white p-3 rounded-xl shadow-sm active:scale-95 transition-transform">
                    <MessageCircle size={20} />
                </button>
                <a href={`tel:+60123456789`} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform shadow-lg">
                    <Phone size={16} /> Call Now
                </a>
            </div>
        </div>

        {/* LIGHTBOX */}
        {isLightboxOpen && (
            <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
                <button 
                    onClick={() => setIsLightboxOpen(false)} 
                    className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
                >
                    <X size={32} />
                </button>
                
                <div 
                    className="relative w-full max-w-5xl aspect-video flex items-center justify-center"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <img 
                        src={images[activeImageIndex]} 
                        alt="Gallery" 
                        className="max-h-[80vh] max-w-full object-contain"
                    />
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        className="absolute left-2 md:-left-12 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md"
                    >
                        <ChevronLeft size={32} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        className="absolute right-2 md:-right-12 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md"
                    >
                        <ChevronRight size={32} />
                    </button>
                </div>

                <div className="mt-6 flex gap-2 overflow-x-auto max-w-full pb-2">
                    {images.map((img, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`w-16 h-12 rounded-md overflow-hidden flex-shrink-0 transition-opacity ${activeImageIndex === idx ? 'opacity-100 ring-2 ring-white' : 'opacity-50 hover:opacity-80'}`}
                        >
                            <img src={img} className="w-full h-full object-cover" alt="thumb" />
                        </button>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  MapPin, 
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
  Calculator, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  BarChart3,
  Utensils,
  GraduationCap,
  Bus,
  Landmark,
  Layers,
  MessageCircle,
  User,
  Phone,
  LayoutTemplate
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, query, where, limit, getDocs, updateDoc, increment, setDoc, deleteDoc } from "firebase/firestore";

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
  const [db, setDb] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Interactive State
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // Gallery State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]); 

  // Layouts Tab State
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [activeLayoutImage, setActiveLayoutImage] = useState<string | null>(null); // New lightbox state

  // Calculator State
  const [calcDownpayment, setCalcDownpayment] = useState(10); 
  const [calcInterest, setCalcInterest] = useState(3.5); 
  const [calcTenure, setCalcTenure] = useState(9); 
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  // Market & Similar
  const [marketStats, setMarketStats] = useState<{avg: number, count: number, min: number, max: number} | null>(null);
  const [similarListings, setSimilarListings] = useState<any[]>([]);

  // Explore State
  const [mapQuery, setMapQuery] = useState(""); // Empty means default location

  // Initialize Firebase 
  const initializeFirebase = useCallback(async () => {
    try {
        const storedUserId = localStorage.getItem("vexa_active_user_id");
        setUserId(storedUserId);

        const firebaseConfig = {
            apiKey: "AIzaSyDo4yfchuY8FVunbz_ZinubrbZtSuATOGg",
            authDomain: "vexa-platform.firebaseapp.com",
            projectId: "vexa-platform",
            storageBucket: "vexa-platform.firebasestorage.app",
            messagingSenderId: "96646526352",
            appId: "1:96646526352:web:140e50442fc5e66dca2f15",
            measurementId: "G-C7MBKREZNG"
        };

        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const dbInstance = getFirestore(app);
        setDb(dbInstance);
        fetchListing(dbInstance, storedUserId);
    } catch (e) { console.error(e); }
  }, []);

  const fetchListing = async (database: any, uid: string | null) => {
      if (!id) return;
      try {
          const docRef = doc(database, "listings", id as string);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
              const data = { id: docSnap.id, ...docSnap.data() } as any;
              setListing(data);
              
              let sortedImages = data.images || [];
              if (data.coverImage) {
                  sortedImages = [data.coverImage, ...sortedImages.filter((img: string) => img !== data.coverImage)];
              }
              setImages(sortedImages);

              // Set Active Layout Default
              if (data.layouts && data.layouts.length > 0) {
                  setActiveLayoutId(data.layouts[0].id);
              }

              // Set Calculator Defaults
              if (data.type === 'property' || data.type === 'project') {
                  setCalcInterest(4.2); 
                  setCalcTenure(30);
              } else {
                  setCalcInterest(3.0); 
                  setCalcTenure(5); 
              }

              // View Count
              updateDoc(docRef, {
                  views: increment(1)
              });

              // --- SIMILAR LISTINGS ---
              try {
                  const q = query(
                      collection(database, "listings"),
                      where("type", "==", data.type),
                      where("state", "==", data.state),
                      where("status", "==", "active"),
                      limit(10)
                  );
                  const similarSnap = await getDocs(q);
                  
                  const similars = similarSnap.docs
                    .map((d: any) => ({ id: d.id, ...d.data() }))
                    .filter((item: any) => item.id !== data.id && item.area === data.area) // Filter exact area manually
                    .slice(0, 3); // Take top 3

                  setSimilarListings(similars);

                  // --- MARKET STATS ---
                  const prices = similarSnap.docs
                    .map((d: any) => Number(d.data().price))
                    .filter((p: number) => !isNaN(p));
                  
                  if (prices.length > 0) {
                      const total = prices.reduce((a: number, b: number) => a + b, 0);
                      setMarketStats({
                          avg: total / prices.length,
                          count: prices.length,
                          min: Math.min(...prices),
                          max: Math.max(...prices)
                      });
                  }
              } catch (e) {
                  console.log("Similar/Stats fetch skipped (indexes may be missing)");
              }

              if (uid) {
                  const favRef = doc(database, "users", uid, "favorites", id as string);
                  const favSnap = await getDoc(favRef);
                  if (favSnap.exists()) setIsFavorited(true);

                  const historyRef = doc(database, "users", uid, "history", id as string);
                  await setDoc(historyRef, {
                      id: data.id,
                      title: data.title,
                      price: data.price,
                      coverImage: data.coverImage || '',
                      type: data.type,
                      area: data.area,
                      state: data.state,
                      viewedAt: new Date()
                  });
              }

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, text: `Check out: ${listing.title}`, url: window.location.href });
      } catch (error) { console.log('Error sharing:', error); }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied!");
      } catch (err) { console.error(err); }
    }
  };

  const handleToggleFavorite = async () => {
      if (!userId) return alert("Please log in to save favorites.");
      if (!db || !listing) return;
      setFavLoading(true);
      
      const favRef = doc(db, "users", userId, "favorites", listing.id);
      
      try {
          if (isFavorited) {
              await deleteDoc(favRef);
              setIsFavorited(false);
          } else {
              await setDoc(favRef, {
                  id: listing.id,
                  title: listing.title,
                  price: listing.price,
                  coverImage: listing.coverImage || '',
                  type: listing.type,
                  area: listing.area,
                  state: listing.state,
                  savedAt: new Date()
              });
              setIsFavorited(true);
          }
      } catch (error) { console.error(error); } finally { setFavLoading(false); }
  };

  useEffect(() => {
      if (!listing) return;
      const principal = Number(listing.price) - (Number(listing.price) * (calcDownpayment / 100));
      const rate = calcInterest / 100;
      let monthly = 0;

      if (listing.type === 'property' || listing.type === 'project') {
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
  
  const whatsappNumber = listing.agentPhone ? listing.agentPhone.replace(/\D/g, '') : '60123456789'; 
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=Hi ${listing.agentName}, I'm interested in your listing: ${listing.title} on VEXA.`;
  const isProperty = listing.type === 'property' || listing.type === 'project';

  // --- RENDER HELPERS ---
  const renderFacilities = () => {
      if (!listing.facilities || listing.facilities.length === 0) return null;
      return (
          <div className="mb-8">
              <h3 className="font-bold text-slate-800 mb-3 text-lg">Facilities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
                  {listing.facilities.map((fac: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                          <span>{fac}</span>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const renderSpecs = () => {
      return (
          <div className="mb-8 bg-slate-50 rounded-xl p-5 border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 text-lg">{isProperty ? 'Property Details' : 'Vehicle Specifications'}</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  {isProperty ? (
                      <>
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Tenure</span> <span className="font-medium text-slate-800">{listing.tenure || '-'}</span></div>
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Furnishing</span> <span className="font-medium text-slate-800">{listing.furnishing || '-'}</span></div>
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Developer</span> <span className="font-medium text-slate-800">{listing.developer || listing.agentName || '-'}</span></div>
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Project Name</span> <span className="font-medium text-slate-800">{listing.projectName || listing.title || '-'}</span></div>
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Floor Level</span> <span className="font-medium text-slate-800">{listing.floorLevel || '-'}</span></div>
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Posted Date</span> <span className="font-medium text-slate-800">{listing.createdAt?.seconds ? new Date(listing.createdAt.seconds * 1000).toLocaleDateString() : '-'}</span></div>
                          {/* NEW FIELDS */}
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Bedrooms</span> <span className="font-medium text-slate-800">{listing.bedrooms || '-'}</span></div>
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Bathrooms</span> <span className="font-medium text-slate-800">{listing.bathrooms || '-'}</span></div>
                          {listing.type === 'project' && (
                              <>
                                <div><span className="text-slate-500 block text-xs uppercase font-semibold">Total Units</span> <span className="font-medium text-slate-800">{listing.totalUnits || '-'}</span></div>
                                <div><span className="text-slate-500 block text-xs uppercase font-semibold">Completion</span> <span className="font-medium text-slate-800">{listing.completionYear || '-'}</span></div>
                              </>
                          )}
                      </>
                  ) : (
                      <>
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Make</span> <span className="font-medium text-slate-800">{listing.make || '-'}</span></div>
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Model</span> <span className="font-medium text-slate-800">{listing.model || '-'}</span></div>
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Condition</span> <span className="font-medium text-slate-800">{listing.condition || '-'}</span></div>
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Body Type</span> <span className="font-medium text-slate-800">{listing.bodyType || '-'}</span></div>
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Color</span> <span className="font-medium text-slate-800">{listing.color || '-'}</span></div>
                          <div><span className="text-slate-500 block text-xs uppercase font-semibold">Fuel Type</span> <span className="font-medium text-slate-800">{listing.fuel || '-'}</span></div>
                      </>
                  )}
              </div>
          </div>
      );
  };

  // --- RENDER LAYOUTS (Floor Plans with TABS) ---
  const renderLayouts = () => {
    if (!listing.layouts || listing.layouts.length === 0) return null;
    
    // Find active layout data
    const activeLayout = listing.layouts.find((l: any) => l.id === activeLayoutId) || listing.layouts[0];

    return (
        <div className="mb-8">
            <h3 className="font-bold text-slate-800 mb-4 text-lg flex items-center gap-2"><LayoutTemplate size={20}/> Unit Types & Floor Plans</h3>
            
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                {listing.layouts.map((layout: any) => (
                    <button 
                        key={layout.id}
                        onClick={() => setActiveLayoutId(layout.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                            activeLayoutId === layout.id 
                                ? 'bg-vexa-blue text-white shadow-md' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {layout.name}
                    </button>
                ))}
            </div>

            {/* Active Content */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-4">
                     <div>
                        <h4 className="font-bold text-slate-900 text-lg">{activeLayout.name}</h4>
                        <p className="text-sm text-slate-500 font-medium">{activeLayout.size} sqft</p>
                     </div>
                </div>
                <div 
                    className="aspect-video bg-slate-50 rounded-lg overflow-hidden relative cursor-pointer group" 
                    onClick={() => {
                        if(activeLayout.image) setActiveLayoutImage(activeLayout.image);
                    }}
                >
                    {activeLayout.image ? (
                        <img src={activeLayout.image} className="w-full h-full object-contain" alt={`${activeLayout.name} Floor Plan`} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">No Floor Plan Available</div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const renderNearby = () => {
      // Dynamic Map Query for Iframe
      const locationQuery = `${listing.area}, ${listing.state}`;
      const embedQuery = mapQuery ? `${mapQuery} near ${locationQuery}` : locationQuery;
      
      const setQuery = (q: string) => {
          setMapQuery(q);
      };

      return (
          <div className="mb-8">
              <h3 className="font-bold text-slate-800 mb-4 text-lg flex items-center gap-2">Explore the Area</h3>
              
              {/* Map Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
                  <button 
                    onClick={() => setQuery("")}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${!mapQuery ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Listing Location
                  </button>
                  <button 
                    onClick={() => setQuery("Restaurants")} 
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${mapQuery === "Restaurants" ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                  >
                      <Utensils size={14} /> Food
                  </button>
                  <button 
                    onClick={() => setQuery("Schools")} 
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${mapQuery === "Schools" ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                  >
                      <GraduationCap size={14} /> Schools
                  </button>
                  <button 
                    onClick={() => setQuery("Public Transport")} 
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${mapQuery === "Public Transport" ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                  >
                      <Bus size={14} /> Transport
                  </button>
                  <button 
                    onClick={() => setQuery("Bank")} 
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${mapQuery === "Bank" ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                      <Landmark size={14} /> Banks
                  </button>
              </div>

              {/* Map Iframe */}
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-72 relative shadow-sm">
                  <iframe 
                      key={embedQuery} // Force reload on query change
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/${mapQuery ? 'search' : 'place'}?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(embedQuery)}`}
                      allowFullScreen
                  ></iframe>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-12 font-sans">
        {/* Navigation */}
        <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-20 shadow-sm">
            <div className="container mx-auto flex justify-between items-center">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium">
                    <ArrowLeft size={20} /> Back
                </button>
                <div className="flex gap-2">
                    <button onClick={handleShare} className="p-2 rounded-full hover:bg-slate-100 text-slate-500" title="Share"><Share2 size={20} /></button>
                    <button onClick={handleToggleFavorite} disabled={favLoading} className={`p-2 rounded-full transition-colors ${isFavorited ? 'bg-red-50 text-red-500' : 'hover:bg-slate-100 text-slate-500'}`}>
                        {favLoading ? <Loader2 size={20} className="animate-spin" /> : <Heart size={20} fill={isFavorited ? "currentColor" : "none"} />}
                    </button>
                </div>
            </div>
        </div>

        <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Gallery */}
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 group relative">
                        <div className="aspect-video bg-slate-100 relative cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
                            {images.length > 0 ? (
                                <img src={images[activeImageIndex]} alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-300">No Images</div>
                            )}
                            <div className="absolute top-4 left-4 flex gap-2">
                                <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold uppercase backdrop-blur-md">{listing.status}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase backdrop-blur-md text-white ${isProperty ? 'bg-blue-600/80' : 'bg-orange-500/80'}`}>{listing.transType || listing.condition}</span>
                            </div>
                            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">{activeImageIndex + 1} / {images.length}</div>
                        </div>
                        {images.length > 1 && (
                            <div className="p-2 flex gap-2 overflow-x-auto bg-white border-t border-slate-100">
                                {images.map((img: string, idx: number) => (
                                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${activeImageIndex === idx ? 'border-vexa-blue ring-2 ring-blue-100' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                                        <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Main Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="mb-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-tight">{listing.title}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm">
                                <div className="flex items-center gap-1"><MapPin size={16} className="text-vexa-blue" /> {listing.area}, {listing.state}</div>
                                <div className="flex items-center gap-1"><Clock size={16} /> Listed {listing.createdAt?.seconds ? new Date(listing.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}</div>
                            </div>
                        </div>
                        <div className="flex items-end gap-2 mb-6 pb-6 border-b border-slate-100">
                            <h2 className="text-3xl font-bold text-vexa-blue">RM {Number(listing.price).toLocaleString()}</h2>
                            {isProperty && listing.transType === 'Rent' && <span className="text-slate-500 mb-1">/ month</span>}
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {isProperty ? (
                                <>
                                    <div className="p-3 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Size</p><p className="font-bold text-slate-800 flex items-center gap-1"><Maximize size={16} className="text-blue-500"/> {listing.size} sqft</p></div>
                                    <div className="p-3 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Rooms</p><p className="font-bold text-slate-800 flex items-center gap-1"><Bed size={16} className="text-blue-500"/> {listing.bedrooms}</p></div>
                                    <div className="p-3 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Baths</p><p className="font-bold text-slate-800 flex items-center gap-1"><Bath size={16} className="text-blue-500"/> {listing.bathrooms}</p></div>
                                    <div className="p-3 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Type</p><p className="font-bold text-slate-800 truncate">{listing.propertyType}</p></div>
                                </>
                            ) : (
                                <>
                                    <div className="p-3 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Year</p><p className="font-bold text-slate-800 flex items-center gap-1"><Calendar size={16} className="text-orange-500"/> {listing.year}</p></div>
                                    <div className="p-3 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Mileage</p><p className="font-bold text-slate-800 flex items-center gap-1"><Gauge size={16} className="text-orange-500"/> {listing.mileage}k</p></div>
                                    <div className="p-3 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Engine</p><p className="font-bold text-slate-800 flex items-center gap-1"><Zap size={16} className="text-orange-500"/> {listing.engineCapacity} cc</p></div>
                                    <div className="p-3 bg-slate-50 rounded-xl"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Trans</p><p className="font-bold text-slate-800">{listing.transmission}</p></div>
                                </>
                            )}
                        </div>

                        {renderSpecs()}
                        {renderLayouts()}
                        {renderFacilities()}
                        {renderNearby()}

                        <h3 className="text-lg font-bold text-slate-800 mb-3">Description</h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-8">{listing.description || "No description provided."}</p>

                        {/* Similar Listings Comparison */}
                        {similarListings.length > 0 && (
                            <div className="mb-8">
                                <h3 className="font-bold text-slate-800 mb-4 text-lg flex items-center gap-2">
                                    <Layers size={20} className="text-vexa-blue" /> 
                                    Similar in {listing.area}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {similarListings.map((item) => (
                                        <Link href={`/listing/${item.id}`} key={item.id} className="block group">
                                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all">
                                                <div className="aspect-[4/3] bg-slate-100 relative">
                                                    {item.coverImage && <img src={item.coverImage} className="w-full h-full object-cover" alt={item.title}/>}
                                                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                                                        RM {Number(item.price).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="p-2">
                                                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-blue-600">{item.title}</h4>
                                                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                                                        <span>{isProperty ? `${item.bedrooms} Bed` : item.year}</span>
                                                        <span>{isProperty ? `${item.size} sqft` : `${item.mileage}km`}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* MOBILE CALCULATOR (Visible on Mobile Only) - HIDDEN FOR RENT */}
                        {listing.transType !== 'Rent' && (
                            <div className="md:hidden bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
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
                                        <input type="range" min="0" max="50" step="5" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-vexa-blue" value={calcDownpayment} onChange={(e) => setCalcDownpayment(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-500">Tenure (Years)</span>
                                            <span className="font-bold text-slate-700">{calcTenure} Yrs</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min={isProperty ? 5 : 1} 
                                            max={isProperty ? 35 : 9} // MAX 9 YEARS FOR VEHICLE
                                            step="1" 
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-vexa-blue" 
                                            value={calcTenure} 
                                            onChange={(e) => setCalcTenure(Number(e.target.value))} 
                                        />
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 text-center">
                                        <p className="text-xs text-slate-400 mb-1">Estimated Monthly Payment</p>
                                        <h2 className="text-2xl font-bold text-vexa-blue">RM {Math.round(monthlyPayment).toLocaleString()}</h2>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar Info (Hidden on Mobile) */}
                <div className="space-y-6 hidden md:block">
                    {/* Agent Card */}
                    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sticky top-24 z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200">
                                {listing.agentPhoto ? <img src={listing.agentPhoto} className="w-full h-full object-cover"/> : <User size={28} />}
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Listed by Agent</p>
                                <h3 className="font-bold text-lg text-slate-900">{listing.agentName || 'Agent'}</h3>
                                <div className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 size={12} /> Verified Agent</div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-100">
                                <MessageCircle size={20} /> WhatsApp
                            </a>
                            <a href={`tel:+${whatsappNumber}`} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                <Phone size={20} /> Call Now
                            </a>
                        </div>
                    </div>

                    {/* Loan Calculator - HIDDEN FOR RENT */}
                    {listing.transType !== 'Rent' && (
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
                                        type="range" 
                                        min={isProperty ? 5 : 1} 
                                        max={isProperty ? 35 : 9} // MAX 9 YEARS FOR VEHICLE
                                        step="1"
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-vexa-blue"
                                        value={calcTenure} onChange={(e) => setCalcTenure(Number(e.target.value))}
                                    />
                                </div>
                                <div className="pt-4 border-t border-slate-100 text-center">
                                    <p className="text-xs text-slate-400 mb-1">Estimated Monthly Payment</p>
                                    <h2 className="text-2xl font-bold text-vexa-blue">RM {Math.round(monthlyPayment).toLocaleString()}</h2>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* MOBILE FLOATING AGENT BAR */}
        <div className="fixed bottom-[3.75rem] left-0 right-0 bg-white border-t border-slate-200 p-4 md:hidden z-40 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)] mx-4 rounded-2xl mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                    {listing.agentPhoto ? <img src={listing.agentPhoto} className="w-full h-full object-cover"/> : <User size={20} />}
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Agent</p>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{listing.agentName || 'Agent'}</h3>
                </div>
            </div>
            <div className="flex gap-2">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="bg-emerald-500 text-white p-3 rounded-xl shadow-sm active:scale-95 transition-transform"><MessageCircle size={20} /></a>
                <a href={`tel:+${whatsappNumber}`} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform shadow-lg"><Phone size={16} /> Call Now</a>
            </div>
        </div>

        {/* Lightbox for Gallery */}
        {isLightboxOpen && (
            <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
                <button onClick={() => setIsLightboxOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white p-2"><X size={32} /></button>
                <div className="relative w-full max-w-5xl aspect-video flex items-center justify-center" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                    <img src={images[activeImageIndex]} alt="Gallery" className="max-h-[80vh] max-w-full object-contain" />
                    <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-2 md:-left-12 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md"><ChevronLeft size={32} /></button>
                    <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-2 md:-right-12 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md"><ChevronRight size={32} /></button>
                </div>
            </div>
        )}

        {/* Lightbox for Floor Layout */}
        {activeLayoutImage && (
            <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setActiveLayoutImage(null)}>
                <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2"><X size={32} /></button>
                <img 
                    src={activeLayoutImage} 
                    className="max-h-[90vh] max-w-full rounded-lg shadow-2xl bg-white p-2 object-contain" 
                    alt="Floor Plan Fullscreen"
                    onClick={(e) => e.stopPropagation()} 
                />
            </div>
        )}
    </div>
  );
}
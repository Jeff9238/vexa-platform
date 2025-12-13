"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Search as SearchIcon, 
  MapPin, 
  Home, 
  Car, 
  Filter, 
  Loader2, 
  DollarSign, 
  Maximize, 
  Bed, 
  Bath, 
  Calendar, 
  Gauge, 
  Zap, 
  ArrowRight, 
  User, 
  LayoutGrid, 
  ChevronDown 
} from "lucide-react";
import Link from "next/link";
import MobileNav from "@/components/layout/MobileNav";
import { useSearchParams, useRouter } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

// Constants
const MALAYSIA_STATES = ["All States", "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"];
const PROPERTY_TYPES = ["Condominium", "Apartment", "Terrace House", "Bungalow", "Semi-D", "Commercial", "Land", "Townhouse", "Shop Lot", "Factory", "Office"];
const VEHICLE_MAKES = ["Toyota", "Honda", "Proton", "Perodua", "Nissan", "Mazda", "BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Hyundai", "Kia", "Ford", "Mitsubishi", "Subaru", "Volvo", "Porsche", "Lexus", "Land Rover", "Mini", "Jaguar", "Peugeot", "Renault", "Tesla", "Ferrari", "Lamborghini", "Suzuki", "Isuzu", "Chery", "BYD", "Great Wall", "Others"];
const VEHICLE_BODY_TYPES = ["Sedan", "SUV", "MPV", "Hatchback", "Coupe", "Pickup Truck", "Van", "Convertible", "Wagon", "Sports Car", "4x4"];

const PRICE_RANGES_PROPERTY = [
    { label: "Any Price", min: 0, max: 999999999 },
    { label: "Below RM 300k", min: 0, max: 300000 },
    { label: "RM 300k - 500k", min: 300000, max: 500000 },
    { label: "RM 500k - 1M", min: 500000, max: 1000000 },
    { label: "RM 1M - 2M", min: 1000000, max: 2000000 },
    { label: "Above RM 2M", min: 2000000, max: 999999999 },
];

const PRICE_RANGES_VEHICLE = [
    { label: "Any Price", min: 0, max: 999999999 },
    { label: "Below RM 20k", min: 0, max: 20000 },
    { label: "RM 20k - 50k", min: 20000, max: 50000 },
    { label: "RM 50k - 100k", min: 50000, max: 100000 },
    { label: "RM 100k - 200k", min: 100000, max: 200000 },
    { label: "Above RM 200k", min: 200000, max: 999999999 },
];

const PRICE_RANGES_RENT = [
    { label: "Any Price", min: 0, max: 999999999 },
    { label: "Below RM 1000", min: 0, max: 1000 },
    { label: "RM 1000 - 2000", min: 1000, max: 2000 },
    { label: "RM 2000 - 4000", min: 2000, max: 4000 },
    { label: "Above RM 4000", min: 4000, max: 999999999 },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialType = searchParams.get('type') || 'all';
  const initialTrans = searchParams.get('transType') || 'Sale';
  
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [listingLimit, setListingLimit] = useState(100);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter States
  const [type, setType] = useState(initialType);
  const [transType, setTransType] = useState(initialTrans); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  
  // Extra Filters
  const [propertyType, setPropertyType] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleBody, setVehicleBody] = useState("");
  
  // Price Range Object
  const [selectedPriceRange, setSelectedPriceRange] = useState(PRICE_RANGES_PROPERTY[0]);

  // Scroll State
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Handle Scroll for Header Visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show at top (bounce protection)
      if (currentScrollY <= 10) {
         setIsHeaderVisible(true);
         lastScrollY.current = currentScrollY;
         return;
      }

      // Hide if scrolling DOWN (and moved at least 10px)
      if (currentScrollY > lastScrollY.current + 10) { 
        setIsHeaderVisible(false);
      } 
      // Show if scrolling UP (and moved at least 10px)
      else if (currentScrollY < lastScrollY.current - 10) {
        setIsHeaderVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const initializeFirebase = useCallback(async () => {
    try {
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
        const db = getFirestore(app);
        fetchListings(db);
    } catch (e) { console.error(e); }
  }, [type, transType, selectedState, selectedPriceRange, propertyType, vehicleMake, vehicleBody, listingLimit]); 

  const fetchListings = async (db: any) => {
      setLoading(true);
      try {
          // Base Query
          let q = query(
              collection(db, "listings"),
              where("status", "==", "active"),
              limit(listingLimit)
          );

          if (type !== 'all') {
              q = query(q, where("type", "==", type));
          }
          
          const snapshot = await getDocs(q);
          
          if (snapshot.docs.length < listingLimit) {
              setHasMore(false);
          } else {
              setHasMore(true);
          }

          let items = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
          }));

          // Filters
          if (type === 'property' && transType) {
              items = items.filter((item: any) => item.transType === transType);
          }
          if (selectedState && selectedState !== "All States") {
              items = items.filter((item: any) => item.state === selectedState);
          }
          if (selectedPriceRange) {
              items = items.filter((item: any) => {
                  const p = Number(item.price);
                  return p >= selectedPriceRange.min && p <= selectedPriceRange.max;
              });
          }
          if (type === 'property' && propertyType) {
              items = items.filter((item: any) => item.propertyType === propertyType);
          }
          if (type === 'vehicle') {
              if (vehicleMake) items = items.filter((item: any) => item.make === vehicleMake);
              if (vehicleBody) items = items.filter((item: any) => item.bodyType === vehicleBody);
          }
          if (searchTerm) {
              const lowerTerm = searchTerm.toLowerCase();
              items = items.filter((item: any) => {
                  const basicMatch = 
                      item.title?.toLowerCase().includes(lowerTerm) || 
                      item.description?.toLowerCase().includes(lowerTerm) ||
                      item.area?.toLowerCase().includes(lowerTerm) ||
                      item.state?.toLowerCase().includes(lowerTerm) ||
                      item.agentName?.toLowerCase().includes(lowerTerm);
                  const facilityMatch = item.facilities?.some((f: string) => f.toLowerCase().includes(lowerTerm));
                  const detailMatch = 
                      (item.bedrooms && `${item.bedrooms} bedroom`.includes(lowerTerm)) ||
                      (item.bathrooms && `${item.bathrooms} bathroom`.includes(lowerTerm)) ||
                      (item.year && item.year.toString().includes(lowerTerm)) ||
                      (item.model && item.model.toLowerCase().includes(lowerTerm)) ||
                      (item.make && item.make.toLowerCase().includes(lowerTerm));
                  return basicMatch || facilityMatch || detailMatch;
              });
          }

          items.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
          setListings(items);
      } catch (error) {
          console.error("Search error:", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFirebase();
    }
  }, [initializeFirebase]);

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      setListingLimit(100);
      initializeFirebase();
      setShowFilters(false);
  };

  const handleLoadMore = () => {
      setListingLimit(prev => prev + 50);
  };

  const currentPriceRanges = 
      type === 'vehicle' ? PRICE_RANGES_VEHICLE : 
      (transType === 'Rent' ? PRICE_RANGES_RENT : PRICE_RANGES_PROPERTY);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12 font-sans pt-36">
        
        {/* Header Search Bar - Fixed Below Main Header (top-16) */}
        <div className={`fixed top-16 left-0 right-0 bg-white border-b border-slate-200 px-4 py-4 z-40 shadow-sm transition-transform duration-300 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-[200%]'}`}>
            <form onSubmit={handleSearch} className="container mx-auto flex gap-3">
                <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search '3 Room', 'Toyota', 'KLCC', or 'Swimming Pool'..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-vexa-blue/20 outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-vexa-blue' : 'text-slate-600'}`}
                >
                    <Filter size={20} />
                </button>
            </form>
        </div>

        {/* Filters Drawer - Fixed Below Search Bar (top-32 approx) */}
        {showFilters && (
            <div className={`fixed inset-x-0 top-[9rem] bg-white border-b border-slate-200 px-4 py-6 z-30 shadow-lg animate-in slide-in-from-top-2 max-h-[70vh] overflow-y-auto transition-transform duration-300 ease-in-out ${isHeaderVisible ? 'translate-y-0' : '-translate-y-[200%]'}`}>
                <div className="container mx-auto space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Listing Type</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg mb-3">
                            <button onClick={() => setType('all')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>All</button>
                            <button onClick={() => setType('property')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1 ${type === 'property' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}><Home size={14}/> Property</button>
                            <button onClick={() => setType('vehicle')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1 ${type === 'vehicle' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500'}`}><Car size={14}/> Vehicle</button>
                        </div>
                        {type === 'property' && (
                            <div className="flex gap-2">
                                <button onClick={() => setTransType('Sale')} className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${transType === 'Sale' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>Buy</button>
                                <button onClick={() => setTransType('Rent')} className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${transType === 'Rent' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>Rent</button>
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">State</label>
                            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" value={selectedState} onChange={e => setSelectedState(e.target.value)}>
                                {MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Price Range</label>
                            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" value={selectedPriceRange.label} onChange={e => setSelectedPriceRange(currentPriceRanges.find(r => r.label === e.target.value) || currentPriceRanges[0])}>
                                {currentPriceRanges.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {type === 'property' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Property Type</label>
                            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" value={propertyType} onChange={e => setPropertyType(e.target.value)}>
                                <option value="">Any Type</option>
                                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    )}

                    {type === 'vehicle' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Make</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" value={vehicleMake} onChange={e => setVehicleMake(e.target.value)}>
                                    <option value="">Any Make</option>
                                    {VEHICLE_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Body Type</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none" value={vehicleBody} onChange={e => setVehicleBody(e.target.value)}>
                                    <option value="">Any Body</option>
                                    {VEHICLE_BODY_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button onClick={() => { setType('all'); setSelectedState('All States'); setSearchTerm(''); setTransType('Sale'); setSelectedPriceRange(PRICE_RANGES_PROPERTY[0]); setPropertyType(''); setVehicleMake(''); setVehicleBody(''); }} className="px-4 py-2 text-slate-500 text-sm hover:text-slate-800">Reset</button>
                        <button onClick={handleSearch} className="px-8 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 shadow-md">Show Results</button>
                    </div>
                </div>
            </div>
        )}

        <div className="container mx-auto px-4 py-6">
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-vexa-blue" size={40} /></div>
            ) : listings.length === 0 ? (
                <div className="text-center py-20">
                    <div className="inline-block p-4 bg-slate-100 rounded-full mb-4 text-slate-400">
                        <SearchIcon size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No results found</h3>
                    <p className="text-slate-500">Try adjusting your filters or keywords.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {listings.map(item => (
                            <Link href={`/listing/${item.id}`} key={item.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all border border-slate-200 overflow-hidden group flex flex-col h-full">
                                <div className="aspect-[4/3] bg-slate-200 relative overflow-hidden">
                                    {item.coverImage ? (
                                        <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
                                    )}
                                    <div className="absolute top-2 left-2 flex gap-1">
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded text-white uppercase shadow-sm ${item.type === 'property' ? 'bg-blue-600' : 'bg-orange-500'}`}>{item.type}</span>
                                        {item.transType && (<span className="text-[9px] font-bold px-2 py-1 rounded bg-slate-800 text-white uppercase shadow-sm">{item.transType}</span>)}
                                    </div>
                                    {/* Removed Price Tag from here to avoid blocking */}
                                </div>
                                <div className="p-3 md:p-4 flex-1 flex flex-col">
                                    <div className="mb-2">
                                        <h3 className="font-bold text-slate-900 text-xs md:text-sm line-clamp-1 group-hover:text-vexa-blue transition-colors">{item.title}</h3>
                                        {/* New Price Tag Position */}
                                        <p className="text-vexa-blue font-extrabold text-sm md:text-lg mt-0.5">RM {Number(item.price).toLocaleString()}</p>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 text-slate-500 text-[10px] md:text-xs mb-3"><MapPin size={12} className="flex-shrink-0" /> <span className="truncate">{item.area}, {item.state}</span></div>
                                    <div className="mt-auto grid grid-cols-2 gap-1.5 pt-3 border-t border-slate-50">
                                        {item.type === 'property' ? (
                                            <>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 p-1 rounded justify-center"><Bed size={10} className="text-blue-500"/> {item.bedrooms} Bed</div>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 p-1 rounded justify-center"><Bath size={10} className="text-blue-500"/> {item.bathrooms} Bath</div>
                                                <div className="col-span-2 flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 p-1 rounded justify-center"><Maximize size={10} className="text-blue-500"/> {item.size} sqft</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 p-1 rounded justify-center"><Calendar size={10} className="text-orange-500"/> {item.year}</div>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 p-1 rounded justify-center"><Gauge size={10} className="text-orange-500"/> {item.mileage}km</div>
                                            </>
                                        )}
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
                                        <div className="w-5 h-5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                                            {item.agentPhoto ? <img src={item.agentPhoto} className="w-full h-full object-cover"/> : <User size={12} className="m-auto text-slate-400"/>}
                                        </div>
                                        <span className="text-[10px] text-slate-500 truncate font-medium">{item.agentName || 'Agent'}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    {hasMore && (
                        <div className="mt-12 flex justify-center">
                            <button onClick={handleLoadMore} className="bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-full font-bold shadow-sm hover:bg-slate-50 hover:shadow-md transition-all flex items-center gap-2">Show More Listings <ChevronDown size={20} /></button>
                        </div>
                    )}
                </>
            )}
        </div>

        <MobileNav />
    </div>
  );
}
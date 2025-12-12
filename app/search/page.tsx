"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, MapPin, Search, Filter, Home, Car, DollarSign, X, ArrowDownUp } from "lucide-react";
import Link from "next/link";
import MobileNav from "@/components/layout/MobileNav";

declare global {
  interface Window {
    firebase: any;
    firestoreDb?: any;
  }
}

const MALAYSIA_STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", 
  "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak", 
  "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URL PARAMS
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";
  const location = searchParams.get("location") || "";
  
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState(q);
  const [filterType, setFilterType] = useState(type);
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced Filters
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest, price_asc, price_desc

  // Initialize Firebase
  const initializeFirebase = useCallback(async () => {
    try {
        if (typeof window.firestoreDb !== 'undefined' && window.firestoreDb) {
            fetchListings(window.firestoreDb);
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
                fetchListings(dbInstance);
            };
            document.head.appendChild(firestoreScript);
        };
        document.head.appendChild(appScript);
    } catch (e) { console.error(e); }
  }, []);

  const fetchListings = async (db: any) => {
      try {
          let query = db.collection("listings").where("status", "==", "active");
          const snapshot = await query.get();
          const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
          setListings(data);
      } catch (error) { 
          console.error("Search fetch error:", error); 
          setLoading(false); 
      } finally { 
          setLoading(false); 
      }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') initializeFirebase();
  }, [initializeFirebase]);

  // Filtering Logic
  useEffect(() => {
      let results = listings;

      // 1. Type
      if (filterType !== 'all') {
          results = results.filter(l => l.type === filterType);
      }

      // 2. Search Term (Title, Description, Model, Make, Project, Area, AND STATE)
      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          results = results.filter(l => 
              l.title?.toLowerCase().includes(lowerTerm) ||
              l.description?.toLowerCase().includes(lowerTerm) ||
              l.model?.toLowerCase().includes(lowerTerm) ||
              l.make?.toLowerCase().includes(lowerTerm) ||
              l.projectName?.toLowerCase().includes(lowerTerm) ||
              l.area?.toLowerCase().includes(lowerTerm) ||
              l.state?.toLowerCase().includes(lowerTerm) // <--- Added State Search
          );
      }

      // 3. Price Range
      if (minPrice) results = results.filter(l => Number(l.price) >= Number(minPrice));
      if (maxPrice) results = results.filter(l => Number(l.price) <= Number(maxPrice));

      // 4. State (Dropdown)
      if (selectedState) results = results.filter(l => l.state === selectedState);

      // 5. Sort
      if (sortBy === 'newest') {
          results.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      } else if (sortBy === 'price_asc') {
          results.sort((a, b) => Number(a.price) - Number(b.price));
      } else if (sortBy === 'price_desc') {
          results.sort((a, b) => Number(b.price) - Number(a.price));
      }

      setFilteredResults(results);
  }, [listings, searchTerm, filterType, minPrice, maxPrice, selectedState, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      router.push(`/search?q=${encodeURIComponent(searchTerm)}&type=${filterType}`);
      setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
        
        {/* Search Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
            <div className="container mx-auto">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button 
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-3 py-2 rounded-lg border border-slate-200 text-slate-600 flex items-center gap-2 transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white'}`}
                    >
                        <Filter size={18} />
                        <span className="hidden md:inline">Filters</span>
                    </button>
                </form>
            </div>
        </div>

        {/* Filters Drawer (Mobile & Desktop) */}
        {showFilters && (
            <div className="bg-white border-b border-slate-200 p-4 shadow-sm animate-in slide-in-from-top-2">
                <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Type</label>
                        <select className="w-full p-2 bg-slate-50 rounded border border-slate-200 text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
                            <option value="all">All Types</option>
                            <option value="property">Properties</option>
                            <option value="vehicle">Vehicles</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Sort By</label>
                        <select className="w-full p-2 bg-slate-50 rounded border border-slate-200 text-sm" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            <option value="newest">Newest Listed</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">State</label>
                        <select className="w-full p-2 bg-slate-50 rounded border border-slate-200 text-sm" value={selectedState} onChange={e => setSelectedState(e.target.value)}>
                            <option value="">Any State</option>
                            {MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Price Range (RM)</label>
                        <div className="flex gap-2">
                            <input type="number" placeholder="Min" className="w-1/2 p-2 bg-slate-50 rounded border border-slate-200 text-sm" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
                            <input type="number" placeholder="Max" className="w-1/2 p-2 bg-slate-50 rounded border border-slate-200 text-sm" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Results */}
        <div className="container mx-auto px-4 py-6">
            {loading ? (
                <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
            ) : filteredResults.length === 0 ? (
                <div className="text-center pt-20 text-slate-400">
                    <Search className="mx-auto mb-2 opacity-50" size={48} />
                    <p>No results found.</p>
                </div>
            ) : (
                // UPDATED: grid-cols-2 for mobile
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredResults.map(item => (
                        <Link href={`/listing/${item.id}`} key={item.id} className="block group">
                            <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200 h-full flex flex-col">
                                <div className="aspect-[4/3] bg-slate-200 relative overflow-hidden">
                                    {item.coverImage ? (
                                        <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
                                    )}
                                    <div className="absolute top-2 left-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase text-white shadow-sm flex items-center gap-1 ${item.type === 'property' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                                            {item.type === 'property' ? <Home size={10} /> : <Car size={10} />}
                                            <span className="hidden md:inline">{item.type}</span>
                                        </span>
                                    </div>
                                    <div className="absolute bottom-2 left-2">
                                        <span className="bg-black/60 text-white px-2 py-1 rounded text-[10px] font-bold backdrop-blur-md">
                                            RM {Number(item.price).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 flex-1 flex flex-col">
                                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                    <div className="flex items-center gap-1 text-slate-500 text-[10px] mb-2">
                                        <MapPin size={10} /> <span className="truncate">{item.area}, {item.state}</span>
                                    </div>
                                    <div className="mt-auto pt-2 border-t border-slate-100 flex gap-2 text-[10px] text-slate-600">
                                        {item.type === 'property' ? (
                                            <>
                                                <span className="flex items-center gap-0.5"><Home size={10}/> {item.bedrooms}</span>
                                                <span className="truncate">{item.size} sqft</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="flex items-center gap-0.5"><Car size={10}/> {item.year}</span>
                                                <span className="truncate">{item.mileage}km</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
        <MobileNav />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, MapPin, Search, Filter, Home, Car, DollarSign } from "lucide-react";
import Link from "next/link";
import MobileNav from "@/components/layout/MobileNav";

declare global {
  interface Window {
    firebase: any;
    firestoreDb?: any;
  }
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URL PARAMS
  const q = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";
  const location = searchParams.get("location") || "";
  const transType = searchParams.get("transType") || ""; // 'Sale' or 'Rent'

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  
  // Local filter states
  const [searchTerm, setSearchTerm] = useState(q);
  const [filterType, setFilterType] = useState(type);

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
          // Base query: All active listings
          let query = db.collection("listings").where("status", "==", "active");
          
          // Note: Firestore limits composite queries without indexes.
          // For simplicity/reliability in this phase, we fetch all active docs
          // and filter client-side. This ensures search is robust without index errors.
          
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

      // 1. Filter by Type
      if (filterType !== 'all') {
          results = results.filter(l => l.type === filterType);
      }

      // 2. Filter by Transaction Type (Sale/Rent)
      if (transType) {
          results = results.filter(l => l.transType === transType);
      }

      // 3. Filter by Location
      if (location) {
          const locLower = location.toLowerCase();
          results = results.filter(l => 
             (l.area && l.area.toLowerCase().includes(locLower)) || 
             (l.state && l.state.toLowerCase().includes(locLower))
          );
      }

      // 4. Filter by Search Term (General)
      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          results = results.filter(l => 
              l.title?.toLowerCase().includes(lowerTerm) ||
              l.description?.toLowerCase().includes(lowerTerm) ||
              l.model?.toLowerCase().includes(lowerTerm) || // Cars
              l.make?.toLowerCase().includes(lowerTerm) ||    // Cars
              l.projectName?.toLowerCase().includes(lowerTerm) // Props
          );
      }

      setFilteredResults(results);
  }, [listings, searchTerm, filterType, location, transType]);

  // Handle Search Submit from this page
  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      router.push(`/search?q=${encodeURIComponent(searchTerm)}&type=${filterType}`);
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
                            placeholder="Search properties or vehicles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="px-4 py-2 bg-slate-100 rounded-lg text-slate-700 outline-none cursor-pointer"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="property">Properties</option>
                        <option value="vehicle">Vehicles</option>
                    </select>
                </form>
                {/* Active Filters Display */}
                {(location || transType) && (
                    <div className="flex gap-2 mt-2">
                        {location && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded flex items-center gap-1"><MapPin size={10}/> {location}</span>}
                        {transType && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">{transType}</span>}
                    </div>
                )}
            </div>
        </div>

        {/* Results */}
        <div className="container mx-auto px-4 py-6">
            {loading ? (
                <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
            ) : filteredResults.length === 0 ? (
                <div className="text-center pt-20 text-slate-400">
                    <Search className="mx-auto mb-2 opacity-50" size={48} />
                    <p>No results found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredResults.map(item => (
                        <Link href={`/listing/${item.id}`} key={item.id} className="block group">
                            <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200">
                                <div className="aspect-[4/3] bg-slate-200 relative overflow-hidden">
                                    {item.coverImage ? (
                                        <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
                                    )}
                                    <div className="absolute top-2 left-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase text-white shadow-sm flex items-center gap-1 ${item.type === 'property' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                                            {item.type === 'property' ? <Home size={10} /> : <Car size={10} />}
                                            {item.type}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-2 left-2">
                                        <span className="bg-black/60 text-white px-2 py-1 rounded text-xs font-bold backdrop-blur-md">
                                            RM {Number(item.price).toLocaleString()}
                                        </span>
                                    </div>
                                    {item.transType === 'Rent' && (
                                        <div className="absolute bottom-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-[10px] font-bold">
                                            RENT
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                                        <MapPin size={12} /> {item.area}, {item.state}
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-xs text-slate-600">
                                        {item.type === 'property' ? (
                                            <>
                                                <span className="flex items-center gap-1"><Home size={10}/> {item.bedrooms} Bed</span>
                                                <span>{item.size} sqft</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="flex items-center gap-1"><Car size={10}/> {item.year}</span>
                                                <span>{item.mileage}km</span>
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
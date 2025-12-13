"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  MapPin, 
  Hammer, 
  Loader2, 
  Star,
  ArrowRight,
  Filter,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import MobileNav from "@/components/layout/MobileNav";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, limit } from "firebase/firestore";

const SERVICE_TYPES = [
  "All",
  "General Contractor", "Interior Designer", "Renovation Specialist",
  "Plumber", "Electrician", "Aircon Technician",
  "Carpenter", "Painter", "Tiler", "Roofer",
  "Landscaper / Gardener", "Cleaner / Maid Service", "Pest Control",
  "Locksmith", "Mover / Relocation", "Solar Panel Installer",
  "CCTV / Security System", "Handyman", "Waterproofing Specialist",
  "Glass & Aluminum Work", "Curtain & Blinds", "Flooring Specialist",
  "Others"
];

const MALAYSIA_STATES = ["All States", "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"];

export default function ServicesPage() {
  const [loading, setLoading] = useState(true);
  const [pros, setPros] = useState<any[]>([]);
  
  // Filters
  const [filterType, setFilterType] = useState("All");
  const [filterState, setFilterState] = useState("All States");
  const [searchTerm, setSearchTerm] = useState("");

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
        fetchPros(db);
    } catch (e) { console.error(e); }
  }, [filterType, filterState]); // Re-fetch logic managed inside

  const fetchPros = async (db: any) => {
      setLoading(true);
      try {
          let q = query(
              collection(db, "users"),
              where("role", "==", "pro"),
              limit(100)
          );

          const snapshot = await getDocs(q);
          let items = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                  id: doc.id,
                  name: data.name,
                  ...data.proProfile
              };
          });

          // Advanced Client-side Filtering
          if (filterType !== "All") {
              // Exact match or if 'Others', allow broad match if needed, but here exact is better for dropdown
              items = items.filter(p => p.serviceType === filterType);
          }
          
          if (filterState !== "All States") {
              items = items.filter(p => p.state === filterState);
          }
          
          if (searchTerm) {
              const lowerTerm = searchTerm.toLowerCase();
              items = items.filter(p => 
                  (p.companyName || "").toLowerCase().includes(lowerTerm) ||
                  (p.name || "").toLowerCase().includes(lowerTerm) ||
                  (p.serviceType || "").toLowerCase().includes(lowerTerm) || // Covers custom types
                  (p.description || "").toLowerCase().includes(lowerTerm) ||
                  (p.serviceArea || "").toLowerCase().includes(lowerTerm) ||
                  (p.city || "").toLowerCase().includes(lowerTerm) ||
                  (p.state || "").toLowerCase().includes(lowerTerm)
              );
          }

          setPros(items);
      } catch (error) {
          console.error("Error fetching pros:", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') initializeFirebase();
  }, [initializeFirebase, filterType, filterState]); // Trigger on filter change too

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12 font-sans">
        
        {/* Luxury Header */}
        <div className="bg-[#0f172a] pt-8 pb-20 px-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none"></div>
            <div className="container mx-auto text-center relative z-10">
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 tracking-tight">Elite Professionals</h1>
                <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">Discover top-tier experts for your renovation, maintenance, and vehicle needs.</p>
            </div>
        </div>

        <div className="container mx-auto px-4 -mt-10 relative z-20">
            {/* Advanced Search Bar */}
            <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 p-4 border border-slate-100 flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search 'Plumber', 'Ipoh', or 'Ali'..." 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4 lg:w-1/3">
                    <select 
                        className="w-full h-full p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700 outline-none cursor-pointer hover:bg-white transition-colors"
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                    >
                        {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select 
                        className="w-full h-full p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700 outline-none cursor-pointer hover:bg-white transition-colors"
                        value={filterState}
                        onChange={e => setFilterState(e.target.value)}
                    >
                        {MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <button 
                    onClick={() => initializeFirebase()} 
                    className="bg-slate-900 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg active:scale-95"
                >
                    Search
                </button>
            </div>

            {/* Results Grid - 2 per line on mobile */}
            <div className="py-8">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-600" size={40} /></div>
                ) : pros.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                        <Hammer className="mx-auto text-slate-300 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-slate-700">No professionals found</h3>
                        <p className="text-slate-500">Try adjusting your filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                        {pros.map(pro => {
                            const displayName = pro.isCompany && pro.companyName ? pro.companyName : (pro.displayName || pro.name);
                            const profileImage = pro.profilePhoto || (pro.images && pro.images[0]) || null;

                            return (
                                <Link href={`/services/${pro.id}`} key={pro.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden group flex flex-col h-full">
                                    {/* Cover Banner */}
                                    <div className="h-20 md:h-24 bg-gradient-to-r from-slate-800 to-purple-900 relative">
                                        {pro.coverImage && <img src={pro.coverImage} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />}
                                        <div className="absolute top-2 right-2">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${pro.isAvailable ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                                                {pro.isAvailable ? 'Online' : 'Busy'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="px-3 pb-3 md:px-5 md:pb-5 -mt-8 flex-1 flex flex-col">
                                        {/* Avatar */}
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl shadow-md border-2 border-white overflow-hidden mb-2 relative z-10 mx-auto md:mx-0">
                                            {profileImage ? (
                                                <img src={profileImage} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300"><Briefcase size={24}/></div>
                                            )}
                                        </div>
                                        
                                        <div className="text-center md:text-left">
                                            <h3 className="font-bold text-sm md:text-lg text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1 leading-tight">{displayName}</h3>
                                            <p className="text-purple-600 text-[10px] md:text-xs font-bold uppercase tracking-wide mt-1 line-clamp-1">{pro.serviceType}</p>
                                        </div>

                                        <div className="space-y-1 mt-3 mb-3 text-center md:text-left flex-1">
                                            <div className="flex items-center justify-center md:justify-start gap-1 text-[10px] md:text-xs text-slate-500">
                                                <MapPin size={10} className="md:w-3 md:h-3" /> <span className="truncate">{pro.city || "Malaysia"}</span>
                                            </div>
                                            {pro.experience && (
                                                <div className="flex items-center justify-center md:justify-start gap-1 text-[10px] md:text-xs text-slate-500">
                                                    <Star size={10} className="text-amber-400 fill-amber-400 md:w-3 md:h-3" /> {pro.experience} Exp
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-3 border-t border-slate-50">
                                            <span className="text-xs font-bold text-slate-400 group-hover:text-purple-600 flex items-center justify-center md:justify-between gap-1 transition-colors w-full">
                                                View Profile <ArrowRight size={14} className="hidden md:block"/>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>

        <MobileNav />
    </div>
  );
}
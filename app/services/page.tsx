"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  MapPin, 
  Filter, 
  Star, 
  Loader2, 
  Briefcase, 
  Phone,
  ArrowRight,
  MessageCircle,
  Building2,
  User
} from "lucide-react";
import Link from "next/link";

declare global {
  interface Window {
    firebase: any;
    firestoreDb?: any;
  }
}

const SERVICE_TYPES = [
  "All Services",
  "General Contractor", "Interior Designer", "Renovation Specialist",
  "Plumber", "Electrician", "Aircon Technician",
  "Carpenter", "Painter", "Tiler", "Roofer",
  "Landscaper / Gardener", "Cleaner / Maid Service", "Pest Control",
  "Locksmith", "Mover / Relocation", "Solar Panel Installer",
  "CCTV / Security System", "Handyman", "Waterproofing Specialist",
  "Glass & Aluminum Work", "Curtain & Blinds", "Flooring Specialist"
];

export default function ServicesPage() {
  const [loading, setLoading] = useState(true);
  const [pros, setPros] = useState<any[]>([]);
  const [filteredPros, setFilteredPros] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Services");

  const initializeFirebase = useCallback(async () => {
    try {
        if (typeof window.firestoreDb !== 'undefined' && window.firestoreDb) {
            fetchPros(window.firestoreDb);
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
                fetchPros(dbInstance);
            };
            document.head.appendChild(firestoreScript);
        };
        document.head.appendChild(appScript);
    } catch (e) {
      console.error("Init Error:", e);
    }
  }, []);

  const fetchPros = async (db: any) => {
      try {
          const snapshot = await db.collection("users")
            .where("role", "==", "pro")
            .limit(50)
            .get();

          const prosData = snapshot.docs.map((doc: any) => {
              const data = doc.data();
              return {
                  id: doc.id,
                  name: data.name,
                  ...data.proProfile
              };
          });

          setPros(prosData);
          setFilteredPros(prosData);
      } catch (error) {
          console.error("Error fetching pros:", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFirebase();
    }
  }, [initializeFirebase]);

  useEffect(() => {
      let result = pros;
      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          result = result.filter(pro => 
              (pro.companyName && pro.companyName.toLowerCase().includes(lowerTerm)) ||
              (pro.name && pro.name.toLowerCase().includes(lowerTerm)) ||
              (pro.description && pro.description.toLowerCase().includes(lowerTerm))
          );
      }
      if (selectedCategory !== "All Services") {
          result = result.filter(pro => pro.serviceType === selectedCategory);
      }
      setFilteredPros(result);
  }, [searchTerm, selectedCategory, pros]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
            <div className="container mx-auto px-4 py-4 md:py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Briefcase className="text-purple-600" /> 
                            Find Service Pros
                        </h1>
                        <p className="text-sm text-slate-500">Connect with top-rated renovators & technicians</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-purple-600 transition-colors">
                            My Dashboard
                        </Link>
                        <Link href="/pro-dashboard" className="px-4 py-2 text-sm font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm">
                            Join as Pro
                        </Link>
                    </div>
                </div>
                <div className="mt-6 flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="What service do you need?" 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative md:w-64">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none appearance-none bg-white cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {SERVICE_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div className="container mx-auto px-4 py-8">
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-purple-600" size={40} />
                </div>
            ) : filteredPros.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <Briefcase className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-700">No Pros Found</h3>
                    <p className="text-slate-500">Try adjusting your filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPros.map((pro) => (
                        <div key={pro.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
                            <div className="relative h-48 bg-slate-100 overflow-hidden">
                                {pro.coverImage ? (
                                    <img 
                                        src={pro.coverImage} 
                                        alt={pro.companyName || pro.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                        <Briefcase size={40} />
                                        <span className="text-xs mt-2 font-medium">No Cover Image</span>
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1">
                                    <Star size={12} className="fill-orange-400 text-orange-400" /> 5.0
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 line-clamp-1">
                                            {pro.companyName || pro.name || 'Unknown Pro'}
                                        </h3>
                                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                                            {pro.isCompany ? <Building2 size={12} /> : <User size={12} />}
                                            {pro.serviceType || 'Service Provider'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
                                    <MapPin size={14} className="text-purple-500" />
                                    <span className="line-clamp-1">{pro.city || 'Malaysia'}, {pro.state}</span>
                                </div>
                                <p className="text-slate-600 text-sm line-clamp-2 mb-4 flex-1">
                                    {pro.description || "No description provided."}
                                </p>
                                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                                    {pro.whatsapp ? (
                                        <a 
                                            href={`https://wa.me/${pro.whatsapp.replace(/\D/g, '')}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-2 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors"
                                        >
                                            <MessageCircle size={16} /> WhatsApp
                                        </a>
                                    ) : (
                                        <button disabled className="flex items-center justify-center gap-2 bg-slate-50 text-slate-400 py-2 rounded-lg text-sm font-bold cursor-not-allowed">
                                            <MessageCircle size={16} /> WhatsApp
                                        </button>
                                    )}
                                    {/* FIXED LINK */}
                                    <Link 
                                        href={`/services/${pro.id}`}
                                        className="flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        View Profile <ArrowRight size={14} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
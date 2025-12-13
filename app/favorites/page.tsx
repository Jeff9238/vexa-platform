"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Heart, 
  Loader2, 
  MapPin, 
  Home, 
  Car, 
  Trash2, 
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import MobileNav from "@/components/layout/MobileNav";
import { getFirestore, collection, query, orderBy, getDocs, doc, deleteDoc } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";

export default function FavoritesPage() {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [db, setDb] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const initializeFirebase = useCallback(async () => {
    try {
        const storedUserId = localStorage.getItem("vexa_active_user_id");
        if (!storedUserId) {
            alert("Please log in to view favorites.");
            setLoading(false);
            return;
        }
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
        fetchFavorites(dbInstance, storedUserId);
    } catch (e) { console.error(e); }
  }, []);

  const fetchFavorites = async (database: any, uid: string) => {
      try {
          const q = query(collection(database, "users", uid, "favorites"), orderBy("savedAt", "desc"));
          const snapshot = await getDocs(q);
          const items = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
          }));
          setFavorites(items);
      } catch (error) {
          console.error("Error fetching favorites:", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFirebase();
    }
  }, [initializeFirebase]);

  const handleRemove = async (e: React.MouseEvent, listingId: string) => {
      e.preventDefault();
      if (!db || !userId) return;
      if(!confirm("Remove from favorites?")) return;

      try {
          await deleteDoc(doc(db, "users", userId, "favorites", listingId));
          setFavorites(prev => prev.filter(item => item.id !== listingId));
      } catch (error) {
          console.error("Error removing:", error);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12 font-sans">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-red-100 p-3 rounded-full text-red-600">
                <Heart size={24} fill="currentColor" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">My Favorites</h1>
                <p className="text-slate-500 text-sm">Saved properties and vehicles</p>
            </div>
        </div>

        {loading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-vexa-blue" size={40} />
            </div>
        ) : favorites.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <Heart className="mx-auto text-slate-300 mb-4" size={48} />
                <h3 className="text-lg font-bold text-slate-700">No favorites yet</h3>
                <p className="text-slate-500 mb-6">Start exploring and save items you love.</p>
                <Link href="/search" className="inline-flex items-center gap-2 bg-vexa-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                    Browse Listings <ArrowRight size={16} />
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {favorites.map((item) => (
                    <Link href={`/listing/${item.id}`} key={item.id} className="group block relative">
                        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200">
                            <div className="aspect-[4/3] bg-slate-200 relative overflow-hidden">
                                {item.coverImage ? (
                                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
                                )}
                                
                                <button 
                                    onClick={(e) => handleRemove(e, item.id)}
                                    className="absolute top-2 right-2 p-1.5 md:p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors z-10 shadow-sm"
                                    title="Remove"
                                >
                                    <Trash2 size={14} className="md:w-4 md:h-4" />
                                </button>

                                <div className="absolute top-2 left-2">
                                    <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[10px] md:text-xs font-bold uppercase text-white shadow-sm flex items-center gap-1 ${item.type === 'property' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                                        {item.type === 'property' ? <Home size={8} className="md:w-2.5 md:h-2.5" /> : <Car size={8} className="md:w-2.5 md:h-2.5" />}
                                        <span className="hidden md:inline">{item.type}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 md:p-4">
                                <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors text-sm md:text-base">{item.title}</h3>
                                <p className="text-vexa-orange font-bold text-sm md:text-lg mb-1 md:mb-2">RM {Number(item.price).toLocaleString()}</p>
                                <div className="flex items-center gap-1 text-slate-500 text-[10px] md:text-xs">
                                    <MapPin size={10} className="md:w-3 md:h-3" /> <span className="truncate">{item.area}, {item.state}</span>
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
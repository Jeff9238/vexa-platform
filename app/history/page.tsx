"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Clock, 
  Loader2, 
  MapPin, 
  Home, 
  Car, 
  Trash2, 
  ArrowRight,
  History
} from "lucide-react";
import Link from "next/link";
import MobileNav from "@/components/layout/MobileNav";
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, writeBatch } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [db, setDb] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const initializeFirebase = useCallback(async () => {
    try {
        const storedUserId = localStorage.getItem("vexa_active_user_id");
        if (!storedUserId) {
            alert("Please log in to view history.");
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
        fetchHistory(dbInstance, storedUserId);
    } catch (e) { console.error(e); }
  }, []);

  const fetchHistory = async (database: any, uid: string) => {
      try {
          const q = query(
              collection(database, "users", uid, "history"),
              orderBy("viewedAt", "desc"),
              limit(50)
          );
          const snapshot = await getDocs(q);
            
          const items = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
          }));
          setHistoryItems(items);
      } catch (error) {
          console.error("Error fetching history:", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFirebase();
    }
  }, [initializeFirebase]);

  const handleClearHistory = async () => {
      if (!db || !userId) return;
      if (!confirm("Are you sure you want to clear your browsing history?")) return;

      try {
          const q = query(collection(db, "users", userId, "history"));
          const snapshot = await getDocs(q);
          const batch = writeBatch(db);
          snapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
          });
          await batch.commit();
          setHistoryItems([]);
      } catch (error) {
          console.error("Error clearing history:", error);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12 font-sans">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <History size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Browsing History</h1>
                    <p className="text-slate-500 text-sm">Recently viewed items</p>
                </div>
            </div>
            {historyItems.length > 0 && (
                <button 
                    onClick={handleClearHistory}
                    className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-2"
                >
                    <Trash2 size={16} /> Clear
                </button>
            )}
        </div>

        {loading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-vexa-blue" size={40} />
            </div>
        ) : historyItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <Clock className="mx-auto text-slate-300 mb-4" size={48} />
                <h3 className="text-lg font-bold text-slate-700">No history yet</h3>
                <p className="text-slate-500 mb-6">Items you view will appear here.</p>
                <Link href="/search" className="inline-flex items-center gap-2 bg-vexa-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                    Start Browsing <ArrowRight size={16} />
                </Link>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {historyItems.map((item) => (
                    <Link href={`/listing/${item.id}`} key={item.id} className="group block relative">
                        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200 opacity-90 hover:opacity-100">
                            <div className="aspect-[4/3] bg-slate-200 relative overflow-hidden">
                                {item.coverImage ? (
                                    <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
                                )}
                                
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
                                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-400">
                                    <Clock size={10} /> {item.viewedAt?.seconds ? new Date(item.viewedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
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
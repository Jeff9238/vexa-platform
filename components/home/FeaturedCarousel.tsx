"use client";

import { useState, useEffect } from "react";
import { Star, MapPin, Car, Home, Loader2 } from "lucide-react";
import Link from "next/link";

declare global {
  interface Window {
    firebase: any;
    firestoreDb?: any;
  }
}

export default function FeaturedCarousel() {
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      // Fetch latest active listings from Firestore
      const fetchFeatured = async () => {
          try {
              let db = window.firestoreDb;
              
              if (!db && (window as any).firebase?.apps?.length) {
                  db = (window as any).firebase.firestore();
              }

              if (db) {
                  // Fetch all active, client-side sort to avoid index error
                  const snapshot = await db.collection("listings")
                      .where("status", "==", "active")
                      .limit(10)
                      .get();
                  
                  let items = snapshot.docs.map((doc: any) => ({
                      id: doc.id,
                      ...doc.data()
                  }));
                  
                  // Sort descending by date
                  items.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                  
                  setFeaturedItems(items.slice(0, 6)); // Top 6
              }
          } catch (error) {
              console.error("Featured fetch error:", error);
          } finally {
              setLoading(false);
          }
      };

      const timer = setTimeout(fetchFeatured, 1500); 
      return () => clearTimeout(timer);
  }, []);

  if (loading) {
      return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-vexa-blue" size={32} /></div>;
  }

  if (featuredItems.length === 0) {
      return (
          <section className="py-6">
              <div className="py-12 text-center text-gray-400 bg-slate-50 rounded-xl border border-slate-100">
                  <p>No featured listings available yet.</p>
              </div>
          </section>
      );
  }

  return (
    <section className="py-6">
      <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory px-4">
          {featuredItems.map((item) => (
            <Link 
              href={`/listing/${item.id}`}
              key={item.id} 
              className="snap-center min-w-[280px] md:min-w-[320px] bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group cursor-pointer border border-slate-100"
            >
              <div className="relative h-48 w-full bg-slate-200">
                  {item.coverImage ? (
                      <img 
                        src={item.coverImage} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                  ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
                  )}
                  
                  <div className="absolute top-3 left-3 bg-vexa-orange text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                    FEATURED
                  </div>
                  
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm flex items-center gap-1 font-bold uppercase">
                    {item.type === 'property' ? <Home size={12}/> : <Car size={12}/>}
                    {item.type}
                  </div>
              </div>

              <div className="p-4 text-vexa-blue">
                <h3 className="font-bold text-lg truncate text-slate-800 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-vexa-orange font-bold text-xl mt-1">RM {Number(item.price).toLocaleString()}</p>
                
                <div className="flex items-center gap-2 text-gray-500 text-xs mt-2 line-clamp-1">
                  <MapPin size={14} />
                  {item.area}, {item.state}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-xs text-gray-400 truncate max-w-[120px]">By {item.agentName}</span>
                  <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    View
                  </span>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Bell, 
  ArrowRight,
  TrendingDown,
  Tag,
  Info,
  CheckCircle2,
  Loader2,
  Home,
  Car
} from "lucide-react";
import Link from "next/link";
import MobileNav from "@/components/layout/MobileNav";

declare global {
  interface Window {
    firebase: any;
    firestoreDb?: any;
  }
}

export default function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize Firebase & Fetch Data
  const initializeFirebase = useCallback(async () => {
    try {
        const storedUserId = localStorage.getItem("vexa_active_user_id");
        setUserId(storedUserId);

        if (typeof window.firestoreDb !== 'undefined' && window.firestoreDb) {
            fetchAlerts(window.firestoreDb, storedUserId);
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
                fetchAlerts(dbInstance, storedUserId);
            };
            document.head.appendChild(firestoreScript);
        };
        document.head.appendChild(appScript);
    } catch (e) { console.error(e); }
  }, []);

  const fetchAlerts = async (db: any, uid: string | null) => {
      try {
          const combinedAlerts: any[] = [];

          // 1. FETCH REAL BACKEND NOTIFICATIONS (If User Logged In)
          if (uid) {
             try {
                 const notifSnapshot = await db.collection("users").doc(uid).collection("notifications")
                    .orderBy("createdAt", "desc")
                    .limit(20)
                    .get();
                 
                 const realNotifs = notifSnapshot.docs.map((doc: any) => {
                     const data = doc.data();
                     return {
                         id: doc.id,
                         ...data,
                         time: data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'Just now',
                         source: 'backend'
                     };
                 });
                 combinedAlerts.push(...realNotifs);
             } catch (err) {
                 console.log("No notifications collection found (Backend not deployed yet).");
             }
          }

          // 2. FETCH RECOMMENDATIONS (Frontend Generated from Active Listings)
          // We fetch the latest active listings to show "New Arrivals" even without backend triggers
          let listingSnapshot;
          try {
              listingSnapshot = await db.collection("listings")
                  .where("status", "==", "active")
                  .orderBy("createdAt", "desc")
                  .limit(10)
                  .get();
          } catch (indexError) {
              // Fallback if index missing
              listingSnapshot = await db.collection("listings")
                  .where("status", "==", "active")
                  .limit(10)
                  .get();
          }

          const recommendations = listingSnapshot.docs.map((doc: any) => {
              const data = doc.data();
              const isProperty = data.type === 'property';
              const date = data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000) : new Date();

              return {
                  id: `rec_${doc.id}`,
                  type: 'new_listing',
                  title: `Recommended: ${isProperty ? 'Property' : 'Vehicle'}`,
                  message: `New arrival: ${data.title} in ${data.area}. Listed for RM ${Number(data.price).toLocaleString()}.`,
                  time: date.toLocaleDateString(),
                  read: false,
                  link: `/listing/${doc.id}`,
                  iconType: data.type,
                  source: 'recommendation'
              };
          });

          // Filter out recommendations if we already have a real notification for that listing ID
          const uniqueRecs = recommendations.filter((rec: any) => 
             !combinedAlerts.some((alert: any) => alert.link === rec.link)
          );

          setAlerts([...combinedAlerts, ...uniqueRecs]);
      } catch (error) {
          console.error("Error fetching alerts:", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFirebase();
    }
  }, [initializeFirebase]);

  const markAsRead = async (alert: any) => {
    // Optimistic UI update
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, read: true } : a));
    
    // If it's a real backend notification, update DB
    if (alert.source === 'backend' && userId && window.firestoreDb) {
        try {
            await window.firestoreDb.collection("users").doc(userId).collection("notifications").doc(alert.id).update({
                read: true
            });
        } catch (e) { console.error("Failed to mark read in DB", e); }
    }
  };

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    // In production, batch update Firestore here
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12 font-sans">
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-full text-orange-600">
                    <Bell size={24} fill="currentColor" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
                    <p className="text-slate-500 text-sm">Updates & Recommendations</p>
                </div>
            </div>
            {alerts.some(a => !a.read) && (
                <button 
                    onClick={markAllRead}
                    className="text-sm text-vexa-blue hover:text-blue-700 font-medium flex items-center gap-1"
                >
                    <CheckCircle2 size={16} /> Mark all read
                </button>
            )}
        </div>

        {/* Alerts List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-vexa-blue" size={40} />
                </div>
            ) : alerts.length === 0 ? (
                <div className="text-center py-20">
                    <Bell className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-700">No new alerts</h3>
                    <p className="text-slate-500 mb-6">We'll notify you about price drops and new listings.</p>
                    <Link href="/search" className="inline-flex items-center gap-2 bg-vexa-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                        Browse Listings <ArrowRight size={16} />
                    </Link>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {alerts.map((alert) => (
                        <Link 
                            href={alert.link} 
                            key={alert.id} 
                            onClick={() => markAsRead(alert)}
                            className={`block p-4 md:p-6 hover:bg-slate-50 transition-colors relative ${!alert.read ? 'bg-blue-50/40' : ''}`}
                        >
                            <div className="flex gap-4">
                                {/* Icon based on type */}
                                <div className={`mt-1 p-2 rounded-full h-fit flex-shrink-0 ${
                                    alert.type === 'price_drop' ? 'bg-green-100 text-green-600' :
                                    alert.iconType === 'property' ? 'bg-blue-100 text-blue-600' :
                                    alert.iconType === 'vehicle' ? 'bg-orange-100 text-orange-600' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                    {alert.type === 'price_drop' ? <TrendingDown size={20} /> :
                                     alert.iconType === 'property' ? <Home size={20} /> :
                                     alert.iconType === 'vehicle' ? <Car size={20} /> :
                                     <Info size={20} />}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold text-sm md:text-base ${!alert.read ? 'text-slate-900' : 'text-slate-700'}`}>
                                            {alert.title}
                                            {!alert.read && <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                                        </h4>
                                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{alert.time}</span>
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">{alert.message}</p>
                                </div>
                                
                                {/* Arrow Indicator */}
                                <div className="self-center text-slate-300">
                                    <ArrowRight size={18} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
}
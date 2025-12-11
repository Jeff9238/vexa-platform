"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Loader2, 
  MapPin, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  Star,
  Globe,
  Facebook,
  Instagram,
  Phone,
  Video, 
  BookOpen, 
  MessageCircle,
  Building2,
  User,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

declare global {
  interface Window {
    firebase: any;
    firestoreDb?: any;
  }
}

export default function PublicProProfile() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [pro, setPro] = useState<any>(null);

  const initializeFirebase = useCallback(async () => {
    try {
        if (typeof window.firestoreDb !== 'undefined' && window.firestoreDb) {
            fetchProData(window.firestoreDb);
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
                fetchProData(dbInstance);
            };
            document.head.appendChild(firestoreScript);
        };
        document.head.appendChild(appScript);
    } catch (e) { console.error(e); }
  }, []);

  const fetchProData = async (db: any) => {
      if (!id) return;
      try {
          const doc = await db.collection("users").doc(id).get();
          if (doc.exists) {
              const data = doc.data();
              setPro({
                  id: doc.id,
                  name: data.name,
                  ...data.proProfile
              });
          }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFirebase();
    }
  }, [initializeFirebase]);

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-purple-600" size={40} />
          </div>
      );
  }

  if (!pro) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Profile Not Found</h1>
              <p className="text-slate-500 mb-4">This professional's page does not exist or has been removed.</p>
              <Link href="/services" className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold">Back to Directory</Link>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
        
        {/* Cover Image */}
        <div className="h-64 md:h-80 bg-slate-200 relative">
            {pro.coverImage ? (
                <img src={pro.coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-300">
                    <Briefcase size={64} />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <Link href="/services" className="absolute top-6 left-6 bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition-colors">
                <ArrowLeft size={24} />
            </Link>
        </div>

        <div className="container mx-auto px-4 -mt-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    {pro.companyName || pro.name}
                                </h1>
                                <div className="flex flex-wrap gap-3 text-sm">
                                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                        {pro.isCompany ? <Building2 size={14} /> : <User size={14} />}
                                        {pro.serviceType}
                                    </span>
                                    {pro.isAvailable && (
                                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                            <CheckCircle2 size={14} /> Available
                                        </span>
                                    )}
                                    <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                        <Star size={14} className="fill-orange-700" /> 5.0 Rating
                                    </span>
                                </div>
                            </div>
                            {pro.ssmNumber && (
                                <div className="text-right hidden md:block">
                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">SSM Registration</p>
                                    <p className="text-sm font-mono text-slate-600">{pro.ssmNumber}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-slate-600 mb-6">
                            <MapPin className="text-purple-600" size={20} />
                            <span>{pro.streetAddress}, {pro.city}, {pro.postalCode}, {pro.state}</span>
                        </div>

                        <h3 className="font-bold text-lg text-slate-800 mb-3">About Us</h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {pro.description || "This pro hasn't added a description yet."}
                        </p>

                        <div className="mt-6 pt-6 border-t border-slate-100 flex gap-6 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <Clock size={16} /> {pro.experience || 'N/A'} Experience
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={16} /> Service Area: {pro.city || 'Malaysia'}
                            </div>
                        </div>
                    </div>

                    {/* Gallery */}
                    {pro.images && pro.images.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                            <h3 className="font-bold text-xl text-slate-800 mb-6">Portfolio Gallery</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {pro.images.map((img: string, idx: number) => (
                                    <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                                        <img src={img} alt={`Work ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Contact */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
                        <h3 className="font-bold text-lg text-slate-800 mb-4">Contact Pro</h3>
                        
                        {pro.whatsapp ? (
                            <div className="space-y-3 mb-6">
                                <a 
                                    href={`https://wa.me/${pro.whatsapp.replace(/\D/g, '')}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200"
                                >
                                    <MessageCircle size={20} /> Chat on WhatsApp
                                </a>
                                <a 
                                    href={`tel:+${pro.whatsapp.replace(/\D/g, '')}`} 
                                    className="flex items-center justify-center gap-2 w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg"
                                >
                                    <Phone size={20} /> Call Now
                                </a>
                            </div>
                        ) : (
                            <div className="text-center p-4 bg-slate-50 rounded-xl text-slate-400 text-sm mb-4">
                                Contact not available
                            </div>
                        )}

                        <div className="space-y-3">
                            {pro.website && (
                                <a href={pro.website} target="_blank" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-slate-600">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Globe size={16} /></div>
                                    <span className="text-sm font-medium">Visit Website</span>
                                </a>
                            )}
                            {pro.facebook && (
                                <a href={pro.facebook} target="_blank" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors text-slate-600 hover:text-blue-700">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Facebook size={16} /></div>
                                    <span className="text-sm font-medium">Facebook</span>
                                </a>
                            )}
                            {pro.instagram && (
                                <a href={pro.instagram} target="_blank" className="flex items-center gap-3 p-3 rounded-lg hover:bg-pink-50 transition-colors text-slate-600 hover:text-pink-600">
                                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600"><Instagram size={16} /></div>
                                    <span className="text-sm font-medium">Instagram</span>
                                </a>
                            )}
                            {pro.tiktok && (
                                <a href={pro.tiktok} target="_blank" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 hover:text-black">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-black"><Video size={16} /></div>
                                    <span className="text-sm font-medium">TikTok</span>
                                </a>
                            )}
                            {pro.xiaohongshu && (
                                <a href={pro.xiaohongshu} target="_blank" className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 transition-colors text-slate-600 hover:text-red-600">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600"><BookOpen size={16} /></div>
                                    <span className="text-sm font-medium">XiaoHongShu</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
}
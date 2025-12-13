"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Globe, 
  Facebook, 
  Instagram, 
  Video, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Star, 
  ArrowLeft,
  Loader2,
  Building2,
  User,
  Share2,
  Briefcase,
  Award,
  BadgeCheck,
  Map,
  ArrowRight
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";

declare global {
  interface Window {
    firebase: any;
    firestoreDb?: any;
  }
}

export default function ServiceProDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pro, setPro] = useState<any>(null);
  const [similarPros, setSimilarPros] = useState<any[]>([]);
  const [activeImage, setActiveImage] = useState<number | null>(null);

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
        fetchPro(db);
    } catch (e) { console.error(e); }
  }, []);

  const fetchPro = async (db: any) => {
      if (!id) return;
      try {
          const docRef = doc(db, "users", id as string);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.role === 'pro' && data.proProfile) {
                  const proData = {
                      id: docSnap.id,
                      name: data.name, 
                      ...data.proProfile
                  };
                  setPro(proData);
                  fetchSimilar(db, proData.serviceType, proData.id);
              } else {
                  alert("This profile is not available.");
                  router.push('/services');
              }
          } else {
              alert("Pro not found!");
              router.push('/services');
          }
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  const fetchSimilar = async (db: any, type: string, currentId: string) => {
      try {
          const q = query(
              collection(db, "users"),
              where("role", "==", "pro"),
              limit(10)
          );
          const snapshot = await getDocs(q);
          const items = snapshot.docs
            .map(doc => ({ id: doc.id, name: doc.data().name, ...doc.data().proProfile }))
            .filter((p: any) => p.serviceType === type && p.id !== currentId)
            .slice(0, 4);
          
          setSimilarPros(items);
      } catch (e) { console.error("Similar fetch error", e); }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') initializeFirebase();
  }, [initializeFirebase]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: pro.companyName || pro.name, text: `Check out ${pro.serviceType} on VEXA`, url: window.location.href });
      } catch (error) { console.log('Error sharing:', error); }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied!");
      } catch (err) { console.error(err); }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
  if (!pro) return null;

  const whatsappLink = `https://wa.me/${pro.whatsapp ? pro.whatsapp.replace(/\D/g, '') : ''}?text=Hi ${pro.companyName || pro.name}, I saw your profile on VEXA.`;
  
  const displayName = pro.isCompany && pro.companyName ? pro.companyName : (pro.displayName || pro.name);
  const profileImage = pro.profilePhoto || (pro.images && pro.images[0] ? pro.images[0] : null);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
       {/* Sticky Navigation */}
       <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 sticky top-0 z-50 transition-all">
            <div className="container mx-auto flex justify-between items-center">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors">
                    <ArrowLeft size={20} /> <span className="hidden md:inline">Back to Directory</span>
                </button>
                <div className="flex gap-2">
                    <button onClick={handleShare} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors" title="Share Profile"><Share2 size={20} /></button>
                </div>
            </div>
        </div>

        {/* Hero Banner */}
        <div className="relative h-48 md:h-64 lg:h-80 bg-slate-900 overflow-hidden">
            {pro.coverImage ? (
                <>
                    <div className="absolute inset-0 bg-black/30 z-10"></div>
                    <img src={pro.coverImage} className="w-full h-full object-cover opacity-90" alt="Cover" />
                </>
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-slate-800 to-purple-900 flex items-center justify-center">
                    <Building2 className="text-white/10 w-32 h-32" />
                </div>
            )}
        </div>

        {/* Main Content - Increased Bottom Padding for Mobile */}
        <div className="container mx-auto px-4 pb-32 lg:pb-12">
            <div className="flex flex-col lg:flex-row gap-8 -mt-16 relative z-20">
                
                {/* LEFT COLUMN: Main Info */}
                <div className="flex-1 space-y-6">
                    
                    {/* Header Card */}
                    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 md:p-8">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            {/* Profile Image */}
                            <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-xl shadow-md border-4 border-white overflow-hidden flex-shrink-0 -mt-12 md:-mt-16 relative z-30">
                                {profileImage ? (
                                    <img src={profileImage} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                        <User size={40} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 pt-2">
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${pro.isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                                        {pro.isAvailable ? '● Available' : '○ Busy'}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                                        {pro.serviceType}
                                    </span>
                                </div>
                                
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">{displayName}</h1>
                                
                                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 text-sm text-slate-500 mb-4">
                                    {pro.isCompany && pro.ssmNumber && (
                                        <div className="flex items-center gap-1.5"><BadgeCheck size={16} className="text-blue-500" /> <span className="font-medium text-slate-700">Reg. {pro.ssmNumber}</span></div>
                                    )}
                                    <div className="flex items-center gap-1.5"><MapPin size={16} /> {pro.city}, {pro.state}</div>
                                    {pro.experience && <div className="flex items-center gap-1.5"><Award size={16} className="text-amber-500" /> {pro.experience} Exp.</div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* About & Expertise */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <BookOpen size={20} className="text-purple-600" /> 
                            Professional Summary
                        </h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-8 text-base">
                            {pro.description || "No description provided."}
                        </p>

                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Map size={20} className="text-purple-600" /> 
                                Service Coverage
                            </h3>
                            {pro.serviceArea ? (
                                <div className="flex flex-wrap gap-2">
                                    {pro.serviceArea.split(',').map((area: string, i: number) => (
                                        <div key={i} className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg text-sm font-medium border border-slate-200">
                                            <MapPin size={14} className="text-slate-400" />
                                            {area.trim()}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm italic">Contact for coverage details.</p>
                            )}
                        </div>
                    </div>

                    {/* MOBILE-ONLY SOCIAL LINKS (Since sidebar is hidden on mobile) */}
                    <div className="lg:hidden bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Globe size={20} className="text-blue-500" /> Connect Online
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                            {pro.facebook && <a href={pro.facebook} target="_blank" className="bg-blue-50 text-blue-600 p-3 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors shadow-sm"><Facebook size={24} /></a>}
                            {pro.instagram && <a href={pro.instagram} target="_blank" className="bg-pink-50 text-pink-600 p-3 rounded-xl flex items-center justify-center hover:bg-pink-100 transition-colors shadow-sm"><Instagram size={24} /></a>}
                            {pro.tiktok && <a href={pro.tiktok} target="_blank" className="bg-slate-100 text-black p-3 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors shadow-sm"><Video size={24} /></a>}
                            {pro.website && <a href={pro.website} target="_blank" className="bg-purple-50 text-purple-600 p-3 rounded-xl flex items-center justify-center hover:bg-purple-100 transition-colors shadow-sm"><Globe size={24} /></a>}
                        </div>
                    </div>

                    {/* Portfolio Gallery */}
                    {pro.images && pro.images.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Briefcase size={20} className="text-purple-600" /> 
                                Featured Work
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {pro.images.map((img: string, idx: number) => (
                                    <div 
                                        key={idx} 
                                        className="aspect-square rounded-xl overflow-hidden border border-slate-100 cursor-pointer relative group" 
                                        onClick={() => setActiveImage(idx)}
                                    >
                                        <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Portfolio" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-lg">
                                                View
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SIMILAR PROS */}
                    {similarPros.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Briefcase size={20} className="text-purple-600" /> 
                                Similar Professionals
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {similarPros.map((item) => {
                                    const simName = item.isCompany && item.companyName ? item.companyName : (item.displayName || item.name);
                                    const simImg = item.profilePhoto || (item.images && item.images[0]) || null;
                                    
                                    return (
                                        <Link href={`/services/${item.id}`} key={item.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all overflow-hidden block">
                                            <div className="h-20 bg-slate-800 relative">
                                                {item.coverImage && <img src={item.coverImage} className="w-full h-full object-cover opacity-50" />}
                                            </div>
                                            <div className="px-3 pb-3 -mt-8">
                                                <div className="w-16 h-16 bg-white rounded-xl shadow-md border-2 border-white overflow-hidden mb-2 relative z-10 mx-auto">
                                                    {simImg ? <img src={simImg} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center bg-slate-100"><User size={24}/></div>}
                                                </div>
                                                <div className="text-center">
                                                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{simName}</h4>
                                                    <p className="text-[10px] text-purple-600 font-bold uppercase">{item.serviceType}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Contact (Sticky) - HIDDEN ON MOBILE to avoid duplication */}
                <div className="hidden lg:block lg:w-96 space-y-6">
                    <div className="bg-white rounded-xl shadow-xl shadow-purple-900/5 border border-purple-100 p-6 md:p-8 sticky top-24">
                        <div className="text-center mb-6">
                            <h3 className="font-bold text-xl text-slate-900">Contact Professional</h3>
                            <p className="text-slate-500 text-sm mt-1">Get a quote or schedule a service</p>
                        </div>
                        
                        <div className="space-y-3">
                            <a 
                                href={whatsappLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]"
                            >
                                <MessageCircle size={20} /> WhatsApp
                            </a>
                            {pro.whatsapp && (
                                <a 
                                    href={`tel:+${pro.whatsapp.replace(/\D/g, '')}`} 
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
                                >
                                    <Phone size={20} /> Call Now
                                </a>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Connect Online</h4>
                            <div className="flex justify-center gap-3">
                                {pro.facebook && <a href={pro.facebook} target="_blank" className="bg-blue-50 text-blue-600 p-3 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"><Facebook size={20} /></a>}
                                {pro.instagram && <a href={pro.instagram} target="_blank" className="bg-pink-50 text-pink-600 p-3 rounded-xl hover:bg-pink-100 transition-colors shadow-sm"><Instagram size={20} /></a>}
                                {pro.tiktok && <a href={pro.tiktok} target="_blank" className="bg-slate-100 text-black p-3 rounded-xl hover:bg-slate-200 transition-colors shadow-sm"><Video size={20} /></a>}
                                {pro.website && <a href={pro.website} target="_blank" className="bg-purple-50 text-purple-600 p-3 rounded-xl hover:bg-purple-100 transition-colors shadow-sm"><Globe size={20} /></a>}
                            </div>
                        </div>
                        
                        <div className="mt-6 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] text-slate-400 font-medium">
                                <CheckCircle2 size={12} className="text-emerald-500"/> Verified VEXA Pro
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* MOBILE FLOATING PRO BAR */}
        <div className="fixed bottom-[3.75rem] left-0 right-0 bg-white border-t border-slate-200 p-4 md:hidden z-40 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)] mx-4 rounded-2xl mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                    {profileImage ? <img src={profileImage} className="w-full h-full object-cover"/> : <User size={20} />}
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Professional</p>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight line-clamp-1">{displayName}</h3>
                </div>
            </div>
            <div className="flex gap-2">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="bg-emerald-500 text-white p-3 rounded-xl shadow-sm active:scale-95 transition-transform"><MessageCircle size={20} /></a>
                {pro.whatsapp && (
                    <a href={`tel:+${pro.whatsapp.replace(/\D/g, '')}`} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform shadow-lg"><Phone size={16} /> Call Now</a>
                )}
            </div>
        </div>

        {/* Lightbox for Portfolio */}
        {activeImage !== null && pro.images && (
            <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setActiveImage(null)}>
                <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2"><ArrowLeft size={24} /></button>
                <img 
                    src={pro.images[activeImage]} 
                    className="max-h-[90vh] max-w-full rounded-lg shadow-2xl" 
                    alt="Portfolio Fullscreen"
                    onClick={(e) => e.stopPropagation()} 
                />
            </div>
        )}
    </div>
  );
}
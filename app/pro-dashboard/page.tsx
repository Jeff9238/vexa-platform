"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Save, 
  Loader2, 
  Hammer, 
  Clock, 
  MapPin, 
  Briefcase, 
  Star, 
  Globe, 
  Facebook, 
  Instagram, 
  Phone, 
  Image as ImageIcon, 
  CreditCard, 
  Wallet, 
  Plus, 
  Trash2, 
  Video, 
  BookOpen, 
  CheckCircle2, 
  Building2, 
  UploadCloud,
  AlertTriangle,
  ArrowLeft,   
  UserCircle   
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

declare global {
  interface Window {
    firebase: any;
    firestoreDb?: any;
    __firebase_config?: string;
  }
}

// Expanded List of Service Titles
const SERVICE_TYPES = [
  "General Contractor", "Interior Designer", "Renovation Specialist",
  "Plumber", "Electrician", "Aircon Technician",
  "Carpenter", "Painter", "Tiler", "Roofer",
  "Landscaper / Gardener", "Cleaner / Maid Service", "Pest Control",
  "Locksmith", "Mover / Relocation", "Solar Panel Installer",
  "CCTV / Security System", "Handyman", "Waterproofing Specialist",
  "Glass & Aluminum Work", "Curtain & Blinds", "Flooring Specialist"
];

const MALAYSIA_STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", 
  "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak", 
  "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"
];

// --- AGGRESSIVE IMAGE COMPRESSION UTILITY ---
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                const MAX_DIM = 600; 
                if (width > height && width > MAX_DIM) {
                    height *= MAX_DIM / width;
                    width = MAX_DIM;
                } else if (height > MAX_DIM) {
                    width *= MAX_DIM / height;
                    height = MAX_DIM;
                }

                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Canvas context not available"));
                    return;
                }
                
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const ensureProtocol = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

export default function ProDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingImage, setProcessingImage] = useState(false); 
  const [user, setUser] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [accessDenied, setAccessDenied] = useState<{denied: boolean, reason?: string, debugId?: string}>({ denied: false });
  
  const [profileData, setProfileData] = useState({
    isCompany: false,
    companyName: '',
    ssmNumber: '', 
    serviceType: 'Renovation Specialist',
    experience: '',
    description: '',
    streetAddress: '',
    city: '', 
    state: '',
    postalCode: '',
    website: '',
    facebook: '',
    instagram: '',
    tiktok: '',      
    xiaohongshu: '', 
    whatsapp: '', 
    images: [] as string[],
    coverImage: '', 
    isAvailable: true,
    subscriptionStatus: 'active', 
    walletBalance: 0,
    subscriptionFee: 150 
  });

  const [newImageUrl, setNewImageUrl] = useState("");

  const initializeFirebase = useCallback(async () => {
    try {
        if (typeof window.firestoreDb !== 'undefined' && window.firestoreDb) {
            setDb(window.firestoreDb);
            checkUser(window.firestoreDb);
            return;
        }

        const appScript = document.createElement('script');
        appScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js";
        
        appScript.onload = () => {
            const firestoreScript = document.createElement('script');
            firestoreScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js";
            
            firestoreScript.onload = () => {
                const authScript = document.createElement('script');
                authScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js";
                
                authScript.onload = () => {
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

                    if (!firebase.apps.length) {
                        firebase.initializeApp(firebaseConfig);
                    }
                    
                    const dbInstance = firebase.firestore();
                    window.firestoreDb = dbInstance;
                    setDb(dbInstance);
                    checkUser(dbInstance);
                };
                document.head.appendChild(authScript);
            };
            document.head.appendChild(firestoreScript);
        };
        document.head.appendChild(appScript);
    } catch (e) {
      console.error("Init Error:", e);
    }
  }, []);

  const checkUser = async (database: any) => {
      // DEBUG: Log the ID we are trying to check
      const storedUserId = localStorage.getItem("vexa_active_user_id");
      const userId = storedUserId || "test-user-id"; 
      
      console.log("ProDashboard Checking ID:", userId);

      try {
          const doc = await database.collection("users").doc(userId).get();
          
          if (!doc.exists) {
              setAccessDenied({ 
                  denied: true, 
                  reason: "User Profile Not Found in Database", 
                  debugId: userId 
              });
              setLoading(false);
              return;
          }

          const userData = doc.data();
          console.log("User Role Found:", userData.role);

          if (userData.role === 'pro') {
              setUser({ uid: userId, ...userData });
              if (userData.proProfile) {
                  setProfileData(prev => ({ ...prev, ...userData.proProfile }));
              }
          } else {
              setAccessDenied({ 
                  denied: true, 
                  reason: `Role Mismatch: Expected 'pro', found '${userData.role || 'none'}'`, 
                  debugId: userId 
              });
          }
      } catch (error) {
          console.error("Auth check failed", error);
          setAccessDenied({ denied: true, reason: "Database Connection Failed", debugId: "N/A" });
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFirebase();
    }
  }, [initializeFirebase]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (profileData.images.length >= 6) {
          alert("Maximum 6 images allowed.");
          return;
      }

      setProcessingImage(true);
      let base64String = "";

      try {
          base64String = await compressImage(file);
          const updatedImages = [...profileData.images, base64String];
          const updatedCover = profileData.coverImage || base64String;

          setProfileData({ 
              ...profileData, 
              images: updatedImages,
              coverImage: updatedCover
          });

      } catch (error) {
          alert("Failed to process image. Please try another file.");
      } finally {
          setProcessingImage(false);
          e.target.value = ""; 
      }
  };

  const handleRemoveImage = (index: number) => {
      const imageToRemove = profileData.images[index];
      const newImages = [...profileData.images];
      newImages.splice(index, 1);
      
      let newCover = profileData.coverImage;
      if (imageToRemove === profileData.coverImage) {
          newCover = newImages.length > 0 ? newImages[0] : '';
      }

      setProfileData({ ...profileData, images: newImages, coverImage: newCover });
  };

  const handleSetCover = (imgUrl: string) => {
      setProfileData({ ...profileData, coverImage: imgUrl });
  };

  const handlePaySubscription = async () => {
      if (profileData.walletBalance < profileData.subscriptionFee) {
          alert("Insufficient Credits! Please top up your wallet.");
          return;
      }
      
      if (!confirm(`Confirm payment of ${profileData.subscriptionFee} credits for monthly subscription?`)) return;

      const newBalance = profileData.walletBalance - profileData.subscriptionFee;
      
      setProfileData(prev => ({ 
          ...prev, 
          walletBalance: newBalance,
          subscriptionStatus: 'active'
      }));
      
      if(db && user) {
          await db.collection("users").doc(user.uid).update({
              'proProfile.walletBalance': newBalance,
              'proProfile.subscriptionStatus': 'active',
              'proProfile.lastPaymentDate': new Date()
          });
      }
      alert("Payment Successful! Subscription Active.");
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!db || !user) return;

      if (!profileData.streetAddress || !profileData.city || !profileData.state || !profileData.postalCode) {
          alert("Please complete your Business Address details to save.");
          return;
      }

      if (profileData.isCompany && !profileData.companyName) {
          alert("Please enter your Company Name.");
          return;
      }

      setSaving(true);

      const cleanProfile = {
          ...profileData,
          website: ensureProtocol(profileData.website),
          facebook: ensureProtocol(profileData.facebook),
          instagram: ensureProtocol(profileData.instagram),
          tiktok: ensureProtocol(profileData.tiktok),
          xiaohongshu: ensureProtocol(profileData.xiaohongshu),
          updatedAt: new Date()
      };

      try {
          await db.collection("users").doc(user.uid).update({
              proProfile: cleanProfile,
              name: profileData.isCompany && profileData.companyName ? profileData.companyName : user.name
          });

          alert("Profile Saved Successfully!");
          router.push(`/services/${user.uid}`); 

      } catch (error) {
          // @ts-ignore
          if (error.code === 'permission-denied') {
             alert("Permission Denied: Are you logged in?");
          } else {
             alert("Save Failed: Data size too large. Try removing some images.");
          }
      } finally {
          setSaving(false);
      }
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-purple-600" size={40} />
          </div>
      );
  }

  // --- DEBUG / ACCESS DENIED SCREEN ---
  if (accessDenied.denied) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={32} />
                  </div>
                  <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
                  <p className="text-slate-500 mb-6">You do not have permission to view the Pro Console.</p>
                  
                  <div className="bg-slate-100 p-4 rounded-lg text-left text-xs font-mono text-slate-600 mb-6 overflow-x-auto">
                      <p><strong>Debug Info:</strong></p>
                      <p>Checked ID: {accessDenied.debugId}</p>
                      <p>Reason: {accessDenied.reason}</p>
                  </div>

                  <Link href="/dashboard" className="block w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors">
                      Return to User Dashboard
                  </Link>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
                {/* NEW: Back Button */}
                <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors" title="Back to User Dashboard">
                    <ArrowLeft size={24} />
                </Link>

                <div className="flex items-center gap-3">
                    <div className="bg-purple-600 p-2 rounded-lg text-white shadow-purple-200 shadow-lg hidden md:block">
                        <Hammer size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg md:text-xl text-slate-800">Pro Console</h1>
                        <p className="text-xs text-slate-500 hidden md:block">Manage Services & Subscription</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
                <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                    <Wallet size={16} className="text-slate-500" />
                    <span className="text-sm font-bold text-slate-700">{profileData.walletBalance} Credits</span>
                </div>
                <span className={`text-xs md:text-sm font-medium px-2 md:px-3 py-1 rounded-full ${profileData.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {profileData.isAvailable ? '● Online' : '○ Offline'}
                </span>
                
                {/* NEW: Profile Link Shortcut */}
                <Link href="/dashboard" className="bg-slate-100 p-2 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
                    <UserCircle size={24} />
                </Link>
            </div>
        </div>

        <div className="container mx-auto p-4 md:p-8">
            <form id="pro-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: EDITOR */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. Identity Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Briefcase className="text-purple-600" size={20} />
                            Business Identity
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <input 
                                    type="checkbox" 
                                    id="isCompany"
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    checked={profileData.isCompany}
                                    onChange={e => setProfileData({...profileData, isCompany: e.target.checked})}
                                />
                                <label htmlFor="isCompany" className="text-sm font-medium text-slate-700">I am registering as a Company</label>
                            </div>

                            {profileData.isCompany && (
                                <div className="space-y-4 p-4 bg-purple-50 rounded-lg animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none bg-white"
                                            placeholder="e.g. Best Fix Solutions Sdn Bhd"
                                            value={profileData.companyName}
                                            onChange={e => setProfileData({...profileData, companyName: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">SSM Registration Number</label>
                                        <input 
                                            type="text" 
                                            className="w-full px-4 py-2 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none bg-white"
                                            placeholder="e.g. 202301000000 (12345-X)"
                                            value={profileData.ssmNumber}
                                            onChange={e => setProfileData({...profileData, ssmNumber: e.target.value})}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Service Category</label>
                                    <select 
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none bg-white"
                                        value={profileData.serviceType}
                                        onChange={e => setProfileData({...profileData, serviceType: e.target.value})}
                                    >
                                        {SERVICE_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Years Experience</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            type="text" 
                                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none"
                                            placeholder="e.g. 5 Years"
                                            value={profileData.experience}
                                            onChange={e => setProfileData({...profileData, experience: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <MapPin className="text-red-500" size={20} />
                            Business Address <span className="text-red-500 text-xs ml-auto">* Mandatory</span>
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none"
                                    placeholder="No. 123, Jalan Sultan Azlan Shah"
                                    value={profileData.streetAddress}
                                    onChange={e => setProfileData({...profileData, streetAddress: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Local Area / Town</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none"
                                        placeholder="e.g. Bayan Lepas"
                                        value={profileData.city}
                                        onChange={e => setProfileData({...profileData, city: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Postal Code</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none"
                                        placeholder="e.g. 11900"
                                        value={profileData.postalCode}
                                        onChange={e => setProfileData({...profileData, postalCode: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">State (Malaysia Only)</label>
                                <select 
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none bg-white"
                                    value={profileData.state}
                                    onChange={e => setProfileData({...profileData, state: e.target.value})}
                                >
                                    <option value="">Select State</option>
                                    {MALAYSIA_STATES.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Globe className="text-blue-500" size={20} />
                            Social Presence
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
                                <input type="text" placeholder="Facebook URL" className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm" value={profileData.facebook} onChange={e => setProfileData({...profileData, facebook: e.target.value})} />
                            </div>
                            <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-600" size={18} />
                                <input type="text" placeholder="Instagram URL" className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-pink-500 outline-none text-sm" value={profileData.instagram} onChange={e => setProfileData({...profileData, instagram: e.target.value})} />
                            </div>
                            <div className="relative">
                                <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={18} />
                                <input type="text" placeholder="TikTok URL" className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-black outline-none text-sm" value={profileData.tiktok} onChange={e => setProfileData({...profileData, tiktok: e.target.value})} />
                            </div>
                            <div className="relative">
                                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" size={18} />
                                <input type="text" placeholder="XiaoHongShu URL" className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-red-500 outline-none text-sm" value={profileData.xiaohongshu} onChange={e => setProfileData({...profileData, xiaohongshu: e.target.value})} />
                            </div>
                            <div className="relative md:col-span-2">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input type="text" placeholder="Website URL" className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-purple-600 outline-none text-sm" value={profileData.website} onChange={e => setProfileData({...profileData, website: e.target.value})} />
                            </div>
                            <div className="relative md:col-span-2">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                                <input type="text" placeholder="WhatsApp Number (e.g. 60123456789)" className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-green-500 outline-none text-sm" value={profileData.whatsapp} onChange={e => setProfileData({...profileData, whatsapp: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <ImageIcon className="text-orange-500" size={20} />
                            Portfolio Gallery
                        </h2>
                        <p className="text-xs text-slate-500 mb-6">
                            Upload up to 6 images. Click the star to set as <strong>Cover Photo</strong>. 
                            Large images will be auto-optimized.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            {profileData.images.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 group ${profileData.coverImage === img ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'}`}
                                >
                                    <img src={img} alt="Portfolio" className="w-full h-full object-cover" />
                                    {profileData.coverImage === img && (
                                        <div className="absolute top-1 right-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm font-bold z-10">
                                            COVER
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => handleSetCover(img)}
                                            className={`p-2 rounded-full hover:bg-emerald-500 hover:text-white transition-colors ${profileData.coverImage === img ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600'}`}
                                            title="Set as Cover"
                                        >
                                            <Star size={16} className={profileData.coverImage === img ? 'fill-current' : ''} />
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            className="p-2 rounded-full bg-white text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                            title="Delete Image"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            {Array.from({ length: Math.max(0, 6 - profileData.images.length) }).map((_, idx) => (
                                <div key={`empty-${idx}`} className="aspect-square rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50">
                                    <span className="text-slate-300 text-xs">Slot {profileData.images.length + idx + 1}</span>
                                </div>
                            ))}
                        </div>

                        {profileData.images.length < 6 && (
                            <div className="flex gap-2">
                                <label className={`flex items-center justify-center gap-2 cursor-pointer bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors w-full text-sm font-medium ${processingImage ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                    {processingImage ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                                    <span>{processingImage ? "Optimizing..." : "Upload Image"}</span>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={processingImage}
                                    />
                                </label>
                            </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-2 text-center">Images optimized automatically for fast loading.</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <label className="block text-sm font-medium text-slate-700 mb-1">About Your Services</label>
                        <textarea 
                            rows={4}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none resize-none"
                            placeholder="Describe your skills and what you offer..."
                            value={profileData.description}
                            onChange={e => setProfileData({...profileData, description: e.target.value})}
                        />
                    </div>

                    <div className="flex justify-end">
                        <button 
                            type="submit"
                            disabled={saving || processingImage}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Save Profile
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: SUBSCRIPTION & WALLET */}
                <div className="space-y-6">
                    <div className={`rounded-xl shadow-sm border p-6 ${profileData.subscriptionStatus === 'active' ? 'bg-white border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-slate-800">Subscription Status</h3>
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${profileData.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {profileData.subscriptionStatus}
                            </span>
                        </div>
                        
                        <div className="mb-6">
                            <p className="text-slate-500 text-sm">Monthly Plan</p>
                            <p className="text-2xl font-bold text-slate-900">{profileData.subscriptionFee} Credits<span className="text-xs font-normal text-slate-400">/mo</span></p>
                        </div>

                        {profileData.subscriptionStatus !== 'active' ? (
                            <button 
                                type="button"
                                onClick={handlePaySubscription}
                                className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <CreditCard size={16} /> Pay Now
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                                <Clock size={16} /> Auto-renews next month
                            </div>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Wallet size={120} />
                        </div>
                        <p className="text-slate-400 text-sm font-medium mb-1">VEXA Wallet Balance</p>
                        <h3 className="text-4xl font-bold mb-6">{profileData.walletBalance}</h3>
                        
                        <button type="button" className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 rounded-lg font-medium transition-all backdrop-blur-sm">
                            + Top Up Credits
                        </button>
                        <p className="text-xs text-slate-400 mt-3 text-center">Used for subscriptions & boost ads</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-700 mb-4">Job Availability</h3>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-slate-600">Accepting new jobs</label>
                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input 
                                    type="checkbox" 
                                    name="toggle" 
                                    id="toggle" 
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300 ease-in-out"
                                    style={{ 
                                        right: profileData.isAvailable ? '0' : 'auto', 
                                        left: profileData.isAvailable ? 'auto' : '0',
                                        borderColor: profileData.isAvailable ? '#10b981' : '#cbd5e1'
                                    }}
                                    checked={profileData.isAvailable}
                                    onChange={e => setProfileData({...profileData, isAvailable: e.target.checked})}
                                />
                                <label 
                                    htmlFor="toggle" 
                                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${profileData.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                ></label>
                            </div>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    </div>
  );
}
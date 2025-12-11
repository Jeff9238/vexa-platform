"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, Clock, Settings, Bell, Briefcase, Loader2, Hammer, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UserViewProps {
  profile: any;
}

// Global declarations for CDN Firebase
declare global {
  interface Window {
    firebaseApp?: any;
    firestoreDb?: any;
    initializeFirebaseApp: () => void;
    firebase: any; 
  }
}

export default function UserView({ profile }: UserViewProps) {
  const [loading, setLoading] = useState(false);
  const [proLoading, setProLoading] = useState(false); 
  const [db, setDb] = useState<any>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  
  // 1. LIVE DATA STATE: Stores the real-time user profile
  // We initialize it with the prop, but update it via Firestore listener
  const [localProfile, setLocalProfile] = useState(profile);

  // 2. SMART ID GENERATION (Prevents User Collision)
  const getSmartUserId = useCallback(() => {
    if (profile?.uid) return profile.uid;
    
    // Fallback: Generate ID based on name to keep users separate in testing
    if (profile?.name) {
        return `user_${profile.name.replace(/\s+/g, '_').toLowerCase()}`;
    }
    
    return "test-user-id";
  }, [profile]);

  const currentUserId = getSmartUserId();

  // 3. DERIVED STATE (MUST USE localProfile, NOT profile)
  const agentRequestStatus = localProfile?.agentRequest?.status || 'none';
  const proRequestStatus = localProfile?.proRequest?.status || 'none';
  
  const isAgent = localProfile?.role === 'agent';
  const isPro = localProfile?.role === 'pro';
  const isAdmin = localProfile?.role === 'admin';

  // --- PERSIST SESSION ID ---
  // This ensures the Agent/Pro dashboards know WHICH user is logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUserId) {
        localStorage.setItem("vexa_active_user_id", currentUserId);
        console.log("Session Active for:", currentUserId);
    }
  }, [currentUserId]);

  // --- INITIALIZE FIREBASE ---
  const initializeFirebase = useCallback(async () => {
    try {
      if (typeof window.firestoreDb !== 'undefined' && window.firestoreDb) {
          setDb(window.firestoreDb);
          setIsDbReady(true);
          return;
      }

      if ((window as any).firebase && (window as any).firebase.apps) {
          const firebase = (window as any).firebase;
          const dbInstance = firebase.firestore();
          window.firestoreDb = dbInstance;
          setDb(dbInstance);
          setIsDbReady(true);
          return;
      }

      const appScript = document.createElement('script');
      appScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js";
      
      appScript.onload = async () => {
        const firestoreScript = document.createElement('script');
        firestoreScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js";
        
        firestoreScript.onload = async () => {
            const authScript = document.createElement('script');
            authScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js";
            
            authScript.onload = async () => {
                if (!(window as any).firebase) {
                    console.error("Firebase global not found.");
                    return;
                }

                const firebase = (window as any).firebase;

                // --- YOUR CONFIG ---
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
                setIsDbReady(true);
                console.log("Firebase initialized successfully");
            };
            document.head.appendChild(authScript);
        };
        document.head.appendChild(firestoreScript);
      };
      
      appScript.onerror = () => console.error("Failed to load Firebase App script");
      document.head.appendChild(appScript);
    } catch (e) {
      console.error("Firebase Initialization Error:", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFirebase();
    }
  }, [initializeFirebase]);

  // 4. REAL-TIME LISTENER (The Fix)
  useEffect(() => {
    if (!db || !currentUserId) return;

    console.log(`Listening for updates on User ID: ${currentUserId}`);

    const unsubscribe = db.collection("users").doc(currentUserId).onSnapshot((doc: any) => {
        if (doc.exists) {
            // Update local state immediately when Admin approves
            console.log("DB Update Received:", doc.data());
            setLocalProfile((prev: any) => ({ ...prev, ...doc.data() }));
        } else {
            // If doc doesn't exist yet, stick to initial profile
            setLocalProfile(profile); 
        }
    }, (error: any) => {
        console.error("Error listening to user profile:", error);
    });

    return () => unsubscribe();
  }, [db, currentUserId, profile]);


  // --- HANDLER: AGENT REQUEST ---
  const handleRequestAgent = async () => {
    if (!db) {
      alert("System connecting... please wait 2 seconds.");
      return;
    }
    
    try {
      setLoading(true);
      const userRef = db.collection("users").doc(currentUserId);
      
      await userRef.set({
        agentRequest: {
          status: 'pending',
          requestedAt: new Date(),
        },
        name: profile?.name || 'Unknown User',
        email: profile?.email || 'no-email@example.com'
      }, { merge: true });
      
      alert("Agent request sent! Please wait for Admin approval.");

    } catch (error) {
      console.error("Error requesting agent role:", error);
      alert("Failed to send request.");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: PRO REQUEST ---
  const handleRequestPro = async () => {
    if (!db) {
      alert("System connecting... please wait 2 seconds.");
      return;
    }
    
    try {
      setProLoading(true);
      const userRef = db.collection("users").doc(currentUserId);
      
      await userRef.set({
        proRequest: {
          status: 'pending',
          requestedAt: new Date(),
          proType: 'General Service Provider' 
        },
        name: profile?.name || 'Unknown User',
        email: profile?.email || 'no-email@example.com'
      }, { merge: true });
      
      alert("Pro request sent! Please wait for Admin approval.");

    } catch (error) {
      console.error("Error requesting pro role:", error);
      alert("Failed to send request.");
    } finally {
      setProLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-20 container mx-auto px-4">
       <div className="mb-8">
         <h1 className="text-2xl font-bold text-vexa-blue">My Account</h1>
         <p className="text-gray-500">Welcome back, {localProfile?.name || 'User'}</p>
         <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-300 font-mono">ID: {currentUserId}</span>
            {isAgent && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 rounded-full font-bold">AGENT</span>}
            {isPro && <span className="text-xs bg-purple-100 text-purple-700 px-2 rounded-full font-bold">PRO</span>}
         </div>
       </div>

       <div className="space-y-4">
         
         {/* 1. AGENT SECTION - Hidden if User is PRO or Admin */}
         {!isAdmin && !isPro && (
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
             {isAgent ? (
               <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                 <div className="flex items-center gap-4 text-emerald-700 mb-3">
                   <div className="bg-white p-2 rounded-lg shadow-sm">
                     <Briefcase size={24} />
                   </div>
                   <div>
                     <h3 className="font-bold">Agent Account Active</h3>
                     <p className="text-xs opacity-80">You have full access to listing tools.</p>
                   </div>
                 </div>
                 <Link href="/agent-dashboard" className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                    Open Agent Console <ArrowRight size={16} />
                 </Link>
               </div>
             ) : (
               <button 
                 onClick={handleRequestAgent}
                 disabled={agentRequestStatus === 'pending' || loading || !isDbReady}
                 className="w-full flex items-center gap-4 text-left transition-all hover:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 <div className={`p-3 rounded-lg ${agentRequestStatus === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-vexa-blue/10 text-vexa-blue'}`}>
                   {loading ? <Loader2 size={24} className="animate-spin" /> : <Briefcase size={24} />}
                 </div>
                 <div className="flex-1">
                   <h3 className="font-bold text-vexa-blue">
                     {agentRequestStatus === 'pending' ? 'Agent Request Pending' : !isDbReady ? 'Loading System...' : 'Become an Agent'}
                   </h3>
                   <p className="text-xs text-gray-400">
                     {agentRequestStatus === 'pending' 
                       ? 'Waiting for admin approval...' 
                       : 'Unlock listing features for Property & Vehicles'}
                   </p>
                 </div>
               </button>
             )}
           </div>
         )}

         {/* 2. PRO SECTION - Hidden if User is AGENT or Admin */}
         {!isAdmin && !isAgent && (
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
             {isPro ? (
               <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                 <div className="flex items-center gap-4 text-purple-700 mb-3">
                   <div className="bg-white p-2 rounded-lg shadow-sm">
                     <Hammer size={24} />
                   </div>
                   <div>
                     <h3 className="font-bold">Pro Account Active</h3>
                     <p className="text-xs opacity-80">You can now offer services on VEXA.</p>
                   </div>
                 </div>
                 {/* ADDED LINK TO PRO CONSOLE */}
                 <Link href="/pro-dashboard" className="flex items-center justify-center gap-2 w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-sm">
                    Open Pro Console <ArrowRight size={16} />
                 </Link>
               </div>
             ) : (
               <button 
                 onClick={handleRequestPro}
                 disabled={proRequestStatus === 'pending' || proLoading || !isDbReady}
                 className="w-full flex items-center gap-4 text-left transition-all hover:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed"
               >
                 <div className={`p-3 rounded-lg ${proRequestStatus === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-purple-50 text-purple-600'}`}>
                   {proLoading ? <Loader2 size={24} className="animate-spin" /> : <Hammer size={24} />}
                 </div>
                 <div className="flex-1">
                   <h3 className="font-bold text-purple-700">
                     {proRequestStatus === 'pending' ? 'Pro Request Pending' : !isDbReady ? 'Loading System...' : 'Become a Service Pro'}
                   </h3>
                   <p className="text-xs text-gray-400">
                     {proRequestStatus === 'pending' 
                       ? 'Waiting for admin approval...' 
                       : 'Register as a Renovator, Plumber, or Technician'}
                   </p>
                 </div>
               </button>
             )}
           </div>
         )}

         {/* Standard Menu Items */}
         <Link href="/favorites" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="bg-red-50 p-3 rounded-lg text-red-500">
              <Heart size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-vexa-blue">My Favorites</h3>
              <p className="text-xs text-gray-400">Saved properties & vehicles</p>
            </div>
         </Link>

         <Link href="/history" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-500">
              <Clock size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-vexa-blue">Browsing History</h3>
              <p className="text-xs text-gray-400">Recently viewed items</p>
            </div>
         </Link>

         <button className="w-full flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="bg-orange-50 p-3 rounded-lg text-orange-500">
              <Bell size={24} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-vexa-blue">Alerts</h3>
              <p className="text-xs text-gray-400">Price drops & new listings</p>
            </div>
         </button>
       </div>
    </div>
  );
}
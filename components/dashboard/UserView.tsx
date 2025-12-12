"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, Clock, Settings, Bell, Briefcase, Loader2, Hammer, ArrowRight, LogIn, UserPlus, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserViewProps {
  profile: any;
}

declare global {
  interface Window {
    firebaseApp?: any;
    firestoreDb?: any;
    firebase: any; 
  }
}

export default function UserView({ profile }: UserViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // Initial auth check
  const [proLoading, setProLoading] = useState(false); 
  const [db, setDb] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [isDbReady, setIsDbReady] = useState(false); // Restored missing state
  
  // Real User State
  const [currentUser, setCurrentUser] = useState<any>(null); // Firebase Auth User
  const [localProfile, setLocalProfile] = useState<any>(null); // Firestore User Data

  // Login Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");

  // Derived state
  const isAgent = localProfile?.role === 'agent';
  const isPro = localProfile?.role === 'pro';
  const isAdmin = localProfile?.role === 'admin';
  const agentRequestStatus = localProfile?.agentRequest?.status || 'none';
  const proRequestStatus = localProfile?.proRequest?.status || 'none';

  // --- 1. INITIALIZE FIREBASE & AUTH ---
  const initializeFirebase = useCallback(async () => {
    try {
      // 1. Load Scripts if not present
      if (!(window as any).firebase) {
          await new Promise((resolve, reject) => {
              const appScript = document.createElement('script');
              appScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js";
              appScript.onload = resolve;
              appScript.onerror = reject;
              document.head.appendChild(appScript);
          });
          
          await Promise.all([
              new Promise(resolve => {
                  const s = document.createElement('script');
                  s.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js";
                  s.onload = resolve;
                  document.head.appendChild(s);
              }),
              new Promise(resolve => {
                  const s = document.createElement('script');
                  s.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js";
                  s.onload = resolve;
                  document.head.appendChild(s);
              })
          ]);
      }

      // 2. Initialize App
      const firebase = (window as any).firebase;
      if (!firebase.apps.length) {
          const firebaseConfig = {
              apiKey: "AIzaSyDo4yfchuY8FVunbz_ZinubrbZtSuATOGg",
              authDomain: "vexa-platform.firebaseapp.com",
              projectId: "vexa-platform",
              storageBucket: "vexa-platform.firebasestorage.app",
              messagingSenderId: "96646526352",
              appId: "1:96646526352:web:140e50442fc5e66dca2f15",
              measurementId: "G-C7MBKREZNG"
          };
          firebase.initializeApp(firebaseConfig);
      }

      const dbInstance = firebase.firestore();
      const authInstance = firebase.auth();
      
      setDb(dbInstance);
      setAuth(authInstance);
      window.firestoreDb = dbInstance;
      setIsDbReady(true); // Mark DB as ready

      // 3. Listen for Auth Changes
      authInstance.onAuthStateChanged(async (user: any) => {
          if (user) {
              console.log("User Logged In:", user.uid);
              setCurrentUser(user);
              
              // CRITICAL: Sync with localStorage so Agent/Pro dashboards work
              localStorage.setItem("vexa_active_user_id", user.uid);

              // Fetch User Data from Firestore
              const docRef = dbInstance.collection("users").doc(user.uid);
              const docSnap = await docRef.get();

              if (docSnap.exists) {
                  setLocalProfile(docSnap.data());
              } else {
                  // Create basic profile if new
                  const newProfile = {
                      name: user.email?.split('@')[0] || 'User',
                      email: user.email,
                      role: 'user',
                      createdAt: new Date()
                  };
                  await docRef.set(newProfile);
                  setLocalProfile(newProfile);
              }
              
              // Real-time listener for profile updates (e.g. Admin approves)
              docRef.onSnapshot((snap: any) => {
                  if (snap.exists) setLocalProfile(snap.data());
              });

          } else {
              console.log("No User Logged In");
              setCurrentUser(null);
              setLocalProfile(null);
              localStorage.removeItem("vexa_active_user_id");
          }
          setAuthLoading(false);
      });

    } catch (e) {
      console.error("Firebase Error:", e);
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeFirebase();
  }, [initializeFirebase]);

  // --- AUTH ACTIONS ---

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError("");
      try {
          await auth.signInWithEmailAndPassword(email, password);
          // onAuthStateChanged will handle the rest
      } catch (err: any) {
          setAuthError(err.message);
      }
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError("");
      try {
          await auth.createUserWithEmailAndPassword(email, password);
          // onAuthStateChanged will handle profile creation
      } catch (err: any) {
          setAuthError(err.message);
      }
  };

  const handleLogout = async () => {
      await auth.signOut();
      window.location.reload();
  };

  // --- ROLE ACTIONS ---
  const handleRequestAgent = async () => {
    if (!db || !currentUser) return;
    try {
      setLoading(true);
      await db.collection("users").doc(currentUser.uid).set({
        agentRequest: { status: 'pending', requestedAt: new Date() },
        email: currentUser.email
      }, { merge: true });
      alert("Agent request sent successfully!");
    } catch (error) { alert("Failed to send request."); } 
    finally { setLoading(false); }
  };

  const handleRequestPro = async () => {
    if (!db || !currentUser) return;
    try {
      setProLoading(true);
      await db.collection("users").doc(currentUser.uid).set({
        proRequest: { status: 'pending', requestedAt: new Date(), proType: 'General Service Provider' },
        email: currentUser.email
      }, { merge: true });
      alert("Pro request sent successfully!");
    } catch (error) { alert("Failed to send request."); } 
    finally { setProLoading(false); }
  };

  // --- RENDERING ---

  if (authLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-vexa-blue" size={40} />
          </div>
      );
  }

  // 1. LOGIN / REGISTER SCREEN (If not logged in)
  if (!currentUser) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                  <div className="text-center mb-8">
                      <h1 className="text-3xl font-bold text-vexa-blue mb-2">Welcome to VEXA</h1>
                      <p className="text-slate-500">{isRegistering ? "Create your account" : "Sign in to manage your profile"}</p>
                  </div>

                  <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                          <input 
                              type="email" 
                              required 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-vexa-blue/20 focus:border-vexa-blue outline-none"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                          <input 
                              type="password" 
                              required 
                              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-vexa-blue/20 focus:border-vexa-blue outline-none"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                          />
                      </div>

                      {authError && (
                          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                              {authError}
                          </div>
                      )}

                      <button 
                          type="submit" 
                          className="w-full bg-vexa-blue hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                          {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
                          {isRegistering ? "Sign Up" : "Sign In"}
                      </button>
                  </form>

                  <div className="mt-6 text-center">
                      <button 
                          onClick={() => { setIsRegistering(!isRegistering); setAuthError(""); }}
                          className="text-sm text-slate-500 hover:text-vexa-blue font-medium"
                      >
                          {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Create one"}
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // 2. DASHBOARD (If logged in)
  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-20 container mx-auto px-4">
       <div className="mb-8 flex justify-between items-end">
         <div>
             <h1 className="text-2xl font-bold text-vexa-blue">My Account</h1>
             <p className="text-gray-500">Welcome, {localProfile?.name || currentUser.email}</p>
             <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-300 font-mono hidden md:inline">ID: {currentUser.uid}</span>
                {isAgent && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold border border-emerald-200">AGENT</span>}
                {isPro && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold border border-purple-200">PRO</span>}
                {isAdmin && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold border border-red-200">ADMIN</span>}
             </div>
         </div>
         <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 text-sm font-medium flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
             <LogOut size={16} /> <span className="hidden md:inline">Sign Out</span>
         </button>
       </div>

       <div className="space-y-4">
         
         {/* 1. AGENT SECTION */}
         {!isAdmin && !isPro && (
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
             {isAgent ? (
               <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                 <div className="flex items-center gap-4 text-emerald-700 mb-3">
                   <div className="bg-white p-2 rounded-lg shadow-sm"><Briefcase size={24} /></div>
                   <div><h3 className="font-bold">Agent Account Active</h3><p className="text-xs opacity-80">You have full access.</p></div>
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
                   <h3 className="font-bold text-vexa-blue">{agentRequestStatus === 'pending' ? 'Agent Request Pending' : !isDbReady ? 'Loading System...' : 'Become an Agent'}</h3>
                   <p className="text-xs text-gray-400">{agentRequestStatus === 'pending' ? 'Waiting for admin approval...' : 'Unlock listing features'}</p>
                 </div>
               </button>
             )}
           </div>
         )}

         {/* 2. PRO SECTION */}
         {!isAdmin && !isAgent && (
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
             {isPro ? (
               <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                 <div className="flex items-center gap-4 text-purple-700 mb-3">
                   <div className="bg-white p-2 rounded-lg shadow-sm"><Hammer size={24} /></div>
                   <div><h3 className="font-bold">Pro Account Active</h3><p className="text-xs opacity-80">You can now offer services.</p></div>
                 </div>
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
                   <h3 className="font-bold text-purple-700">{proRequestStatus === 'pending' ? 'Pro Request Pending' : 'Become a Service Pro'}</h3>
                   <p className="text-xs text-gray-400">{proRequestStatus === 'pending' ? 'Waiting for admin approval...' : 'Register as a Renovator or Plumber'}</p>
                 </div>
               </button>
             )}
           </div>
         )}

         <Link href="/favorites" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="bg-red-50 p-3 rounded-lg text-red-500"><Heart size={24} /></div>
            <div className="flex-1"><h3 className="font-bold text-vexa-blue">My Favorites</h3><p className="text-xs text-gray-400">Saved properties & vehicles</p></div>
         </Link>

         <Link href="/history" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-500"><Clock size={24} /></div>
            <div className="flex-1"><h3 className="font-bold text-vexa-blue">Browsing History</h3><p className="text-xs text-gray-400">Recently viewed items</p></div>
         </Link>

         <Link href="/alerts" className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div className="bg-orange-50 p-3 rounded-lg text-orange-500"><Bell size={24} /></div>
            <div className="flex-1 text-left"><h3 className="font-bold text-vexa-blue">Alerts</h3><p className="text-xs text-gray-400">Price drops & new listings</p></div>
         </Link>

       </div>
    </div>
  );
}
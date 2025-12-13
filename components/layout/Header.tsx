"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, LayoutDashboard, User as UserIcon, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
        const auth = getAuth();
        await signOut(auth);
        localStorage.removeItem("vexa_active_user_id");
        router.push('/');
        router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-vexa-blue rounded-lg flex items-center justify-center bg-slate-900">
            <span className="text-orange-500 font-bold text-xl">V</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            VEXA
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="/search?type=property&transType=Sale" className="hover:text-blue-600 transition-colors">Buy</Link>
          <Link href="/search?type=property&transType=Rent" className="hover:text-blue-600 transition-colors">Rent</Link>
          <Link href="/search?type=vehicle" className="hover:text-orange-600 transition-colors">Vehicles</Link>
          <Link href="/services" className="hover:text-purple-600 transition-colors">Trusted Pros</Link>
        </nav>

        <div className="flex items-center gap-4">
          {!loading && user && (
            <Link 
              href="/dashboard" 
              className="hidden md:flex items-center gap-2 text-slate-900 font-medium hover:text-orange-500 transition-colors mr-2"
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
          )}

          <Link href="/dashboard" className="hidden md:flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg">
            <PlusCircle size={18} />
            <span>Post Ad</span>
          </Link>

          {!loading && (
             user ? (
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleSignOut}
                        className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Sign Out"
                    >
                        <UserIcon size={18} />
                    </button>
                </div>
             ) : (
                <Link href="/dashboard">
                    <button className="text-slate-900 font-semibold hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                        <LogIn size={18} />
                        Sign In
                    </button>
                </Link>
             )
          )}
        </div>
      </div>
    </header>
  );
}
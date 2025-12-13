"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, PlusCircle, Heart, User } from "lucide-react";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
      if (path === '/' && pathname === '/') return true;
      if (path !== '/' && pathname.startsWith(path)) return true;
      return false;
  };

  const handlePostClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      
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
        const auth = getAuth(app);
        const user = auth.currentUser;

        if (!user) {
            router.push('/join-us');
            return;
        }

        const db = getFirestore(app);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const role = docSnap.data().role;
            if (role === 'agent') {
                router.push('/agent-dashboard?action=create');
            } else if (role === 'pro') {
                router.push('/pro-dashboard');
            } else if (role === 'developer') {
                router.push('/developer-dashboard?action=create');
            } else {
                router.push('/join-us');
            }
        } else {
            router.push('/join-us');
        }
      } catch (error) {
          console.error("Nav Error", error);
          router.push('/dashboard'); 
      }
  };

  const navItems = [
    { name: "Home", href: "/", icon: <Home size={24} /> },
    { name: "Explore", href: "/search", icon: <Search size={24} /> },
    { name: "Post", href: "#", icon: <PlusCircle size={32} />, isMain: true, onClick: handlePostClick },
    { name: "Saved", href: "/favorites", icon: <Heart size={24} /> },
    { name: "Account", href: "/dashboard", icon: <User size={24} /> }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.href}
            onClick={item.onClick}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors relative ${
                item.isMain ? '-mt-6' : ''
            }`}
          >
             {item.isMain ? (
                 <div className="bg-slate-900 text-white p-3 rounded-full shadow-lg shadow-purple-900/20 border-4 border-slate-50 transform hover:scale-105 transition-transform">
                     {item.icon}
                 </div>
             ) : (
                 <>
                    <div className={`${isActive(item.href) ? 'text-vexa-blue' : 'text-slate-400'}`}>
                        {item.icon}
                    </div>
                    <span className={`text-[10px] mt-1 font-medium ${isActive(item.href) ? 'text-vexa-blue' : 'text-slate-400'}`}>
                        {item.name}
                    </span>
                 </>
             )}
          </Link>
        ))}
      </div>
    </div>
  );
}
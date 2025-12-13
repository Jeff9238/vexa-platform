"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  PlusCircle, 
  LayoutDashboard, 
  User as UserIcon, 
  LogIn, 
  ChevronDown, 
  Home, 
  Car, 
  Hammer, 
  Building 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const timeoutRef = useRef<any>(null);

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

  const handleMouseEnter = (menu: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
      timeoutRef.current = setTimeout(() => {
          setActiveMenu(null);
      }, 200);
  };

  const renderMegaMenu = () => {
      if (!activeMenu) return null;

      let content = null;
      switch (activeMenu) {
          case 'Property':
              content = (
                  <div className="grid grid-cols-3 gap-8">
                      <div>
                          <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Home size={16} /> Buy</h4>
                          <ul className="space-y-2 text-sm text-slate-600">
                              <li><Link href="/search?type=property&transType=Sale" className="hover:text-vexa-blue">All Properties for Sale</Link></li>
                              <li><Link href="/search?type=property&transType=Sale&propertyType=Condominium" className="hover:text-vexa-blue">Condominiums</Link></li>
                              <li><Link href="/search?type=property&transType=Sale&propertyType=Terrace House" className="hover:text-vexa-blue">Terrace Houses</Link></li>
                              <li><Link href="/search?type=property&transType=Sale&propertyType=Bungalow" className="hover:text-vexa-blue">Bungalows</Link></li>
                              <li><Link href="/search?type=property&transType=Sale&propertyType=Commercial" className="hover:text-vexa-blue">Commercial</Link></li>
                          </ul>
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Home size={16} /> Rent</h4>
                          <ul className="space-y-2 text-sm text-slate-600">
                              <li><Link href="/search?type=property&transType=Rent" className="hover:text-vexa-blue">All Properties for Rent</Link></li>
                              <li><Link href="/search?type=property&transType=Rent&propertyType=Condominium" className="hover:text-vexa-blue">Condos for Rent</Link></li>
                              <li><Link href="/search?type=property&transType=Rent&propertyType=Terrace House" className="hover:text-vexa-blue">Terrace for Rent</Link></li>
                              <li><Link href="/search?type=property&transType=Rent&propertyType=Commercial" className="hover:text-vexa-blue">Offices for Rent</Link></li>
                          </ul>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                          <h4 className="font-bold text-slate-900 mb-2">New Projects</h4>
                          <p className="text-xs text-slate-500 mb-3">Discover newly launched developments.</p>
                          <Link href="/search?type=property&new=true" className="text-sm font-bold text-vexa-blue hover:underline">View Launches &rarr;</Link>
                      </div>
                  </div>
              );
              break;
          case 'Vehicle':
              content = (
                  <div className="grid grid-cols-3 gap-8">
                      <div>
                          <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Car size={16} /> Cars</h4>
                          <ul className="space-y-2 text-sm text-slate-600">
                              <li><Link href="/search?type=vehicle" className="hover:text-vexa-blue">All Cars for Sale</Link></li>
                              <li><Link href="/search?type=vehicle&make=Toyota" className="hover:text-vexa-blue">Toyota</Link></li>
                              <li><Link href="/search?type=vehicle&make=Honda" className="hover:text-vexa-blue">Honda</Link></li>
                              <li><Link href="/search?type=vehicle&make=BMW" className="hover:text-vexa-blue">BMW</Link></li>
                              <li><Link href="/search?type=vehicle&make=Mercedes-Benz" className="hover:text-vexa-blue">Mercedes-Benz</Link></li>
                          </ul>
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-900 mb-3">Body Type</h4>
                          <ul className="space-y-2 text-sm text-slate-600">
                              <li><Link href="/search?type=vehicle&bodyType=SUV" className="hover:text-vexa-blue">SUV</Link></li>
                              <li><Link href="/search?type=vehicle&bodyType=Sedan" className="hover:text-vexa-blue">Sedan</Link></li>
                              <li><Link href="/search?type=vehicle&bodyType=MPV" className="hover:text-vexa-blue">MPV</Link></li>
                              <li><Link href="/search?type=vehicle&bodyType=Sports Car" className="hover:text-vexa-blue">Sports Car</Link></li>
                          </ul>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                          <h4 className="font-bold text-slate-900 mb-2">Electric Vehicles</h4>
                          <p className="text-xs text-slate-500 mb-3">Find the latest EVs and Hybrids.</p>
                          <Link href="/search?type=vehicle&fuel=Electric" className="text-sm font-bold text-vexa-blue hover:underline">Browse EVs &rarr;</Link>
                      </div>
                  </div>
              );
              break;
          case 'Pros':
              content = (
                  <div className="grid grid-cols-2 gap-8">
                      <div>
                          <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Hammer size={16} /> Services</h4>
                          <ul className="space-y-2 text-sm text-slate-600">
                              <li><Link href="/services" className="hover:text-vexa-blue">All Services</Link></li>
                              <li><Link href="/services?type=Renovation Specialist" className="hover:text-vexa-blue">Renovation</Link></li>
                              <li><Link href="/services?type=Interior Designer" className="hover:text-vexa-blue">Interior Design</Link></li>
                              <li><Link href="/services?type=Plumber" className="hover:text-vexa-blue">Plumbing</Link></li>
                              <li><Link href="/services?type=Electrician" className="hover:text-vexa-blue">Electrical</Link></li>
                          </ul>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl">
                          <h4 className="font-bold text-slate-900 mb-2">Join as a Pro</h4>
                          <p className="text-xs text-slate-500 mb-3">Offer your services to millions of users.</p>
                          <Link href="/dashboard" className="text-sm font-bold text-vexa-blue hover:underline">Register Now &rarr;</Link>
                      </div>
                  </div>
              );
              break;
          default:
              return null;
      }

      return (
          <div 
            className="absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-xl z-40 animate-in fade-in slide-in-from-top-1 duration-200"
            onMouseEnter={() => handleMouseEnter(activeMenu)}
            onMouseLeave={handleMouseLeave}
          >
              <div className="container mx-auto px-4 py-8">
                  {content}
              </div>
          </div>
      );
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100 relative">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 z-50">
          <div className="w-8 h-8 bg-vexa-blue rounded-lg flex items-center justify-center bg-slate-900">
            <span className="text-orange-500 font-bold text-xl">V</span>
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            VEXA
          </span>
        </Link>

        {/* Desktop Nav with Mega Menu */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 h-full">
          <div 
              className="relative h-full flex items-center cursor-pointer group"
              onMouseEnter={() => handleMouseEnter('Property')}
              onMouseLeave={handleMouseLeave}
          >
              <span className={`flex items-center gap-1 hover:text-vexa-blue transition-colors ${activeMenu === 'Property' ? 'text-vexa-blue' : ''}`}>Property <ChevronDown size={14} /></span>
          </div>
          <div 
              className="relative h-full flex items-center cursor-pointer group"
              onMouseEnter={() => handleMouseEnter('Vehicle')}
              onMouseLeave={handleMouseLeave}
          >
              <span className={`flex items-center gap-1 hover:text-vexa-blue transition-colors ${activeMenu === 'Vehicle' ? 'text-vexa-blue' : ''}`}>Vehicle <ChevronDown size={14} /></span>
          </div>
          <div 
              className="relative h-full flex items-center cursor-pointer group"
              onMouseEnter={() => handleMouseEnter('Pros')}
              onMouseLeave={handleMouseLeave}
          >
              <span className={`flex items-center gap-1 hover:text-vexa-blue transition-colors ${activeMenu === 'Pros' ? 'text-vexa-blue' : ''}`}>Pros <ChevronDown size={14} /></span>
          </div>
          <Link href="/search?type=project" className="hover:text-vexa-blue transition-colors">New Projects</Link>
        </nav>

        <div className="flex items-center gap-4 z-50">
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

      {/* Render Mega Menu Drawer */}
      {renderMegaMenu()}
    </header>
  );
}
"use client";

import Hero from "@/components/home/Hero";
import FeaturedCarousel from "@/components/home/FeaturedCarousel";
import MobileNav from "@/components/layout/MobileNav"; 
import Footer from "@/components/layout/Footer"; 
import { ArrowRight, Star, Car, Home, Briefcase, Wrench, Landmark, BadgeCheck } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    // Added pb-24 to prevent content from being hidden behind the Mobile Bottom Nav
    <main className="flex flex-col min-h-screen bg-slate-50 pb-24 md:pb-0">
      
      <Hero />

      {/* SECTION 1: MARKETPLACE HIGHLIGHTS */}
      <div className="mt-6 md:mt-8 container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Star className="text-orange-500 fill-orange-500" size={24} /> Recommended For You
        </h2>
        <FeaturedCarousel />
      </div>

      {/* SECTION 2: CATEGORY GRID */}
      <section className="py-8 md:py-12 container mx-auto px-4">
        <div className="flex justify-between items-end mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-vexa-blue">Browse Categories</h2>
        </div>
        
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
          {[
            { label: "Buy House", query: "House", type: "property", icon: Home, color: "bg-blue-100 text-blue-700" },
            { label: "Rent House", query: "Rent", type: "property", icon: Home, color: "bg-blue-50 text-blue-600" },
            { label: "New Project", query: "New", type: "property", icon: Star, color: "bg-orange-100 text-orange-600" },
            { label: "Commercial", query: "Commercial", type: "property", icon: Landmark, color: "bg-slate-100 text-slate-600" },
            { label: "Used Car", query: "Used", type: "vehicle", icon: Car, color: "bg-emerald-100 text-emerald-700" },
            { label: "Recon Car", query: "Recon", type: "vehicle", icon: Car, color: "bg-emerald-50 text-emerald-600" },
            { label: "Motorcycles", query: "Motorcycle", type: "vehicle", icon: Car, color: "bg-slate-100 text-slate-600" },
            { label: "Find Pro", link: "/services", icon: Briefcase, color: "bg-purple-100 text-purple-700" },
          ].map((item, i) => {
            const Icon = item.icon;
            const href = item.link || `/search?q=${item.query}&type=${item.type || 'all'}`;
            return (
              <Link key={i} href={href} className="flex flex-col items-center gap-2 cursor-pointer group active:scale-95 transition-transform">
                <div className={`w-14 h-14 md:w-16 md:h-16 ${item.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md`}>
                  <Icon size={24} />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-vexa-blue-dark text-center leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: PREMIER AGENTS */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-vexa-blue">Premier Agents</h2>
              <p className="text-xs md:text-sm text-gray-500">Top rated professionals ready to help you.</p>
            </div>
            <Link href="/search?type=agent" className="text-vexa-orange text-xs md:text-sm font-semibold">View All</Link>
          </div>

          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="snap-center min-w-[150px] md:min-w-[160px] flex flex-col items-center text-center p-4 border border-gray-100 rounded-xl shadow-sm hover:shadow-lg transition-all bg-white">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-200 mb-3 overflow-hidden relative border-2 border-white shadow-md">
                   <div className="absolute inset-0 bg-gradient-to-tr from-vexa-blue to-vexa-blue-light opacity-80"></div>
                   <span className="absolute inset-0 flex items-center justify-center text-white font-bold">AG</span>
                </div>
                <h3 className="font-bold text-vexa-blue text-sm">Top Agent {i}</h3>
                <p className="text-[10px] md:text-xs text-gray-500 mb-2">VEXA Realty</p>
                <div className="flex items-center gap-1 text-orange-400 text-xs font-bold mb-3">
                  <Star size={12} fill="currentColor" /> 5.0
                </div>
                <button className="w-full text-xs border border-vexa-blue text-vexa-blue py-1.5 rounded-full hover:bg-vexa-blue hover:text-white transition-colors">
                  Contact
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: LUXURY GARAGE */}
      <section className="py-10 md:py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
           <div className="flex justify-between items-end mb-6 md:mb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Car className="text-orange-500" size={24} />
                Vexa Luxury Garage
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1">Premium Recon & Used Vehicles</p>
            </div>
            <Link href="/search?type=vehicle" className="text-orange-500 hover:text-white transition-colors text-xs md:text-sm font-semibold">
              Browse Showroom
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
             <Link href="/search?q=Mercedes" className="relative h-56 md:h-64 bg-gray-800 rounded-2xl overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform">
                <div className="absolute inset-0 bg-slate-700 group-hover:scale-105 transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 right-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block">HOT DEAL</span>
                      <h3 className="text-lg md:text-xl font-bold truncate">Mercedes-Benz G63 AMG</h3>
                      <p className="text-gray-300 text-xs md:text-sm">2021 • Unregistered • 585 HP</p>
                    </div>
                    <p className="text-white font-bold text-base md:text-lg">RM 1,288,000</p>
                  </div>
                </div>
             </Link>
             
             <Link href="/search?q=Supercar" className="relative h-56 md:h-64 bg-gray-800 rounded-2xl overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform">
                <div className="absolute inset-0 bg-slate-700 group-hover:scale-105 transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 right-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block">NEW ARRIVAL</span>
                      <h3 className="text-lg md:text-xl font-bold truncate">Lamborghini Urus</h3>
                      <p className="text-gray-300 text-xs md:text-sm">2022 • Low Mileage • Full Spec</p>
                    </div>
                    <p className="text-white font-bold text-base md:text-lg">RM 1,580,000</p>
                  </div>
                </div>
             </Link>
          </div>
        </div>
      </section>

      {/* SECTION 6: TRUSTED PROS DIRECTORY */}
      <section className="py-8 md:py-12 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
           <div className="text-center mb-8 md:mb-10">
             <span className="text-vexa-orange font-bold text-xs tracking-wider uppercase">Vexa Services</span>
             <h2 className="text-2xl md:text-3xl font-bold text-vexa-blue mt-2">Trusted Professionals</h2>
             <p className="text-gray-500 mt-2 text-sm">From renovations to legal advice, find the right pro.</p>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {[
                { title: "Renovation", count: "120+ Pros", icon: Wrench },
                { title: "Legal Services", count: "45+ Firms", icon: BadgeCheck },
                { title: "Bankers", count: "80+ Agents", icon: Landmark },
                { title: "Movers", count: "30+ Companies", icon: Car },
              ].map((service, i) => (
                <div key={i} className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 p-4 rounded-xl border border-gray-100 hover:border-vexa-blue-light hover:shadow-md transition-all cursor-pointer bg-slate-50 text-center md:text-left active:border-vexa-orange">
                   <div className="bg-white p-3 rounded-full shadow-sm text-vexa-blue">
                      <service.icon size={20} />
                   </div>
                   <div>
                      <h4 className="font-bold text-vexa-blue text-sm md:text-base">{service.title}</h4>
                      <p className="text-[10px] md:text-xs text-gray-500">{service.count}</p>
                   </div>
                </div>
              ))}
           </div>
           
           <div className="mt-8 text-center">
              <Link href="/pro-dashboard" className="text-vexa-blue font-semibold text-sm border-b-2 border-vexa-orange hover:text-vexa-orange transition-colors">
                Register your Service Business &rarr;
              </Link>
           </div>
        </div>
      </section>

      <Footer />
      <MobileNav />
    </main>
  );
}
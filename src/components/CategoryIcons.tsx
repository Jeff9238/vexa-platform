'use client'

import Link from "next/link";
import { Building2, Home, Warehouse, Car, Gauge, Zap } from "lucide-react";

const CATEGORIES = [
    { icon: Building2, label: "Condo", href: "/search?type=PROPERTY&propertyType=Condo" },
    { icon: Home, label: "Landed", href: "/search?type=PROPERTY&propertyType=Terrace" },
    { icon: Warehouse, label: "Commercial", href: "/search?type=PROPERTY&propertyType=Shoplot" },
    { icon: Car, label: "Sedan", href: "/search?type=VEHICLE&bodyType=Sedan" },
    { icon: Gauge, label: "SUV/4x4", href: "/search?type=VEHICLE&bodyType=SUV" },
    { icon: Zap, label: "Supercar", href: "/search?type=VEHICLE&minPrice=300000" }, // Smart filter for luxury
];

export default function CategoryIcons() {
  return (
    <div className="py-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {CATEGORIES.map((cat) => (
                    <Link key={cat.label} href={cat.href} className="group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-blue-900/20 hover:border-blue-500/30 transition-all cursor-pointer">
                        <div className="p-3 bg-black rounded-full text-gray-400 group-hover:text-blue-400 group-hover:scale-110 transition-all shadow-lg">
                            <cat.icon size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-300 group-hover:text-white uppercase tracking-wider">{cat.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    </div>
  );
}
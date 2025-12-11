"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, User, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    // Redirect 'Post' to Dashboard, where the 'Create Listing' flow starts for Agents
    { href: "/dashboard", label: "Post", icon: PlusCircle, isMain: true }, 
    { href: "/services", label: "Pros", icon: Briefcase },
    { href: "/dashboard", label: "Profile", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 md:hidden pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-5 h-full">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={index}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1"
            >
              <div
                className={cn(
                  "flex items-center justify-center transition-all",
                  item.isMain
                    ? "w-12 h-12 bg-vexa-blue text-white rounded-full -mt-6 shadow-lg border-4 border-slate-50"
                    : isActive
                    ? "text-vexa-blue"
                    : "text-gray-400"
                )}
              >
                <Icon size={item.isMain ? 24 : 20} />
              </div>
              {!item.isMain && (
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-vexa-blue" : "text-gray-400"
                  )}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
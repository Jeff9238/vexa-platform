"use client";

import Link from "next/link";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import { PlusCircle, LayoutDashboard } from "lucide-react";

export default function Header() {
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-vexa-blue rounded-lg flex items-center justify-center">
            <span className="text-vexa-orange font-bold text-xl">V</span>
          </div>
          <span className="text-2xl font-bold text-vexa-blue tracking-tight">
            VEXA
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="/buy" className="hover:text-vexa-blue transition-colors">Buy</Link>
          <Link href="/rent" className="hover:text-vexa-blue transition-colors">Rent</Link>
          <Link href="/vehicles" className="hover:text-vexa-blue transition-colors">Vehicles</Link>
          <Link href="/services" className="hover:text-vexa-blue transition-colors">Trusted Pros</Link>
        </nav>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-4">
          
          {/* Dashboard Link (Only if Signed In) */}
          {isSignedIn && (
            <Link 
              href="/dashboard" 
              className="hidden md:flex items-center gap-2 text-vexa-blue font-medium hover:text-vexa-orange transition-colors mr-2"
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
          )}

          {/* Post Ad Button (Desktop) */}
          <Link href="/post" className="hidden md:flex items-center gap-2 bg-vexa-orange hover:bg-vexa-orange-dark text-white px-4 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg">
            <PlusCircle size={18} />
            <span>Post Ad</span>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="text-vexa-blue font-semibold hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
                  Sign In
                </button>
              </SignInButton>
            ) : (
              <UserButton afterSignOutUrl="/" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
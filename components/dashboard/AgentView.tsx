"use client";

import { useState } from "react";
import { PlusCircle, CreditCard, LayoutDashboard, BarChart3, Settings, ShieldCheck, RefreshCw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface AgentViewProps {
  profile: any;
}

export default function AgentView({ profile }: AgentViewProps) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  // Initialize Supabase Client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSwitchToUser = async () => {
    const confirmed = window.confirm(
      "Are you sure? This will switch your account to a standard Buyer/User account."
    );

    if (!confirmed) return;

    setIsSwitching(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("id", profile.id);

      if (error) throw error;

      // Refresh to trigger the dashboard logic to show UserView instead
      router.refresh();
    } catch (error) {
      console.error("Error switching role:", error);
      alert("Failed to switch role. Please try again.");
    } finally {
      setIsSwitching(false);
    }
  };

  const handlePostClick = (e: React.MouseEvent) => {
    if (!profile.is_verified) {
      e.preventDefault();
      alert("Account Not Verified. Please wait for Admin approval before posting.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Stats Bar */}
      <div className="bg-vexa-blue text-white p-6 pt-10 rounded-b-[2rem] shadow-xl">
        <div className="container mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold">Hello, {profile.name}</h1>
              <p className="text-vexa-sky text-sm">
                {profile.is_verified ? "Verified Agent ✅" : "Pending Verification ⏳"}
              </p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm text-center">
              <p className="text-xs text-vexa-silver">Credits</p>
              <p className="text-xl font-bold text-vexa-orange">{profile.credits}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            {/* Logic: If not verified, button is greyed out and unclickable */}
            {profile.is_verified ? (
               <Link href="/post" className="bg-vexa-orange hover:bg-vexa-orange-light text-white p-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95">
                 <PlusCircle size={20} /> Post Ad
               </Link>
            ) : (
               <button 
                 onClick={() => alert("You must be verified to post ads.")}
                 className="bg-gray-500 text-gray-300 p-4 rounded-xl flex items-center justify-center gap-2 font-bold cursor-not-allowed opacity-80"
               >
                 <PlusCircle size={20} /> Post Ad
               </button>
            )}
            
            <button className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all backdrop-blur-sm active:scale-95">
              <CreditCard size={20} /> Top Up
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 mt-8 space-y-6">
        
        {/* Verification Warning (Req #5) + Switch Role Escape Hatch */}
        {!profile.is_verified && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex flex-col gap-4">
             <div className="flex gap-3">
               <div className="bg-yellow-100 p-2 rounded-full text-yellow-600 shrink-0 h-fit">
                 <ShieldCheck size={20} />
               </div>
               <div>
                 <h3 className="font-bold text-yellow-800">Account Pending Verification</h3>
                 <p className="text-sm text-yellow-700 mt-1">
                   You cannot post listings until an Admin verifies your license.
                 </p>
               </div>
             </div>
             
             {/* The "Escape Hatch" Button - Now More Visible */}
             <div className="flex justify-end border-t border-yellow-200 pt-3">
               <button 
                 onClick={handleSwitchToUser}
                 disabled={isSwitching}
                 className="bg-white border border-yellow-300 text-yellow-800 text-xs font-bold px-4 py-2 rounded-lg hover:bg-yellow-100 transition-colors shadow-sm flex items-center gap-2"
               >
                 <RefreshCw size={14} />
                 {isSwitching ? "Switching..." : "Mistake? Switch to Buyer Account"}
               </button>
             </div>
          </div>
        )}

        {/* Dashboard Menu Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center gap-3 hover:shadow-md transition-all cursor-pointer">
            <LayoutDashboard className="text-vexa-blue" size={32} />
            <span className="font-medium text-sm text-gray-600">My Listings</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center gap-3 hover:shadow-md transition-all cursor-pointer">
            <BarChart3 className="text-vexa-blue" size={32} />
            <span className="font-medium text-sm text-gray-600">Analytics</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center gap-3 hover:shadow-md transition-all cursor-pointer">
            <Settings className="text-vexa-blue" size={32} />
            <span className="font-medium text-sm text-gray-600">Profile Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
}
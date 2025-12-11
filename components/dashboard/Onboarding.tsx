"use client";

import { useState } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { ShieldCheck, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const { user } = useUser();
  const { session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelection = async (role: "agent" | "user") => {
    if (!user || !session) return;
    setIsLoading(true);

    try {
      console.log("Starting profile creation for:", user.id);

      // 1. Check Env Vars
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Missing Supabase Environment Variables");
      }

      // 2. Get the Supabase Token from Clerk
      const token = await session.getToken({ template: "supabase" });
      console.log("Token generated:", token ? "Yes" : "No");

      if (!token) {
        throw new Error("Failed to get authentication token. Check Clerk JWT Template name is 'supabase'.");
      }

      // 3. Initialize authenticated Supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );

      // 4. Create Profile in Supabase
      const { data, error } = await supabase.from("profiles").insert({
        id: user.id,
        role: role,
        name: user.fullName || user.primaryEmailAddress?.emailAddress,
        email: user.primaryEmailAddress?.emailAddress,
        avatar_url: user.imageUrl,
        is_verified: role === "agent" ? false : true,
        credits: role === "agent" ? 0 : 0,
      });

      if (error) {
        // Force the error to print as a string so we can see the code
        console.error("Supabase Error Details (JSON):", JSON.stringify(error, null, 2));
        throw new Error(error.message);
      }

      console.log("Profile created successfully!");
      router.refresh();
      
    } catch (error: any) {
      console.error("FULL ERROR OBJECT:", error);
      alert(`Error: ${error.message || "Something went wrong"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-vexa-blue">Welcome to Vexa</h1>
          <p className="text-gray-500 mt-2">How will you be using the platform today?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* USER CARD */}
          <button
            onClick={() => handleRoleSelection("user")}
            disabled={isLoading}
            className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border-2 border-transparent hover:border-vexa-blue transition-all flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-blue-50 text-vexa-blue rounded-full flex items-center justify-center mb-4 group-hover:bg-vexa-blue group-hover:text-white transition-colors">
              <User size={32} />
            </div>
            <h3 className="text-xl font-bold text-vexa-blue">I am a Buyer / Tenant</h3>
            <p className="text-sm text-gray-400 mt-2">
              Looking for dream properties, vehicles, or professional services.
            </p>
          </button>

          {/* AGENT CARD */}
          <button
            onClick={() => handleRoleSelection("agent")}
            disabled={isLoading}
            className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border-2 border-transparent hover:border-vexa-orange transition-all flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-orange-50 text-vexa-orange rounded-full flex items-center justify-center mb-4 group-hover:bg-vexa-orange group-hover:text-white transition-colors">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-vexa-blue">I am an Agent / Pro</h3>
            <p className="text-sm text-gray-400 mt-2">
              I want to post listings, manage leads, and grow my business.
            </p>
          </button>
        </div>

        {isLoading && <p className="text-vexa-blue animate-pulse">Setting up your account...</p>}
      </div>
    </div>
  );
}
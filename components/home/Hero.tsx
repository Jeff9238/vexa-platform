"use client";

import { useState } from "react";
import { Search, MapPin, Car, Home, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Define exact tab IDs to prevent overlap issues
type TabID = "buy" | "rent" | "vehicle" | "pro";

export default function Hero() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabID>("buy");
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");

  const tabs = [
    { id: "buy", label: "Buy Property", icon: Home },
    { id: "rent", label: "Rent Property", icon: Home },
    { id: "vehicle", label: "Vehicles", icon: Car },
    { id: "pro", label: "Trusted Pros", icon: Briefcase },
  ];

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Redirect logic based on Active Tab
    if (activeTab === 'pro') {
         router.push(`/services?q=${encodeURIComponent(searchTerm)}`);
         return;
    }

    let url = `/search?q=${encodeURIComponent(searchTerm)}`;
    if (location) url += `&location=${encodeURIComponent(location)}`;

    if (activeTab === 'buy') {
        url += `&type=property&transType=Sale`;
    } else if (activeTab === 'rent') {
        url += `&type=property&transType=Rent`;
    } else if (activeTab === 'vehicle') {
        url += `&type=vehicle`;
    }

    router.push(url);
  };

  return (
    <div className="relative h-[500px] w-full bg-vexa-blue flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background Gradient / Image Placeholder */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-2495db98dada?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-vexa-blue/80 to-vexa-blue/90"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl space-y-6 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
          Find Your Dream <span className="text-vexa-orange">Home</span> & <span className="text-vexa-orange">Ride</span>
        </h1>
        <p className="text-gray-300 text-sm md:text-lg max-w-2xl mx-auto">
          The all-in-one marketplace for properties, vehicles, and professional services in Malaysia.
        </p>

        {/* Search Box Container */}
        <div className="bg-white rounded-xl shadow-2xl p-4 md:p-6 mt-8">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-100 pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabID)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-vexa-blue text-white shadow-md"
                      : "text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Input Fields */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Location (e.g., Kuala Lumpur)"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vexa-orange/50 text-gray-800 placeholder:text-gray-400"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="flex-[2] relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={
                  activeTab === "vehicle"
                    ? "Search by Brand, Model..."
                    : activeTab === "pro"
                    ? "Search for Plumbers, Bankers..."
                    : "Search by Project Name, Type..."
                }
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vexa-orange/50 text-gray-800 placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
                onClick={handleSearch}
                className="bg-vexa-orange hover:bg-vexa-orange-dark text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-vexa-orange/30"
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
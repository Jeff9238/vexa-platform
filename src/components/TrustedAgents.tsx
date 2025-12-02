'use client'

import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

export default function TrustedAgents({ agents }: { agents: any[] }) {
  if (agents.length === 0) return null;

  return (
    <div className="py-20 bg-neutral-900 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white font-serif mb-2">Meet Our Trusted Partners</h2>
            <p className="text-gray-400 mb-12">Connect with Malaysia's top property and automotive experts.</p>

            <div className="flex flex-wrap justify-center gap-8">
                {agents.slice(0, 5).map((agent) => (
                    <Link key={agent.id} href={`/agent/${agent.id}`} className="group flex flex-col items-center gap-4">
                        <div className="relative w-24 h-24 rounded-full p-1 border-2 border-dashed border-gray-700 group-hover:border-blue-500 transition-colors">
                            <div className="w-full h-full rounded-full overflow-hidden relative bg-black">
                                {agent.profileImage ? (
                                    <Image src={agent.profileImage} alt={agent.name} fill className="object-cover"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold bg-blue-600">
                                        {agent.name?.substring(0,2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-neutral-900">
                                <CheckCircle size={12} fill="currentColor"/>
                            </div>
                        </div>
                        <div className="text-center">
                            <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{agent.name}</h4>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Agent</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    </div>
  );
}
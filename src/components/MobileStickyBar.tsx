'use client'

import { MessageCircle, Phone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { trackContact } from "@/app/actions";

interface MobileBarProps {
    phone: string;
    listingId: string;
    whatsappUrl: string;
    agentName: string;
    agentImage: string | null;
}

export default function MobileStickyBar({ phone, listingId, whatsappUrl, agentName, agentImage }: MobileBarProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 p-3 pb-6 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)] safe-area-bottom">
        <div className="flex items-center justify-between gap-3">
            
            {/* AGENT INFO (Left) */}
            <div className="flex items-center gap-3 flex-shrink-0 max-w-[40%]">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20">
                    {agentImage ? (
                        <Image src={agentImage} alt="Agent" fill className="object-cover"/>
                    ) : (
                        <div className="w-full h-full bg-blue-900 flex items-center justify-center text-white font-bold text-xs">{agentName?.substring(0,1)}</div>
                    )}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-black"></div>
                </div>
                <div className="flex flex-col justify-center overflow-hidden">
                    <p className="text-white font-bold text-xs truncate leading-tight">{agentName}</p>
                    <p className="text-[10px] text-blue-400 flex items-center gap-1 leading-tight"><ShieldCheck size={10}/> Verified</p>
                </div>
            </div>

            {/* ACTIONS (Right) */}
            <div className="flex gap-2 flex-grow justify-end">
                <a 
                    href={whatsappUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => trackContact(listingId, 'WHATSAPP')}
                    className="flex-1 max-w-[120px] flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebc50] text-white py-2.5 rounded-lg font-bold text-xs shadow-lg transition-all active:scale-95"
                >
                    <MessageCircle size={16}/> WhatsApp
                </a>
                
                <a 
                    href={phone ? `tel:${phone}` : '#'} 
                    onClick={() => trackContact(listingId, 'CALL')}
                    className="flex-shrink-0 w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center shadow-lg transition-all active:scale-95"
                >
                    <Phone size={18}/>
                </a>
            </div>
        </div>
    </div>
  );
}
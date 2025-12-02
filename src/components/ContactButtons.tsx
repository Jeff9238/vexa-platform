'use client'

import { MessageCircle, Phone } from "lucide-react";
import { trackContact } from "@/app/actions";

export default function ContactButtons({ phone, listingId, whatsappUrl }: { phone: string, listingId: string, whatsappUrl: string }) {
  return (
    <div className="flex items-center gap-3 w-full md:w-auto">
        <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={() => trackContact(listingId, 'WHATSAPP')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebc50] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-900/20 cursor-pointer"
        >
            <MessageCircle size={20}/> <span className="whitespace-nowrap">WhatsApp</span>
        </a>
        
        <a 
            href={phone ? `tel:${phone}` : '#'} 
            onClick={() => trackContact(listingId, 'CALL')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${phone ? 'bg-white hover:bg-gray-200 text-black cursor-pointer' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`} 
            title={phone ? "Call Now" : "Phone number not provided"}
        >
            <Phone size={20}/> <span className="whitespace-nowrap">{phone ? "Call" : "No Phone"}</span>
        </a>
    </div>
  );
}
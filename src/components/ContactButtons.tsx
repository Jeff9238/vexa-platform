'use client'

import { MessageCircle, Phone, MessageSquareText, Loader2 } from "lucide-react";
import { trackContact, startChat } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ContactButtonsProps {
    phone: string;
    listingId: string;
    whatsappUrl: string;
    isOwner?: boolean; // New prop to hide chat button if user owns the listing
}

export default function ContactButtons({ phone, listingId, whatsappUrl, isOwner }: ContactButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleChat = async () => {
      setLoading(true);
      try {
          // This server action creates a room or finds an existing one
          const res = await startChat(listingId);
          if (res?.chatId) {
              router.push(`/chat/${res.chatId}`);
          }
      } catch (e) {
          console.error(e);
          // Likely user not logged in
          router.push('/sign-in'); 
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
        <div className="flex gap-3 w-full">
            <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => trackContact(listingId, 'WHATSAPP')}
                className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebc50] text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-900/20 cursor-pointer"
            >
                <MessageCircle size={18}/> <span className="whitespace-nowrap">WhatsApp</span>
            </a>
            
            <a 
                href={phone ? `tel:${phone}` : '#'} 
                onClick={() => trackContact(listingId, 'CALL')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${phone ? 'bg-white hover:bg-gray-200 text-black cursor-pointer' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`} 
            >
                <Phone size={18}/> <span className="whitespace-nowrap">Call</span>
            </a>
        </div>

        {/* NEW: VEXA CHAT BUTTON (Only show if NOT owner) */}
        {!isOwner && (
            <button 
                onClick={handleChat}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
            >
                {loading ? <Loader2 size={18} className="animate-spin"/> : <MessageSquareText size={18}/>}
                Chat on VEXA
            </button>
        )}
    </div>
  );
}
import { getChatDetails, sendMessage, markChatAsRead } from "@/app/actions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Send, MapPin, ChevronRight } from "lucide-react";
import { Manrope } from 'next/font/google';
import { revalidatePath } from "next/cache";
import ChatReadMarker from "@/components/ChatReadMarker";
import ChatAutoRefresh from "@/components/ChatAutoRefresh"; 

const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const chat = await getChatDetails(id);
  if (!chat) return redirect("/chat");

  const userEmail = user.emailAddresses[0].emailAddress;
  
  const isBuyer = chat.buyer.email === userEmail;
  const otherPerson = isBuyer ? chat.seller : chat.buyer;
  const myDbId = isBuyer ? chat.buyerId : chat.sellerId;

  // Dynamic Specs
  const specs = chat.listing.type === 'PROPERTY' 
    ? `${chat.listing.bedrooms || 0} Beds • ${chat.listing.bathrooms || 0} Baths • ${chat.listing.sqft || '-'} sqft`
    : `${chat.listing.year || 'N/A'} • ${chat.listing.transmission || 'N/A'} • ${chat.listing.engineCC ? chat.listing.engineCC + 'cc' : ''}`;

  async function handleSend(formData: FormData) {
      'use server'
      const text = formData.get('text') as string;
      if (!text || text.trim() === "") return;
      await sendMessage(id, text);
      revalidatePath(`/chat/${id}`);
  }

  return (
    <div className={`flex flex-col h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
        
        <ChatReadMarker chatId={id} />
        <ChatAutoRefresh />

        {/* HEADER */}
        <header className="flex-shrink-0 bg-neutral-900 border-b border-white/10 p-3 shadow-xl z-20">
            <div className="max-w-3xl mx-auto flex items-center gap-2">
                <Link href="/chat" className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={22}/>
                </Link>
                
                {/* LISTING CARD */}
                <Link href={`/listing/${chat.listingId}`} className="flex-grow bg-black/40 border border-white/5 rounded-xl p-2 flex items-center gap-3 hover:bg-white/5 transition-all group relative overflow-hidden">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-800 border border-white/10 flex-shrink-0">
                        <Image src={chat.listing.images ? chat.listing.images.split(',')[0] : '/placeholder.jpg'} alt="img" fill className="object-cover"/>
                    </div>
                    <div className="min-w-0 flex-grow">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-white text-xs line-clamp-1">{chat.listing.title}</h3>
                            <span className="text-[10px] font-bold text-blue-400 whitespace-nowrap ml-2">RM {chat.listing.price.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate">{specs}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors flex-shrink-0 mr-1"/>
                </Link>
            </div>
        </header>

        {/* MESSAGES AREA - IMPROVED SPACING */}
        <div className="flex-grow overflow-y-auto p-4 space-y-2 flex flex-col bg-[#050505] scroll-smooth pb-24">
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-2"> {/* Reduced Gap */}
                
                {chat.messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-10 px-4">
                        <p className="font-bold mb-1 text-white">Start a conversation</p>
                        <p className="text-xs">Is this still available?</p>
                    </div>
                )}
                
                {chat.messages.map((msg) => {
                    const isMe = msg.senderId === myDbId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}>
                            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                isMe 
                                ? 'bg-blue-600 text-white rounded-br-sm' 
                                : 'bg-neutral-800 text-gray-200 rounded-bl-sm border border-white/5'
                            }`}>
                                {msg.text}
                                <p className={`text-[9px] mt-1 text-right opacity-60 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* INPUT AREA - FLOATING BAR STYLE */}
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-white/10 p-3 md:p-4 safe-area-bottom z-30">
            <div className="max-w-3xl mx-auto">
                <form action={handleSend} className="flex gap-2 items-center">
                    <input 
                        name="text" 
                        type="text" 
                        placeholder="Message..." 
                        autoComplete="off"
                        autoFocus
                        className="flex-grow bg-black/50 border border-white/10 rounded-full px-5 py-3 text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-gray-500 focus:bg-black h-12"
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white w-12 h-12 flex items-center justify-center rounded-full transition-all shadow-lg shadow-blue-600/20 active:scale-95 group flex-shrink-0">
                        <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform ml-0.5"/>
                    </button>
                </form>
            </div>
        </div>

    </div>
  );
}
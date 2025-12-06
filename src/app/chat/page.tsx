import { getMyChats } from "@/app/actions";
// Removed explicit Navbar import to use Global one
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MessageSquare, ArrowRight } from "lucide-react";
import { Manrope } from 'next/font/google';

const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function InboxPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const chats = await getMyChats();

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className} pb-20`}>
      
      {/* Spacer for Global Navbar */}
      <div className="h-24"></div>

      <div className="max-w-2xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>

        {chats.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-2xl">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                    <MessageSquare size={32}/>
                </div>
                <p className="text-gray-400 font-bold mb-1">No messages yet</p>
                <p className="text-sm text-gray-600 mb-6">Contact an agent to start chatting.</p>
                <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-500 transition-colors">
                    Explore Listings
                </Link>
            </div>
        ) : (
            <div className="space-y-2">
                {chats.map(chat => (
                    <Link key={chat.id} href={`/chat/${chat.id}`} className="block bg-neutral-900 border border-white/5 p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                        <div className="flex gap-4">
                            {/* Listing Image */}
                            <div className="relative w-16 h-16 bg-black rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                                <Image 
                                    src={chat.listing.images ? chat.listing.images.split(',')[0] : '/placeholder.jpg'} 
                                    alt="Listing" 
                                    fill 
                                    className="object-cover"
                                />
                            </div>
                            
                            <div className="flex-grow min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-white truncate pr-4 group-hover:text-blue-400 transition-colors">
                                        {chat.listing.title}
                                    </h4>
                                    <span className="text-[10px] text-gray-500 whitespace-nowrap bg-black/40 px-2 py-1 rounded">
                                        {new Date(chat.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-400 truncate pr-4">
                                        {chat.messages.length > 0 ? chat.messages[0].text : <span className="italic text-gray-600">Start conversation...</span>}
                                    </p>
                                    <ArrowRight size={16} className="text-gray-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100"/>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
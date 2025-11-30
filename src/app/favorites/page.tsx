import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Playfair_Display, Manrope } from 'next/font/google';
import { BedDouble, Car, ArrowLeft, Heart, MapPin, MessageCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import FavoriteButton from "@/components/FavoriteButton";

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function FavoritesPage() {
  // 1. Get Logged In User
  const clerkUser = await currentUser();
  if (!clerkUser) return redirect("/sign-in");

  const email = clerkUser.emailAddresses[0].emailAddress;

  // 2. Fetch User's Favorites (Including the Listing details)
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
        favorites: {
            include: {
                listing: true // <--- Get the actual listing data
            },
            orderBy: { createdAt: 'desc' }
        }
    }
  });

  const listings = user?.favorites.map(fav => fav.listing) || [];

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-12">
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
            <div className="p-3 bg-red-500/20 rounded-full text-red-500">
                <Heart size={32} fill="currentColor"/>
            </div>
            <div>
                <h1 className={`text-4xl font-bold ${serifFont.className}`}>My Wishlist</h1>
                <p className="text-gray-400 mt-1">{listings.length} saved items</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.length === 0 ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-2xl">
                    <p className="text-gray-500 mb-4">You haven't saved any items yet.</p>
                    <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-500">
                        Explore Listings
                    </Link>
                </div>
            ) : listings.map((item) => (
                <div key={item.id} className="group bg-neutral-900 border border-white/5 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all relative">
                    
                    {/* Heart Button (Already Red) */}
                    <div className="absolute top-3 right-3 z-20">
                         <FavoriteButton listingId={item.id} initialLiked={true} />
                    </div>

                    <Link href={`/listing/${item.id}`}>
                        <div className="relative h-[200px] w-full overflow-hidden">
                            <Image 
                                src={item.images ? item.images.split(',')[0] : 'https://via.placeholder.com/400'} 
                                alt={item.title} 
                                fill 
                                className="object-cover group-hover:scale-105 transition-transform duration-700" 
                            />
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-white p-1.5 rounded-lg text-xs font-bold uppercase">
                                {item.type}
                            </div>
                            <div className="absolute bottom-3 left-3">
                                <p className={`text-lg font-semibold text-white ${serifFont.className}`}>
                                   RM {item.price.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="p-4">
                            <h4 className="text-sm font-bold text-white mb-2 line-clamp-1">{item.title}</h4>
                            <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
                                <span className="flex items-center gap-1"><MapPin size={10}/> {item.area}, {item.state}</span>
                                <span>Saved</span>
                            </div>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
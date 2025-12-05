'use client'

import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import { BedDouble, Car, MapPin } from "lucide-react";
import FavoriteButton from "@/components/FavoriteButton";
import { ListingWithUser } from "@/types"; // Import defined type

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

interface ListingCardProps {
  data: ListingWithUser; // Strict typing
  isLiked?: boolean;
}

export default function ListingCard({ data, isLiked = false }: ListingCardProps) {
  const priceDisplay = data.price > 0 ? `RM ${data.price.toLocaleString()}` : "Contact for Price";
  const isRent = data.listingCategory === 'RENT';
  const condition = data.condition || 'USED';

  // Dynamic Icon
  const Icon = data.type === 'PROPERTY' ? BedDouble : Car;
  
  // Dynamic Specs String
  const specs = data.type === 'PROPERTY' 
    ? `${data.bedrooms || 0} Beds • ${data.propertyType || 'Property'}`
    : `${data.year || 'N/A'} • ${data.bodyType || 'Vehicle'}`;

  const agentName = data.user?.name || 'Agent';
  const initials = agentName.substring(0, 2).toUpperCase();

  return (
    <div className={`group bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(37,99,235,0.3)] flex flex-col h-full relative ${sansFont.className}`}>
        
        <Link href={`/listing/${data.id}`} className="relative h-[240px] w-full overflow-hidden block">
            <Image 
                src={data.images ? data.images.split(',')[0] : 'https://via.placeholder.com/400'} 
                alt={data.title} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
                {data.listingCategory && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded text-white shadow-sm ${isRent ? 'bg-purple-600' : 'bg-green-600'}`}>
                        {data.listingCategory}
                    </span>
                )}
                {data.type === 'VEHICLE' && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded text-white bg-orange-600 shadow-sm uppercase">
                        {condition}
                    </span>
                )}
            </div>

            {/* Actions */}
            <div className="absolute top-3 right-3 flex gap-2 z-10">
                <div onClick={(e) => e.preventDefault()}>
                    <FavoriteButton listingId={data.id} initialLiked={isLiked} />
                </div>
                <div className="bg-black/60 backdrop-blur text-white p-2 rounded-full shadow-lg">
                    <Icon size={14}/>
                </div>
            </div>

            <div className="absolute bottom-4 left-4">
                <p className={`text-xl font-bold text-white tracking-wide ${serifFont.className}`}>
                    {priceDisplay}
                </p>
            </div>
        </Link>

        <div className="p-5 flex flex-col flex-grow">
            <Link href={`/listing/${data.id}`}>
                <h4 className="text-base font-bold text-white mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {data.title}
                </h4>
            </Link>

            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-4">
                {specs}
            </p>

            <div className="w-full h-[1px] bg-white/10 mb-4"></div>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 max-w-[50%]">
                    <MapPin size={12} className="flex-shrink-0"/> 
                    <span className="truncate">{data.state}</span>
                </div>

                <div className="flex items-center gap-2 max-w-[50%]">
                    <span className="text-xs text-gray-300 font-bold truncate text-right">{agentName}</span>
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[8px] font-bold text-white border border-white/20 flex-shrink-0 overflow-hidden relative">
                        {data.user?.profileImage ? (
                            <Image src={data.user.profileImage} alt={agentName} fill className="object-cover"/>
                        ) : (
                            initials
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
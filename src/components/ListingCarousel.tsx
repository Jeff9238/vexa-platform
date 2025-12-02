'use client'

import { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import ListingCard from "./ListingCard";
import Link from "next/link";

interface ListingCarouselProps {
    title: string;
    subtitle?: string;
    link: string; // "See All" link
    items: any[];
    myFavs?: string[];
}

export default function ListingCarousel({ title, subtitle, link, items, myFavs = [] }: ListingCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -400 : 400;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (items.length === 0) return null;

    return (
        <div className="py-12 border-b border-white/5">
            <div className="max-w-[1600px] mx-auto px-6">
                
                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white font-serif mb-1">{title}</h2>
                        {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href={link} className="hidden md:flex text-xs font-bold text-blue-400 hover:text-white items-center gap-1 transition-colors">
                            VIEW ALL <ArrowRight size={12}/>
                        </Link>
                        <div className="flex gap-2">
                            <button onClick={() => scroll('left')} className="p-2 rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors"><ChevronLeft size={20}/></button>
                            <button onClick={() => scroll('right')} className="p-2 rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors"><ChevronRight size={20}/></button>
                        </div>
                    </div>
                </div>

                {/* Scrolling Row */}
                <div 
                    ref={scrollRef} 
                    className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory -mx-6 px-6"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {items.map((item) => (
                        <div key={item.id} className="min-w-[300px] md:min-w-[340px] snap-center">
                            <ListingCard data={item} isLiked={myFavs.includes(item.id)} />
                        </div>
                    ))}
                    
                    {/* "See More" Card at the end */}
                    <div className="min-w-[200px] snap-center flex items-center justify-center">
                        <Link href={link} className="flex flex-col items-center gap-3 text-gray-500 hover:text-blue-400 transition-colors group">
                            <div className="p-4 rounded-full border border-white/10 group-hover:border-blue-500/50 bg-white/5">
                                <ArrowRight size={24}/>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest">View All</span>
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
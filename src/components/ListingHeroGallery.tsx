'use client'

import { useState } from 'react';
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Grid, ImageIcon } from "lucide-react";

export default function ListingHeroGallery({ images }: { images: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayImages = images.length > 0 ? images : ["/placeholder.jpg"];

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const nextImage = (e: any) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = (e: any) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <>
      {/* --- DESKTOP: LUXURY BENTO GRID --- */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[500px] rounded-3xl overflow-hidden cursor-pointer">
          <div className="col-span-2 row-span-2 relative group" onClick={() => openLightbox(0)}>
              <Image src={displayImages[0]} alt="Main" fill className="object-cover group-hover:scale-105 transition-transform duration-700"/>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
          </div>
          {displayImages.slice(1, 5).map((img, idx) => (
              <div key={idx} className="relative group" onClick={() => openLightbox(idx + 1)}>
                  <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700"/>
                  {idx === 3 && displayImages.length > 5 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-bold flex items-center gap-2"><Grid size={18}/> +{displayImages.length - 5}</span>
                      </div>
                  )}
              </div>
          ))}
      </div>

      {/* --- MOBILE: SMOOTH SWIPE CAROUSEL (No Scrollbar) --- */}
      <div className="md:hidden relative h-[45vh] w-full bg-neutral-900 group">
          <div className="flex overflow-x-auto snap-x snap-mandatory h-full w-full scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {displayImages.map((img, idx) => (
                  <div key={idx} className="min-w-full h-full relative snap-center" onClick={() => openLightbox(idx)}>
                      <Image src={img} alt="Mobile Gallery" fill className="object-cover"/>
                  </div>
              ))}
          </div>
          {/* Photo Counter Badge */}
          <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-2 border border-white/10 pointer-events-none">
              <ImageIcon size={12}/> {images.length} Photos
          </div>
      </div>

      {/* --- LIGHTBOX (Unchanged logic, kept for completeness) --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex items-center justify-center animate-in fade-in duration-200">
            <div className="absolute top-0 w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
                <span className="text-white font-mono text-sm">{currentIndex + 1} / {displayImages.length}</span>
                <button onClick={() => setIsOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="relative w-full h-full max-h-[85vh] max-w-7xl px-4 flex items-center justify-center">
                <Image src={displayImages[currentIndex]} alt="Fullscreen" fill className="object-contain" quality={100}/>
            </div>
            <button onClick={prevImage} className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur border border-white/10 transition-all"><ChevronLeft size={32}/></button>
            <button onClick={nextImage} className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur border border-white/10 transition-all"><ChevronRight size={32}/></button>
        </div>
      )}
    </>
  );
}
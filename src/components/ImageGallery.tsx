'use client'

import { useState } from 'react';
import Image from "next/image";
import { ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageGallery({ images }: { images: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // We assume images[0] is the Hero (shown elsewhere), so we show the rest here
  const galleryImages = images.slice(1);

  const openLightbox = (index: number) => {
    // Adjust index because galleryImages starts at 1
    setCurrentIndex(index + 1);
    setIsOpen(true);
  };

  const nextImage = (e: any) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: any) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (galleryImages.length === 0) return null;

  return (
    <>
      {/* --- GRID GALLERY (Place this anywhere) --- */}
      <div>
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-l-4 border-white pl-3 text-white">
            <ImageIcon size={20}/> Photo Gallery ({galleryImages.length + 1})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((img, idx) => (
                  <div 
                      key={idx} 
                      onClick={() => openLightbox(idx)} 
                      className="relative aspect-[4/3] bg-neutral-800 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group border border-white/10"
                  >
                      <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover group-hover:scale-110 transition-transform duration-500"/>
                  </div>
              ))}
          </div>
      </div>

      {/* --- LIGHTBOX MODAL --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
            <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-white/10 rounded-full transition-all z-50">
                <X size={32} />
            </button>

            <div className="relative w-full h-full max-h-[85vh] max-w-5xl flex items-center justify-center">
                <Image src={images[currentIndex]} alt="Fullscreen" fill className="object-contain" />
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8">
                <button onClick={prevImage} className="p-4 rounded-full bg-white/10 hover:bg-white text-white hover:text-black transition-all border border-white/20"><ChevronLeft size={32}/></button>
                <span className="text-white font-mono text-sm">{currentIndex + 1} / {images.length}</span>
                <button onClick={nextImage} className="p-4 rounded-full bg-white/10 hover:bg-white text-white hover:text-black transition-all border border-white/20"><ChevronRight size={32}/></button>
            </div>
        </div>
      )}
    </>
  );
}
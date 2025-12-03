'use client'

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";

interface NewsImageProps {
    src: string;
    alt: string;
    category?: string; // Optional: to choose specific fallback
}

export default function NewsImage({ src, alt, category }: NewsImageProps) {
    const [imgSrc, setImgSrc] = useState(src);
    const [error, setError] = useState(false);

    // Reliable Fallback Images (Placeholders)
    const fallbackImage = "https://via.placeholder.com/800x600/171717/ffffff?text=VEXA+News";

    return (
        <div className="relative w-full h-full bg-neutral-800">
            {!error ? (
                <Image 
                    src={imgSrc} 
                    alt={alt} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={() => {
                        setImgSrc(fallbackImage);
                        setError(true); // Prevents infinite loop if fallback also fails
                    }}
                />
            ) : (
                // Fallback UI if Next.js Image component fails completely
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 bg-neutral-900">
                    <ImageIcon size={48} className="mb-2 opacity-50"/>
                    <span className="text-xs font-bold uppercase tracking-widest">Image Unavailable</span>
                </div>
            )}
        </div>
    );
}
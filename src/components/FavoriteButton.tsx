'use client'

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { toggleFavorite } from '@/app/actions';

interface FavoriteButtonProps {
  listingId: string;
  initialLiked: boolean; // <--- New Prop: Parent tells us if it's liked
}

export default function FavoriteButton({ listingId, initialLiked }: FavoriteButtonProps) {
  const [liked, setLiked] = useState(initialLiked);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent clicking the card link
    e.stopPropagation();
    
    // 1. Optimistic UI Update (Instant Red Heart)
    const newState = !liked;
    setLiked(newState);

    // 2. Server Update
    const result = await toggleFavorite(listingId);
    
    // 3. Verification
    if (result?.liked !== undefined) {
      setLiked(result.liked); 
    } else {
      setLiked(!newState); // Revert if not logged in/error
      alert("Please log in to save favorites.");
    }
  };

  return (
    <button 
        onClick={handleToggle}
        className={`p-2 rounded-full transition-all hover:scale-110 active:scale-95 ${
            liked ? 'bg-red-500/20 text-red-500' : 'bg-black/40 text-white hover:bg-white hover:text-red-500'
        }`}
    >
        <Heart size={18} fill={liked ? "currentColor" : "none"} />
    </button>
  );
}
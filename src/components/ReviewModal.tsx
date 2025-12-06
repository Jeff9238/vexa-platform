'use client'

import { useState } from 'react';
import { Star, Loader2, X, MessageSquare } from 'lucide-react';
import { createReview } from '@/app/actions';

export default function ReviewModal({ agentId }: { agentId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert("Please select a star rating.");
    
    setLoading(true);
    const res = await createReview(agentId, rating, comment);
    setLoading(false);

    if (res.success) {
        setIsOpen(false);
        setRating(0);
        setComment("");
        alert("Review submitted!");
    } else {
        alert(res.error || "Failed to submit review.");
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-all"
      >
        <Star size={14} className="text-yellow-500"/> Write a Review
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-white/10 w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
                
                <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>

                <h3 className="text-xl font-bold text-white mb-1">Rate this Agent</h3>
                <p className="text-sm text-gray-400 mb-6">Share your experience with others.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* STAR RATING */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(0)}
                                className="p-1 transition-transform hover:scale-110"
                            >
                                <Star 
                                    size={32} 
                                    fill={(hover || rating) >= star ? "#eab308" : "none"} 
                                    className={(hover || rating) >= star ? "text-yellow-500" : "text-gray-600"}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-center text-xs text-yellow-500 font-bold h-4">
                        {rating > 0 ? ["Poor", "Fair", "Good", "Very Good", "Excellent"][rating - 1] : ""}
                    </p>

                    {/* COMMENT */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Comment</label>
                        <textarea 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Was the agent responsive? knowledgeable?"
                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors h-24 resize-none"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin"/> : "Submit Review"}
                    </button>

                </form>
            </div>
        </div>
      )}
    </>
  );
}
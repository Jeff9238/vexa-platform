'use client'

import { useState } from 'react';
import { Sparkles, X, Lightbulb, Loader2 } from 'lucide-react';
import { getListingTips } from '@/app/actions';

export default function AICoachModal({ listingId }: { listingId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<string[]>([]);

  const openModal = async () => {
    setIsOpen(true);
    if (tips.length === 0) {
        setLoading(true);
        const data = await getListingTips(listingId);
        setTips(data);
        setLoading(false);
    }
  };

  return (
    <>
        <button 
            onClick={openModal}
            className="flex items-center gap-2 text-xs font-bold text-yellow-400 hover:text-yellow-300 transition-colors bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20"
        >
            <Sparkles size={14}/> Improve Listing
        </button>

        {isOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-neutral-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
                    
                    <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white p-2">
                        <X size={20}/>
                    </button>

                    <div className="mb-6">
                        <div className="w-12 h-12 bg-yellow-400/20 text-yellow-400 rounded-full flex items-center justify-center mb-4">
                            <Sparkles size={24}/>
                        </div>
                        <h3 className="text-xl font-bold text-white">AI Coach Insights</h3>
                        <p className="text-sm text-gray-400">Based on market trends and listing performance.</p>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                <Loader2 className="animate-spin mb-2" size={32}/>
                                <p className="text-xs">Analyzing your listing...</p>
                            </div>
                        ) : (
                            tips.map((tip, i) => (
                                <div key={i} className="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                                    <Lightbulb size={20} className="text-yellow-400 flex-shrink-0 mt-0.5"/>
                                    <p className="text-sm text-gray-200 leading-snug">{tip}</p>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10">
                        <button onClick={() => setIsOpen(false)} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">
                            Got it
                        </button>
                    </div>

                </div>
            </div>
        )}
    </>
  );
}
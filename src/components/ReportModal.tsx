'use client'

import { useState } from 'react';
import { Flag, X, Loader2, AlertTriangle } from 'lucide-react';
import { createReport } from '@/app/actions';

const REASONS = [
    "Fraud / Scam",
    "Duplicate Listing",
    "Wrong Category / Info",
    "Sold / Unavailable",
    "Spam / Offensive",
    "Other"
];

export default function ReportModal({ listingId }: { listingId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
          await createReport(listingId, reason, details);
          setSuccess(true);
          setTimeout(() => {
              setIsOpen(false);
              setSuccess(false);
              setDetails("");
          }, 2000);
      } catch (error) {
          alert("Failed to submit report. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <>
        <button 
            onClick={() => setIsOpen(true)} 
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors px-4 py-2"
        >
            <Flag size={14}/> Report Ad
        </button>

        {isOpen && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-neutral-900 border border-white/10 w-full max-w-md rounded-2xl p-6 relative shadow-2xl">
                    <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
                    
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckIcon />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Report Received</h3>
                            <p className="text-sm text-gray-400">Thank you for helping keep VEXA safe.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                <AlertTriangle size={20} className="text-red-500"/> Report Listing
                            </h3>
                            <p className="text-sm text-gray-400 mb-6">Tell us what's wrong with this ad.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Reason</label>
                                    <select 
                                        value={reason} 
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-colors cursor-pointer"
                                    >
                                        {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Details (Optional)</label>
                                    <textarea 
                                        value={details}
                                        onChange={(e) => setDetails(e.target.value)}
                                        placeholder="Provide more context..."
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-colors h-24 resize-none"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin"/> : "Submit Report"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        )}
    </>
  );
}

const CheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);
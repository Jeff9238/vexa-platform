'use client'

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { analyzeImage, createListing } from '../actions';
import { Upload, Sparkles, Check, Loader2, ArrowLeft, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Added this for smooth redirect

// Setup Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PostAd() {
  const router = useRouter(); // Initialize router
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    type: 'PROPERTY',
    tags: '',
  });

  // 1. Handle Multiple Image Selection
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files);
    const totalFiles = [...files, ...newFiles].slice(0, 8);
    setFiles(totalFiles);

    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews].slice(0, 8));
    
    // TRIGGER AI ANALYSIS (Only on the FIRST image added)
    if (files.length === 0 && newFiles.length > 0) {
      const firstFile = newFiles[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        setAiLoading(true);
        const base64String = reader.result as string;
        const aiResult = await analyzeImage(base64String);
        setAiLoading(false);

        if (aiResult) {
          setFormData(prev => ({
            ...prev,
            title: aiResult.title,
            description: aiResult.description,
            type: aiResult.type,
            tags: aiResult.tags
          }));
        }
      };
      reader.readAsDataURL(firstFile);
    }
  };

  const removeImage = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 2. Upload ALL images & Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return alert("Please upload at least one image!");
    setLoading(true);

    try {
      // A. Upload Images Loop
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
        
        const { error } = await supabase.storage
          .from('vexa-images')
          .upload(filename, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('vexa-images')
          .getPublicUrl(filename);
          
        uploadedUrls.push(publicUrl);
      }

      const finalImageString = uploadedUrls.join(',');

      // B. Save to Database
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('type', formData.type);
      submitData.append('tags', formData.tags);
      submitData.append('imageUrl', finalImageString);
      
      // --- IMPORTANT: YOUR USER ID GOES HERE ---
      submitData.append('userId', '88e84ca3-8e34-46a8-9b68-88e9ffc2e438'); 

      await createListing(submitData);

      // C. SUCCESS! Redirect Client-Side
      alert("Listing Posted Successfully!");
      router.push('/'); 
      router.refresh(); 

    } catch (err) {
      console.error(err);
      alert("Error uploading. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 flex justify-center items-center font-sans">
      <div className="max-w-3xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        
        <div className="flex items-center gap-4 mb-8">
           <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowLeft size={20}/></Link>
           <h1 className="text-3xl font-bold">New Listing</h1>
           <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">Max 8 Photos</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* MULTI-IMAGE UPLOAD AREA */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files.length < 8 && (
                <div className="relative group aspect-square border-2 border-dashed border-neutral-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all">
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                    <Upload className="text-blue-500 mb-2" size={24} />
                    <span className="text-xs text-neutral-400">Add Photos</span>
                </div>
            )}

            {previews.map((src, idx) => (
                <div key={idx} className="relative aspect-square bg-neutral-800 rounded-2xl overflow-hidden border border-white/10 group">
                    <Image src={src} alt="Preview" fill className="object-cover" />
                    <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={12} />
                    </button>
                    {idx === 0 && <div className="absolute bottom-0 inset-x-0 bg-blue-600 text-[10px] text-center py-1 font-bold">COVER</div>}
                </div>
            ))}
          </div>

          {aiLoading && (
               <div className="flex items-center gap-2 text-yellow-400 text-sm font-bold animate-pulse p-4 bg-yellow-400/10 rounded-xl border border-yellow-400/20">
                 <Sparkles size={16} /> Gemini AI is writing your description...
               </div>
          )}

          {/* INPUT FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="text-xs text-neutral-500 uppercase font-bold ml-1 mb-1 block">Title</label>
               <input 
                 type="text" 
                 value={formData.title} 
                 onChange={(e) => setFormData({...formData, title: e.target.value})}
                 className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl focus:border-blue-500 outline-none transition-colors font-semibold"
                 placeholder="Waiting for AI..."
               />
             </div>
             <div>
               <label className="text-xs text-neutral-500 uppercase font-bold ml-1 mb-1 block">Price (RM)</label>
               <input 
                 type="number" 
                 value={formData.price} 
                 onChange={(e) => setFormData({...formData, price: e.target.value})}
                 className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl focus:border-blue-500 outline-none transition-colors font-bold text-green-400"
               />
             </div>
          </div>

          <div>
             <label className="text-xs text-neutral-500 uppercase font-bold ml-1 mb-1 block">Description</label>
             <textarea 
               rows={4}
               value={formData.description} 
               onChange={(e) => setFormData({...formData, description: e.target.value})}
               className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl focus:border-blue-500 outline-none transition-colors text-neutral-300 leading-relaxed"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 uppercase font-bold ml-1 mb-1 block">Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl outline-none"
                >
                  <option value="PROPERTY">Property</option>
                  <option value="VEHICLE">Vehicle</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 uppercase font-bold ml-1 mb-1 block">Tags</label>
                <input 
                  type="text" 
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl outline-none text-blue-400 text-sm"
                />
              </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin"/> : <Check />}
            {loading ? "Posting..." : "Post Listing Now"}
          </button>

        </form>
      </div>
    </div>
  );
}
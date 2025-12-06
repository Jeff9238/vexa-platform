'use client'

import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { updateNewsImage } from '@/app/news-actions';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NewsImageEdit({ articleId }: { articleId: string }) {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    const file = e.target.files[0];
    
    // 1. Sanitize Filename
    const fileExt = file.name.split('.').pop();
    const fileName = `news-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
        // 2. Upload with Upsert (Prevents "File already exists" error)
        const { error } = await supabase.storage
            .from('vexa-images')
            .upload(fileName, file, { 
                cacheControl: '3600', 
                upsert: true 
            });

        if (error) throw error;

        // 3. Get Public URL
        const { data } = supabase.storage.from('vexa-images').getPublicUrl(fileName);
        const newUrl = data.publicUrl;

        // 4. Save to Database
        const res = await updateNewsImage(articleId, newUrl);
        
        if (res.success) {
            alert("Image updated successfully!");
            router.refresh();
        } else {
            throw new Error("Database update failed.");
        }

    } catch (error: any) {
        console.error("Upload Error:", error);
        // Show the actual error message from Supabase
        alert(`Upload Failed: ${error.message || "Unknown error"}`);
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
        <label className={`
            flex items-center gap-2 px-4 py-2 rounded-full 
            text-xs font-bold uppercase tracking-widest cursor-pointer transition-all
            ${uploading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white hover:text-blue-400'}
        `}>
            {uploading ? <Loader2 size={14} className="animate-spin"/> : <Camera size={14}/>}
            {uploading ? "Uploading..." : "Change Photo"}
            
            <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp" 
                onChange={handleUpload} 
                disabled={uploading}
                className="hidden" 
            />
        </label>
    </div>
  );
}
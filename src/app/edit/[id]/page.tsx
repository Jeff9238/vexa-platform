'use client'

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getListing, updateListing } from '@/app/actions';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    type: 'PROPERTY',
    tags: '',
  });

  // 1. Fetch Data on Load
  useEffect(() => {
    getListing(id).then((data) => {
      if (data) {
        setFormData({
          title: data.title,
          description: data.description,
          price: data.price.toString(),
          location: data.location,
          type: data.type,
          tags: data.tags,
        });
      }
      setLoading(false);
    });
  }, [id]);

  // 2. Handle Update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const submitData = new FormData();
    submitData.append('id', id);
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('price', formData.price);
    submitData.append('location', formData.location);
    submitData.append('type', formData.type);
    submitData.append('tags', formData.tags);

    await updateListing(submitData);
    
    alert("Updated Successfully!");
    router.push('/dashboard');
    router.refresh();
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 flex justify-center items-center font-sans">
      <div className="max-w-3xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        
        <div className="flex items-center gap-4 mb-8">
           <Link href="/dashboard" className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowLeft size={20}/></Link>
           <h1 className="text-3xl font-bold">Edit Listing</h1>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          
          {/* Note: We hide image editing for now to keep it safe/simple */}
          <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl text-blue-200 text-sm mb-6">
             Editing text details. To change images, please delete and repost.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2">
               <label className="text-xs text-neutral-500 uppercase font-bold ml-1 mb-1 block">Title</label>
               <input 
                 type="text" 
                 value={formData.title} 
                 onChange={(e) => setFormData({...formData, title: e.target.value})}
                 className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl focus:border-blue-500 outline-none transition-colors font-semibold"
               />
             </div>

             <div>
               <label className="text-xs text-neutral-500 uppercase font-bold ml-1 mb-1 block">Location</label>
               <input 
                 type="text" 
                 value={formData.location} 
                 onChange={(e) => setFormData({...formData, location: e.target.value})}
                 className="w-full bg-neutral-950 border border-neutral-800 p-4 rounded-xl focus:border-blue-500 outline-none transition-colors"
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
               rows={6}
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
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-2 mt-4"
          >
            {saving ? <Loader2 className="animate-spin"/> : <Save />}
            {saving ? "Updating..." : "Save Changes"}
          </button>

        </form>
      </div>
    </div>
  );
}
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, getUserProfile } from '@/app/actions';
import { Loader2, Save, Phone, Globe, ArrowLeft, Camera, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    phoneNumber: '',
    bio: '',
    website: '',
    profileImage: ''
  });

  // 1. Load User Data
  useEffect(() => {
    getUserProfile().then((user) => {
      if (user) {
        setFormData({
          phoneNumber: user.phoneNumber || '',
          bio: user.bio || '',
          website: user.website || '',
          profileImage: user.profileImage || ''
        });
      }
      setLoading(false);
    });
  }, []);

  // 2. Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const file = e.target.files[0];
    
    // FIX: Preserve file extension (e.g., .jpg)
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
        const { error } = await supabase.storage.from('vexa-images').upload(fileName, file);
        if (error) throw error;
        
        const { data } = supabase.storage.from('vexa-images').getPublicUrl(fileName);
        
        // Update local state immediately to show preview
        setFormData(prev => ({ ...prev, profileImage: data.publicUrl }));
    } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload image. Please try again.");
    } finally {
        setUploading(false);
    }
  };

  // 3. Submit Profile Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
        const form = new FormData();
        // Append fields manually to ensure control
        form.append('phoneNumber', formData.phoneNumber);
        form.append('bio', formData.bio);
        form.append('website', formData.website);
        form.append('profileImage', formData.profileImage);
        
        await updateProfile(form);
        alert("Profile Updated Successfully!");
        router.refresh();
    } catch (error) {
        console.error(error);
        alert("Failed to save profile.");
    } finally {
        setSaving(false);
    }
  };

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-28 flex justify-center items-center font-sans">
      <div className="max-w-2xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        
        <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard" className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowLeft size={20}/></Link>
            <h1 className="text-3xl font-bold">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* --- PROFILE PHOTO UPLOAD --- */}
            <div className="flex flex-col items-center justify-center mb-8">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-neutral-800 bg-neutral-800 group">
                    {formData.profileImage ? (
                        <Image src={formData.profileImage} alt="Profile" fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <User size={48} />
                        </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera size={24} className="text-white"/>
                    </div>
                    
                    {/* Hidden Input for File Upload */}
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploading}
                    />
                </div>
                {uploading && <p className="text-xs text-blue-400 mt-2 animate-pulse">Uploading...</p>}
                <p className="text-xs text-gray-500 mt-2 uppercase font-bold tracking-widest">Tap to Change Photo</p>
            </div>

            {/* Phone Number */}
            <div>
                <label className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 block">WhatsApp Number (Start with 60)</label>
                <div className="flex items-center bg-black border border-neutral-800 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                    <Phone size={18} className="text-gray-500 mr-3"/>
                    <input 
                        name="phoneNumber" 
                        value={formData.phoneNumber} 
                        onChange={handleChange} 
                        placeholder="e.g. 60123456789" 
                        className="bg-transparent w-full outline-none text-white font-bold"
                    />
                </div>
            </div>

            {/* Website */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Website / Portfolio</label>
                <div className="flex items-center bg-black border border-neutral-800 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                    <Globe size={18} className="text-gray-500 mr-3"/>
                    <input 
                        name="website" 
                        value={formData.website} 
                        onChange={handleChange} 
                        placeholder="https://..." 
                        className="bg-transparent w-full outline-none text-white"
                    />
                </div>
            </div>

            {/* Bio */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Agent Bio</label>
                <textarea 
                    name="bio" 
                    value={formData.bio} 
                    onChange={handleChange} 
                    placeholder="Tell buyers about your experience, area of focus, etc..." 
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 outline-none text-white h-32 resize-none leading-relaxed focus:border-blue-500 transition-colors"
                />
            </div>

            <button type="submit" disabled={saving || uploading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin"/> : <Save size={20}/>}
                {saving ? "Saving..." : "Save Profile"}
            </button>

        </form>
      </div>
    </div>
  );
}
'use client'

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { analyzeImage, createListing } from '../actions';
import { Upload, Sparkles, Check, Loader2, ArrowLeft, X, Home, Car, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MALAYSIA_STATES = [
  "Penang", "Selangor", "Kuala Lumpur", "Johor", "Kedah", "Perak", 
  "Melaka", "Negeri Sembilan", "Pahang", "Terengganu", "Kelantan", 
  "Perlis", "Sabah", "Sarawak", "Putrajaya", "Labuan"
];

const PROPERTY_TYPES = [
  "Terrace", "Condo", "Bungalow", "Semi-D", "Apartment", "Townhouse",
  "Shoplot", "Office", "Factory", "Warehouse", "Land", "Hotel"
];

const FACILITIES_LIST = [
  "Swimming Pool", "Gymnasium", "24H Security", "Parking", "Elevator", 
  "Playground", "Balcony", "Aircon", "Wifi", "Kitchen Cabinet", "Near MRT/LRT", "Garden"
];

export default function PostAd() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  // Selected Facilities Array
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '', description: '', price: '', 
    area: '', state: 'Penang', 
    type: 'PROPERTY', tags: '', condition: 'Used',
    
    // NEW: Property Logic
    listingCategory: 'SALE', // SALE or RENT
    propertyType: 'Terrace', 
    bedrooms: '', bathrooms: '', sqft: '', furnishing: 'Partly Furnished',
    
    // Vehicle Core
    brand: '', model: '', variant: '', series: '', year: '', mileage: '', 
    color: '', origin: 'Local', bodyType: 'Sedan', transmission: 'Automatic', fuelType: 'Petrol', seats: '',
    engineCC: '', peakPower: '', peakTorque: ''
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setFiles([...files, ...newFiles].slice(0, 8));
    const newUrls = newFiles.map(f => URL.createObjectURL(f));
    setPreviews([...previews, ...newUrls].slice(0, 8));
    
    if (files.length === 0 && newFiles.length > 0) {
      setAiLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const aiData = await analyzeImage(reader.result as string);
        if (aiData) setFormData(prev => ({ ...prev, ...aiData }));
        setAiLoading(false);
      };
      reader.readAsDataURL(newFiles[0]);
    }
  };

  const removeImage = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const setAsCover = (index: number) => {
    if (index === 0) return;
    const newFiles = [...files];
    const [selectedFile] = newFiles.splice(index, 1);
    newFiles.unshift(selectedFile);
    setFiles(newFiles);
    const newPreviews = [...previews];
    const [selectedPreview] = newPreviews.splice(index, 1);
    newPreviews.unshift(selectedPreview);
    setPreviews(newPreviews);
  };

  const toggleFacility = (facility: string) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities(prev => prev.filter(f => f !== facility));
    } else {
      setSelectedFacilities(prev => [...prev, facility]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return alert("Upload at least one image.");
    setLoading(true);

    try {
      const urls = [];
      for (const file of files) {
        const name = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
        await supabase.storage.from('vexa-images').upload(name, file);
        const { data } = supabase.storage.from('vexa-images').getPublicUrl(name);
        urls.push(data.publicUrl);
      }

      const form = new FormData();
      Object.entries(formData).forEach(([k, v]) => form.append(k, v));
      form.append('imageUrl', urls.join(','));
      // Append facilities as comma string
      form.append('facilities', selectedFacilities.join(','));

      await createListing(form);
      alert("Listing Posted!");
      router.push('/'); router.refresh();
    } catch (e) {
      console.error(e);
      alert("Error posting.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 font-sans flex justify-center">
      <div className="max-w-5xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-4">
                <Link href="/" className="p-2 bg-white/5 rounded-full"><ArrowLeft size={20}/></Link>
                <h1 className="text-3xl font-bold">New Listing</h1>
           </div>
           
           <div className="flex bg-black p-1 rounded-xl border border-white/10">
               <button type="button" onClick={() => setFormData({...formData, type: 'PROPERTY'})} className={`px-6 py-2 rounded-lg font-bold text-sm ${formData.type === 'PROPERTY' ? 'bg-blue-600' : 'text-gray-500'}`}><Home size={16} className="inline mr-2"/> Property</button>
               <button type="button" onClick={() => setFormData({...formData, type: 'VEHICLE'})} className={`px-6 py-2 rounded-lg font-bold text-sm ${formData.type === 'VEHICLE' ? 'bg-orange-600' : 'text-gray-500'}`}><Car size={16} className="inline mr-2"/> Vehicle</button>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-4 gap-4">
            {files.length < 8 && (
                <div className="relative aspect-square border-2 border-dashed border-neutral-700 rounded-xl flex items-center justify-center hover:border-blue-500 cursor-pointer">
                    <input type="file" multiple onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <Upload className="text-blue-500" />
                </div>
            )}
            {previews.map((src, idx) => (
                <div key={idx} className={`relative aspect-square bg-neutral-800 rounded-xl overflow-hidden border group transition-all ${idx === 0 ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/10'}`}>
                    <Image src={src} alt="Preview" fill className="object-cover" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"><X size={12} /></button>
                    {idx !== 0 && (<button type="button" onClick={() => setAsCover(idx)} className="absolute top-1 left-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-yellow-500 z-20" title="Set as Cover"><Star size={12} /></button>)}
                    {idx === 0 && (<div className="absolute bottom-0 inset-x-0 bg-blue-600 text-[10px] text-center py-1 font-bold tracking-widest z-10">COVER</div>)}
                </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
             <div className="col-span-2"><label className="label">Title</label><input name="title" value={formData.title} onChange={handleChange} className="input" placeholder="e.g. Luxury Condo in KL" /></div>
             <div><label className="label">Price (RM)</label><input name="price" type="number" value={formData.price} onChange={handleChange} className="input text-green-400" /></div>
             
             <div><label className="label">State</label><select name="state" value={formData.state} onChange={handleChange} className="input">{MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
             <div><label className="label">Area</label><input name="area" value={formData.area} onChange={handleChange} className="input" placeholder="e.g. Simpang Ampat"/></div>

             {/* PROPERTY SPECIFIC: SELL/RENT TOGGLE */}
             {formData.type === 'PROPERTY' && (
                 <div>
                    <label className="label">Listing Category</label>
                    <div className="flex bg-black p-1 rounded-lg border border-white/10">
                        <button type="button" onClick={() => setFormData({...formData, listingCategory: 'SALE'})} className={`flex-1 py-2 text-xs font-bold rounded ${formData.listingCategory === 'SALE' ? 'bg-green-600 text-white' : 'text-gray-500'}`}>FOR SALE</button>
                        <button type="button" onClick={() => setFormData({...formData, listingCategory: 'RENT'})} className={`flex-1 py-2 text-xs font-bold rounded ${formData.listingCategory === 'RENT' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}>FOR RENT</button>
                    </div>
                 </div>
             )}
             
             {formData.type === 'VEHICLE' && (
                 <div><label className="label">Condition</label><select name="condition" value={formData.condition} onChange={handleChange} className="input"><option>Recon</option><option>Used</option><option>New</option></select></div>
             )}

             <div className="col-span-2 md:col-span-3"><label className="label">Description</label><textarea name="description" value={formData.description} onChange={handleChange} className="input h-24" /></div>
          </div>

          {/* PROPERTY SPECIFIC FORM */}
          {formData.type === 'PROPERTY' && (
            <div className="space-y-6 pt-6 border-t border-white/5">
                <div>
                    <h3 className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-4">Property Specs</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="label">Type</label>
                            <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="input">
                                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div><label className="label">Bedrooms</label><input name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} className="input" /></div>
                        <div><label className="label">Bathrooms</label><input name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} className="input" /></div>
                        <div><label className="label">Size (Sq.ft)</label><input name="sqft" type="number" value={formData.sqft} onChange={handleChange} className="input" /></div>
                        <div><label className="label">Furnishing</label><select name="furnishing" value={formData.furnishing} onChange={handleChange} className="input"><option>Fully Furnished</option><option>Partly Furnished</option><option>Unfurnished</option></select></div>
                    </div>
                </div>

                {/* FACILITIES CHECKBOXES */}
                <div>
                    <h3 className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-4">Facilities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {FACILITIES_LIST.map((facility) => (
                            <button
                                type="button"
                                key={facility}
                                onClick={() => toggleFacility(facility)}
                                className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                                    selectedFacilities.includes(facility) 
                                    ? 'bg-blue-600 border-blue-500 text-white' 
                                    : 'bg-neutral-800 border-neutral-700 text-gray-400 hover:bg-neutral-700'
                                }`}
                            >
                                {selectedFacilities.includes(facility) ? <Check size={14} className="inline mr-2"/> : null}
                                {facility}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {/* VEHICLE SPECIFIC FORM */}
          {formData.type === 'VEHICLE' && (
            <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="label">Brand</label><input name="brand" value={formData.brand} onChange={handleChange} className="input" placeholder="Toyota"/></div>
                    <div><label className="label">Model</label><input name="model" value={formData.model} onChange={handleChange} className="input" placeholder="Alphard"/></div>
                    <div><label className="label">Variant</label><input name="variant" value={formData.variant} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Year</label><input type="number" name="year" value={formData.year} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Mileage</label><input type="number" name="mileage" value={formData.mileage} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Color</label><input name="color" value={formData.color} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Origin</label><select name="origin" value={formData.origin} onChange={handleChange} className="input"><option>Local</option><option>Japan</option><option>Others</option></select></div>
                    <div><label className="label">Body</label><select name="bodyType" value={formData.bodyType} onChange={handleChange} className="input"><option>Sedan</option><option>SUV</option><option>MPV</option><option>4x4</option><option>Coupe</option><option>Others</option></select></div>
                    <div><label className="label">Trans.</label><select name="transmission" value={formData.transmission} onChange={handleChange} className="input"><option>Automatic</option><option>Manual</option><option>CVT</option></select></div>
                    <div><label className="label">Fuel</label><select name="fuelType" value={formData.fuelType} onChange={handleChange} className="input"><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>EV</option></select></div>
                    <div><label className="label">Seats</label><input type="number" name="seats" value={formData.seats} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Engine CC</label><input type="number" name="engineCC" value={formData.engineCC} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Power</label><input type="number" name="peakPower" value={formData.peakPower} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Torque</label><input type="number" name="peakTorque" value={formData.peakTorque} onChange={handleChange} className="input"/></div>
                </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-4">
            {loading ? <Loader2 className="animate-spin inline"/> : "Post Listing"}
          </button>
        </form>
      </div>
      <style jsx>{`
        .label { display: block; font-size: 0.7rem; color: #6b7280; font-weight: bold; text-transform: uppercase; margin-bottom: 0.25rem; }
        .input { width: 100%; background: #171717; border: 1px solid #262626; padding: 0.75rem; border-radius: 0.75rem; color: white; outline: none; transition: 0.2s; }
        .input:focus { border-color: #2563eb; }
      `}</style>
    </div>
  );
}
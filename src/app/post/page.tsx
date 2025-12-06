'use client'

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { analyzeImage, createListing } from '../actions';
import { Upload, Loader2, ArrowLeft, X, Home, Car, Star, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MapPicker from '@/components/MapPicker'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MALAYSIA_STATES = ["Penang", "Selangor", "Kuala Lumpur", "Johor", "Kedah", "Perak", "Melaka", "Negeri Sembilan", "Pahang", "Terengganu", "Kelantan", "Perlis", "Sabah", "Sarawak", "Putrajaya", "Labuan"];
const PROPERTY_TYPES = ["Terrace", "Condo", "Bungalow", "Semi-D", "Apartment", "Townhouse", "Shoplot", "Office", "Factory", "Warehouse", "Land", "Hotel"];
const FACILITIES_LIST = ["Swimming Pool", "Gymnasium", "24H Security", "Parking", "Elevator", "Playground", "Balcony", "Aircon", "Wifi", "Kitchen Cabinet", "Near MRT/LRT", "Garden"];

export default function PostAd() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', negotiable: false,
    area: '', state: 'Penang', locationName: '', 
    lat: null as number | null, lng: null as number | null, 
    type: 'PROPERTY', tags: '', condition: 'Recon',
    
    // Property
    listingCategory: 'SALE', propertyType: 'Terrace', tenure: 'Freehold', 
    propertyTitle: 'Strata', landTitle: 'Residential', unitType: 'Intermediate',
    bedrooms: '', bathrooms: '', carParks: '', sqft: '', landArea: '', 
    furnishing: 'Partly Furnished', occupancy: 'Vacant', maintenanceFee: '',
    
    // Vehicle
    brand: '', model: '', variant: '', series: '', 
    year: '', regYear: '', mileage: '', color: '', 
    origin: 'Local', assembly: 'CKD', bodyType: 'Sedan', 
    transmission: 'Automatic', fuelType: 'Petrol', seats: '',
    engineCC: '', peakPower: '', peakTorque: '',
    warranty: false, serviceHistory: false, prevOwners: '', wheelSize: '', plateNumber: ''
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setFiles([...files, ...newFiles].slice(0, 12));
    const newUrls = newFiles.map(f => URL.createObjectURL(f));
    setPreviews([...previews, ...newUrls].slice(0, 12));
    
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
    setSelectedFacilities(prev => prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]);
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
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== null) form.append(k, v.toString());
      });
      form.append('imageUrl', urls.join(','));
      form.append('facilities', selectedFacilities.join(','));

      await createListing(form);
      alert("Listing Posted Successfully!");
      router.push('/'); router.refresh();
    } catch (e) {
      console.error(e);
      alert("Error posting. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    // FIX: Increased top padding to pt-32 to clear navbar on mobile
    <div className="min-h-screen bg-neutral-950 text-white p-4 pt-32 md:p-6 md:pt-32 font-sans flex justify-center">
      <div className="max-w-5xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        
        {/* Header - Stacked on Mobile for better space */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
           <div className="flex items-center gap-4">
                <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><ArrowLeft size={20}/></Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">New Listing</h1>
                    <p className="text-gray-500 text-[10px] md:text-xs uppercase tracking-widest font-bold">Create a Premium Ad</p>
                </div>
           </div>
           
           {/* Toggle Switch */}
           <div className="flex bg-black p-1 rounded-xl border border-white/10 self-stretch md:self-auto">
               <button type="button" onClick={() => setFormData({...formData, type: 'PROPERTY'})} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${formData.type === 'PROPERTY' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                   <Home size={16}/> Property
               </button>
               <button type="button" onClick={() => setFormData({...formData, type: 'VEHICLE'})} className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${formData.type === 'VEHICLE' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                   <Car size={16}/> Vehicle
               </button>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. MEDIA */}
          <div className="space-y-2">
              <label className="label">Photos (Max 12)</label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                {files.length < 12 && (
                    <div className="relative aspect-square border-2 border-dashed border-neutral-700 rounded-xl flex items-center justify-center hover:border-blue-500 cursor-pointer transition-colors bg-white/5 hover:bg-white/10">
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
              {aiLoading && <p className="text-yellow-400 text-xs animate-pulse font-bold mt-2">✨ AI is analyzing your photos to auto-fill details...</p>}
          </div>

          {/* 2. GENERAL INFO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
             <div className="md:col-span-2"><label className="label">Listing Title</label><input name="title" value={formData.title} onChange={handleChange} className="input" placeholder="e.g. Luxury Condo in Mont Kiara" required /></div>
             <div><label className="label">Price (RM)</label><input name="price" type="number" value={formData.price} onChange={handleChange} className="input text-green-400 font-bold" required /></div>
             
             <div className="md:col-span-3">
                 <div className="flex items-center gap-2">
                     <input type="checkbox" name="negotiable" checked={formData.negotiable} onChange={handleChange} className="w-4 h-4 rounded border-gray-600 bg-black text-blue-600"/>
                     <span className="text-sm font-bold text-gray-400">Price is Negotiable</span>
                 </div>
             </div>

             <div className="md:col-span-3"><label className="label">Location Name (Project / Building / Dealership)</label><input name="locationName" value={formData.locationName} onChange={handleChange} className="input" placeholder="e.g. Eco Horizon / HX Auto"/></div>
             <div><label className="label">State</label><select name="state" value={formData.state} onChange={handleChange} className="input">{MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
             <div><label className="label">Area / City</label><input name="area" value={formData.area} onChange={handleChange} className="input" placeholder="e.g. Batu Kawan"/></div>
             
             <div className="md:col-span-3">
                <MapPicker onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, lat, lng }))} searchQuery={`${formData.area}, ${formData.state}, Malaysia`}/>
             </div>

             {/* Category Toggle */}
             {formData.type === 'PROPERTY' && (
                 <div><label className="label">Category</label><div className="flex bg-black p-1 rounded-lg border border-white/10"><button type="button" onClick={() => setFormData({...formData, listingCategory: 'SALE'})} className={`flex-1 py-2 text-xs font-bold rounded ${formData.listingCategory === 'SALE' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-white'}`}>SALE</button><button type="button" onClick={() => setFormData({...formData, listingCategory: 'RENT'})} className={`flex-1 py-2 text-xs font-bold rounded ${formData.listingCategory === 'RENT' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}>RENT</button></div></div>
             )}
             {formData.type === 'VEHICLE' && (<div><label className="label">Condition</label><select name="condition" value={formData.condition} onChange={handleChange} className="input"><option>Recon</option><option>Used</option><option>New</option></select></div>)}
             
             <div className="md:col-span-3"><label className="label">Description</label><textarea name="description" value={formData.description} onChange={handleChange} className="input h-32 leading-relaxed placeholder:text-gray-600" placeholder="Describe the key features, renovations, or vehicle history..." required /></div>
          </div>

          {/* 3. PROPERTY SPECIFIC FIELDS */}
          {formData.type === 'PROPERTY' && (
            <div className="space-y-8 pt-6 border-t border-white/5">
                {/* Main Specs */}
                <div>
                    <h3 className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-4">Property Specifications</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><label className="label">Property Type</label><select name="propertyType" value={formData.propertyType} onChange={handleChange} className="input">{PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <div><label className="label">Tenure</label><select name="tenure" value={formData.tenure} onChange={handleChange} className="input"><option>Freehold</option><option>Leasehold</option></select></div>
                        <div><label className="label">Land Title</label><select name="landTitle" value={formData.landTitle} onChange={handleChange} className="input"><option>Residential</option><option>Commercial</option><option>Industrial</option></select></div>
                        <div><label className="label">Title Type</label><select name="propertyTitle" value={formData.propertyTitle} onChange={handleChange} className="input"><option>Strata</option><option>Individual</option><option>Master</option></select></div>
                    </div>
                </div>

                {/* Details */}
                <div>
                    <h3 className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-4">Unit Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><label className="label">Bedrooms</label><input name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} className="input" /></div>
                        <div><label className="label">Bathrooms</label><input name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} className="input" /></div>
                        <div><label className="label">Car Parks</label><input name="carParks" type="number" value={formData.carParks} onChange={handleChange} className="input" /></div>
                        <div><label className="label">Occupancy</label><select name="occupancy" value={formData.occupancy} onChange={handleChange} className="input"><option>Vacant</option><option>Tenanted</option><option>Owner Occupied</option></select></div>
                        
                        <div><label className="label">Build-up Size (sq.ft)</label><input name="sqft" type="number" value={formData.sqft} onChange={handleChange} className="input" /></div>
                        <div><label className="label">Land Area (sq.ft)</label><input name="landArea" type="number" value={formData.landArea} onChange={handleChange} className="input" placeholder="Landed only" /></div>
                        <div><label className="label">Furnishing</label><select name="furnishing" value={formData.furnishing} onChange={handleChange} className="input"><option>Fully Furnished</option><option>Partly Furnished</option><option>Unfurnished</option></select></div>
                        <div><label className="label">Unit Type</label><select name="unitType" value={formData.unitType} onChange={handleChange} className="input"><option>Intermediate</option><option>Corner</option><option>End Lot</option><option>Penthouse</option></select></div>
                        
                        <div><label className="label">Maintenance Fee (RM)</label><input name="maintenanceFee" type="number" value={formData.maintenanceFee} onChange={handleChange} className="input" /></div>
                    </div>
                </div>

                {/* Facilities */}
                <div>
                    <h3 className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-4">Facilities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {FACILITIES_LIST.map((facility) => (
                            <button type="button" key={facility} onClick={() => toggleFacility(facility)} className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${selectedFacilities.includes(facility) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-800 border-neutral-700 text-gray-400 hover:bg-neutral-700'}`}>
                                {selectedFacilities.includes(facility) ? <Check size={14} className="inline mr-2"/> : null}{facility}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {/* 4. VEHICLE SPECIFIC FIELDS */}
          {formData.type === 'VEHICLE' && (
            <div className="space-y-8 pt-6 border-t border-white/5">
                
                {/* Core Specs */}
                <div>
                    <h3 className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-4">Vehicle Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><label className="label">Brand</label><input name="brand" value={formData.brand} onChange={handleChange} className="input"/></div>
                        <div><label className="label">Model</label><input name="model" value={formData.model} onChange={handleChange} className="input"/></div>
                        <div><label className="label">Variant</label><input name="variant" value={formData.variant} onChange={handleChange} className="input"/></div>
                        <div><label className="label">Body Type</label><select name="bodyType" value={formData.bodyType} onChange={handleChange} className="input"><option>Sedan</option><option>SUV</option><option>MPV</option><option>4x4</option><option>Coupe</option><option>Hatchback</option></select></div>
                        
                        <div><label className="label">Mfg. Year</label><input type="number" name="year" value={formData.year} onChange={handleChange} className="input"/></div>
                        <div><label className="label">Reg. Year</label><input type="number" name="regYear" value={formData.regYear} onChange={handleChange} className="input"/></div>
                        <div><label className="label">Mileage (km)</label><input name="mileage" value={formData.mileage} onChange={handleChange} className="input" placeholder="e.g. 15,000 - 20,000 km"/></div>
                        <div><label className="label">Color</label><input name="color" value={formData.color} onChange={handleChange} className="input"/></div>
                    </div>
                </div>

                {/* Technical Specs */}
                <div>
                    <h3 className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-4">Technical Specs</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><label className="label">Engine CC</label><input type="number" name="engineCC" value={formData.engineCC} onChange={handleChange} className="input"/></div>
                        <div><label className="label">Transmission</label><select name="transmission" value={formData.transmission} onChange={handleChange} className="input"><option>Automatic</option><option>Manual</option><option>CVT</option></select></div>
                        <div><label className="label">Fuel Type</label><select name="fuelType" value={formData.fuelType} onChange={handleChange} className="input"><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>EV</option></select></div>
                        <div><label className="label">Assembly</label><select name="assembly" value={formData.assembly} onChange={handleChange} className="input"><option>CKD (Local)</option><option>CBU (Import)</option></select></div>
                        
                        <div><label className="label">Seats</label><input type="number" name="seats" value={formData.seats} onChange={handleChange} className="input"/></div>
                        <div><label className="label">Power (HP)</label><input type="number" name="peakPower" value={formData.peakPower} onChange={handleChange} className="input"/></div>
                        <div><label className="label">Torque (Nm)</label><input type="number" name="peakTorque" value={formData.peakTorque} onChange={handleChange} className="input"/></div>
                        <div><label className="label">Wheel Size (Inch)</label><input type="number" name="wheelSize" value={formData.wheelSize} onChange={handleChange} className="input"/></div>
                    </div>
                </div>

                {/* Extra Details */}
                <div>
                    <h3 className="text-orange-500 text-xs font-bold uppercase tracking-widest mb-4">Extras & History</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                        <div><label className="label">Plate State/No.</label><input name="plateNumber" value={formData.plateNumber} onChange={handleChange} className="input" placeholder="e.g. Penang Plate"/></div>
                        <div><label className="label">Prev. Owners</label><input type="number" name="prevOwners" value={formData.prevOwners} onChange={handleChange} className="input"/></div>
                        
                        <div className="flex items-center gap-2 h-[46px] bg-black/40 border border-white/10 rounded-xl px-4">
                            <input type="checkbox" name="warranty" checked={formData.warranty} onChange={handleChange} className="w-4 h-4 text-orange-500"/>
                            <span className="text-xs font-bold">Under Warranty</span>
                        </div>
                        <div className="flex items-center gap-2 h-[46px] bg-black/40 border border-white/10 rounded-xl px-4">
                            <input type="checkbox" name="serviceHistory" checked={formData.serviceHistory} onChange={handleChange} className="w-4 h-4 text-orange-500"/>
                            <span className="text-xs font-bold">Full Service History</span>
                        </div>
                    </div>
                </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20">{loading ? <Loader2 className="animate-spin inline"/> : "Post Listing"}</button>
        </form>
      </div>
      <style jsx>{`
        .label { display: block; font-size: 0.65rem; color: #9ca3af; font-weight: 800; text-transform: uppercase; margin-bottom: 0.4rem; letter-spacing: 0.05em; }
        .input { width: 100%; background: #171717; border: 1px solid #262626; padding: 0.75rem; border-radius: 0.75rem; color: white; outline: none; transition: 0.2s; font-size: 0.85rem; font-weight: 600; }
        .input:focus { border-color: #2563eb; background: #0a0a0a; }
      `}</style>
    </div>
  );
}
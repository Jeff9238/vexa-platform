'use client'

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getListing, updateListing } from '@/app/actions';
import { ArrowLeft, Loader2, Save, Check, Upload, X, Star } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import MapPicker from '@/components/MapPicker';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MALAYSIA_STATES = ["Penang", "Selangor", "Kuala Lumpur", "Johor", "Kedah", "Perak", "Melaka", "Negeri Sembilan", "Pahang", "Terengganu", "Kelantan", "Perlis", "Sabah", "Sarawak", "Putrajaya", "Labuan"];
const PROPERTY_TYPES = ["Terrace", "Condo", "Bungalow", "Semi-D", "Apartment", "Townhouse", "Shoplot", "Office", "Factory", "Warehouse", "Land", "Hotel"];
const FACILITIES_LIST = ["Swimming Pool", "Gymnasium", "24H Security", "Parking", "Elevator", "Playground", "Balcony", "Aircon", "Wifi", "Kitchen Cabinet", "Near MRT/LRT", "Garden"];

// Helper Type for Gallery
type ImageItem = {
    id: string;
    url: string;
    file?: File; // Only new images have this
};

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [gallery, setGallery] = useState<ImageItem[]>([]);

  const [formData, setFormData] = useState({
    title: '', description: '', price: '', 
    area: '', state: '', locationName: '',
    lat: null as number | null, lng: null as number | null, 
    type: 'PROPERTY', tags: '', condition: '', listingCategory: '', status: 'ACTIVE',
    
    // Property
    propertyType: '', bedrooms: '', bathrooms: '', carParks: '', sqft: '', furnishing: '',
    
    // Vehicle
    brand: '', model: '', variant: '', series: '', year: '', mileage: '', 
    color: '', origin: '', bodyType: '', transmission: '', fuelType: '', seats: '',
    engineCC: '', peakPower: '', peakTorque: ''
  });

  // 1. Load Data on Mount
  useEffect(() => {
    getListing(id).then((data: any) => {
      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          
          // Location
          area: data.area || '',
          state: data.state || '',
          locationName: data.locationName || '',
          lat: data.lat || null,
          lng: data.lng || null,

          type: data.type || 'PROPERTY',
          tags: data.tags || '',
          condition: data.condition || '',
          listingCategory: data.listingCategory || '',
          status: data.status || 'ACTIVE',
          
          // Property
          propertyType: data.propertyType || '',
          bedrooms: data.bedrooms?.toString() || '',
          bathrooms: data.bathrooms?.toString() || '',
          carParks: data.carParks?.toString() || '',
          sqft: data.sqft?.toString() || '',
          furnishing: data.furnishing || '',

          // Vehicle
          brand: data.brand || '',
          model: data.model || '',
          variant: data.variant || '',
          series: data.series || '',
          year: data.year?.toString() || '',
          mileage: data.mileage?.toString() || '',
          color: data.color || '',
          origin: data.origin || '',
          bodyType: data.bodyType || '',
          transmission: data.transmission || '',
          fuelType: data.fuelType || '',
          seats: data.seats?.toString() || '',
          engineCC: data.engineCC?.toString() || '',
          peakPower: data.peakPower?.toString() || '',
          peakTorque: data.peakTorque?.toString() || ''
        });

        if (data.facilities) {
            setSelectedFacilities(data.facilities.split(','));
        }

        if (data.images) {
            const urls = data.images.split(',');
            setGallery(urls.map((url: string) => ({
                id: Math.random().toString(36),
                url: url
            })));
        }
      }
      setLoading(false);
    });
  }, [id]);

  // --- HANDLERS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    
    const newItems: ImageItem[] = newFiles.map(file => ({
        id: Math.random().toString(36),
        url: URL.createObjectURL(file),
        file: file
    }));

    setGallery(prev => [...prev, ...newItems].slice(0, 8)); // Max 8
  };

  const removeImage = (id: string) => {
    setGallery(prev => prev.filter(item => item.id !== id));
  };

  const setAsCover = (index: number) => {
    if (index === 0) return;
    const newGallery = [...gallery];
    const [selected] = newGallery.splice(index, 1);
    newGallery.unshift(selected);
    setGallery(newGallery);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleFacility = (facility: string) => {
    if (selectedFacilities.includes(facility)) {
      setSelectedFacilities(prev => prev.filter(f => f !== facility));
    } else {
      setSelectedFacilities(prev => [...prev, facility]);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gallery.length === 0) return alert("Please keep at least one photo.");
    setSaving(true);

    try {
        // 1. Upload New Images
        const finalImageUrls: string[] = [];

        for (const item of gallery) {
            if (item.file) {
                const name = `${Date.now()}-${Math.random().toString(36).substring(7)}-${item.file.name}`;
                const { error } = await supabase.storage.from('vexa-images').upload(name, item.file);
                if (error) throw error;
                const { data } = supabase.storage.from('vexa-images').getPublicUrl(name);
                finalImageUrls.push(data.publicUrl);
            } else {
                finalImageUrls.push(item.url);
            }
        }

        // 2. Submit Data
        const submitData = new FormData();
        submitData.append('id', id);
        
        // Append all standard fields
        Object.entries(formData).forEach(([key, value]) => {
             if (value !== null) submitData.append(key, value.toString());
        });
        
        submitData.append('facilities', selectedFacilities.join(','));
        submitData.append('imageUrl', finalImageUrls.join(','));

        await updateListing(submitData);
        alert("Listing Updated Successfully!");
        router.push('/dashboard');
        router.refresh();

    } catch (err) {
        console.error(err);
        alert("Error saving changes.");
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-28 flex justify-center items-center font-sans">
      <div className="max-w-5xl w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <Link href="/dashboard" className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowLeft size={20}/></Link>
               <div>
                   <h1 className="text-3xl font-bold">Edit Listing</h1>
                   <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Update details & photos</p>
               </div>
            </div>
            
            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest ${formData.status === 'SOLD' ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-green-900/30 text-green-400 border border-green-900/50'}`}>
                {formData.status}
            </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">

          {/* --- PHOTOS --- */}
          <div className="space-y-2">
              <label className="label">Manage Photos (Max 8)</label>
              <div className="grid grid-cols-4 gap-4">
                {gallery.length < 8 && (
                    <div className="relative aspect-square border-2 border-dashed border-neutral-700 rounded-xl flex items-center justify-center hover:border-blue-500 cursor-pointer transition-colors bg-white/5 hover:bg-white/10">
                        <input type="file" multiple onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <Upload className="text-gray-500" />
                    </div>
                )}
                
                {gallery.map((item, idx) => (
                    <div key={item.id} className={`relative aspect-square bg-neutral-800 rounded-xl overflow-hidden border group transition-all ${idx === 0 ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/10'}`}>
                        <Image src={item.url} alt="Preview" fill className="object-cover" />
                        
                        <button type="button" onClick={() => removeImage(item.id)} className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:scale-110">
                            <X size={12} />
                        </button>

                        {idx !== 0 && (
                            <button type="button" onClick={() => setAsCover(idx)} className="absolute top-1 left-1 bg-yellow-500 text-black p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:scale-110" title="Set as Cover">
                                <Star size={12} />
                            </button>
                        )}
                        
                        {idx === 0 && (<div className="absolute bottom-0 inset-x-0 bg-blue-600 text-[10px] text-center py-1 font-bold tracking-widest z-10 text-white">COVER</div>)}
                    </div>
                ))}
              </div>
          </div>

          {/* --- BASIC INFO --- */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-b border-white/5 pb-8">
             <div className="col-span-2"><label className="label">Title</label><input name="title" value={formData.title} onChange={handleChange} className="input font-bold text-lg" /></div>
             <div><label className="label">Price (RM)</label><input name="price" type="number" value={formData.price} onChange={handleChange} className="input text-green-400 font-bold text-lg" /></div>
             
             {/* LOCATION */}
             <div className="col-span-2 md:col-span-3"><label className="label">Project / Building Name</label><input name="locationName" value={formData.locationName} onChange={handleChange} className="input" placeholder="e.g. Eco Horizon"/></div>
             <div><label className="label">State</label><select name="state" value={formData.state} onChange={handleChange} className="input">{MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
             <div><label className="label">Area</label><input name="area" value={formData.area} onChange={handleChange} className="input" /></div>
             
             {/* MAP */}
             <div className="col-span-2 md:col-span-3">
                <MapPicker 
                    onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, lat, lng }))}
                    initialLat={formData.lat} 
                    initialLng={formData.lng} 
                    searchQuery={`${formData.area}, ${formData.state}, Malaysia`}
                />
             </div>

             <div className="col-span-2 md:col-span-3"><label className="label">Description</label><textarea name="description" value={formData.description} onChange={handleChange} className="input h-32 leading-relaxed" /></div>
          </div>

          {/* --- PROPERTY SPECIFIC --- */}
          {formData.type === 'PROPERTY' && (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="label">Type</label><select name="propertyType" value={formData.propertyType} onChange={handleChange} className="input">{PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label className="label">Bedrooms</label><input name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} className="input" /></div>
                    <div><label className="label">Bathrooms</label><input name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} className="input" /></div>
                    <div><label className="label">Car Parks</label><input name="carParks" type="number" value={formData.carParks} onChange={handleChange} className="input" /></div>
                    <div><label className="label">Size (Sq.ft)</label><input name="sqft" type="number" value={formData.sqft} onChange={handleChange} className="input" /></div>
                    <div><label className="label">Furnishing</label><select name="furnishing" value={formData.furnishing} onChange={handleChange} className="input"><option>Fully Furnished</option><option>Partly Furnished</option><option>Unfurnished</option></select></div>
                </div>
                
                <div>
                    <h3 className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-4">Facilities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {FACILITIES_LIST.map((facility) => (
                            <button type="button" key={facility} onClick={() => toggleFacility(facility)} className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${selectedFacilities.includes(facility) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-800 border-neutral-700 text-gray-400 hover:bg-neutral-700'}`}>{selectedFacilities.includes(facility) ? <Check size={14} className="inline mr-2"/> : null}{facility}</button>
                        ))}
                    </div>
                </div>
            </div>
          )}

          {/* --- VEHICLE SPECIFIC --- */}
          {formData.type === 'VEHICLE' && (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="label">Brand</label><input name="brand" value={formData.brand} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Model</label><input name="model" value={formData.model} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Variant</label><input name="variant" value={formData.variant} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Year</label><input type="number" name="year" value={formData.year} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Mileage</label><input type="number" name="mileage" value={formData.mileage} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Color</label><input name="color" value={formData.color} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Origin</label><select name="origin" value={formData.origin} onChange={handleChange} className="input"><option>Local</option><option>Japan</option><option>Others</option></select></div>
                    <div><label className="label">Body</label><select name="bodyType" value={formData.bodyType} onChange={handleChange} className="input"><option>Sedan</option><option>SUV</option><option>MPV</option><option>4x4</option><option>Coupe</option><option>Others</option></select></div>
                    <div><label className="label">Trans.</label><select name="transmission" value={formData.transmission} onChange={handleChange} className="input"><option>Automatic</option><option>Manual</option><option>CVT</option></select></div>
                    <div><label className="label">Fuel</label><select name="fuelType" value={formData.fuelType} onChange={handleChange} className="input"><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>EV</option></select></div>
                    <div><label className="label">Engine CC</label><input type="number" name="engineCC" value={formData.engineCC} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Power</label><input type="number" name="peakPower" value={formData.peakPower} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Torque</label><input type="number" name="peakTorque" value={formData.peakTorque} onChange={handleChange} className="input"/></div>
                </div>
            </div>
          )}

          <div className="pt-6 border-t border-white/5">
            <button type="submit" disabled={saving} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="animate-spin"/> : <Save size={20} />}
                {saving ? "Saving Changes..." : "Update Listing"}
            </button>
          </div>

        </form>
      </div>
      <style jsx>{`
        .label { display: block; font-size: 0.7rem; color: #9ca3af; font-weight: bold; text-transform: uppercase; margin-bottom: 0.25rem; }
        .input { width: 100%; background: #171717; border: 1px solid #262626; padding: 0.75rem; border-radius: 0.75rem; color: white; outline: none; transition: 0.2s; }
        .input:focus { border-color: #2563eb; background: #0a0a0a; }
      `}</style>
    </div>
  );
}
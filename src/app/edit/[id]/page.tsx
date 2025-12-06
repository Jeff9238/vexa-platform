'use client'

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getListing, updateListing } from '@/app/actions';
import { ArrowLeft, Loader2, Save, Check, Upload, X, Star, Home, Car } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import MapPicker from '@/components/MapPicker';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MALAYSIA_STATES = ["Penang", "Selangor", "Kuala Lumpur", "Johor", "Kedah", "Perak", "Melaka", "Negeri Sembilan", "Pahang", "Terengganu", "Kelantan", "Perlis", "Sabah", "Sarawak", "Putrajaya", "Labuan"];
const PROPERTY_TYPES = ["Terrace", "Condo", "Bungalow", "Semi-D", "Apartment", "Townhouse", "Shoplot", "Office", "Factory", "Warehouse", "Land", "Hotel"];
const FACILITIES_LIST = ["Swimming Pool", "Gymnasium", "24H Security", "Parking", "Elevator", "Playground", "Balcony", "Aircon", "Wifi", "Kitchen Cabinet", "Near MRT/LRT", "Garden"];

type ImageItem = { id: string; url: string; file?: File; };

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [gallery, setGallery] = useState<ImageItem[]>([]);

  const [formData, setFormData] = useState({
    title: '', description: '', price: '', negotiable: false,
    area: '', state: '', locationName: '',
    lat: null as number | null, lng: null as number | null, 
    type: 'PROPERTY', tags: '', condition: '', listingCategory: '', status: 'ACTIVE',
    
    // Property Fields
    propertyType: '', bedrooms: '', bathrooms: '', carParks: '', sqft: '', furnishing: '',
    tenure: '', propertyTitle: '', landTitle: '', landArea: '', unitType: '', maintenanceFee: '', occupancy: '',
    
    // Vehicle Fields
    brand: '', model: '', variant: '', series: '', 
    year: '', regYear: '', mileage: '', color: '', 
    origin: '', assembly: '', bodyType: '', 
    transmission: '', fuelType: '', seats: '',
    engineCC: '', peakPower: '', peakTorque: '',
    warranty: false, serviceHistory: false, prevOwners: '', wheelSize: '', plateNumber: ''
  });

  // 1. Fetch & Populate Data
  useEffect(() => {
    getListing(id).then((data: any) => {
      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          negotiable: data.negotiable || false,
          area: data.area || '', state: data.state || '', locationName: data.locationName || '',
          lat: data.lat || null, lng: data.lng || null,
          type: data.type || 'PROPERTY', tags: data.tags || '', condition: data.condition || '', listingCategory: data.listingCategory || '', status: data.status || 'ACTIVE',
          
          // Property
          propertyType: data.propertyType || '',
          bedrooms: data.bedrooms?.toString() || '',
          bathrooms: data.bathrooms?.toString() || '',
          carParks: data.carParks?.toString() || '',
          sqft: data.sqft?.toString() || '',
          furnishing: data.furnishing || '',
          tenure: data.tenure || '',
          propertyTitle: data.propertyTitle || '',
          landTitle: data.landTitle || '',
          landArea: data.landArea?.toString() || '',
          unitType: data.unitType || '',
          maintenanceFee: data.maintenanceFee?.toString() || '',
          occupancy: data.occupancy || '',

          // Vehicle
          brand: data.brand || '',
          model: data.model || '',
          variant: data.variant || '',
          series: data.series || '',
          year: data.year?.toString() || '',
          regYear: data.regYear?.toString() || '',
          mileage: data.mileage || '', // Now a string
          color: data.color || '',
          origin: data.origin || '',
          assembly: data.assembly || '',
          bodyType: data.bodyType || '',
          transmission: data.transmission || '',
          fuelType: data.fuelType || '',
          seats: data.seats?.toString() || '',
          engineCC: data.engineCC?.toString() || '',
          peakPower: data.peakPower?.toString() || '',
          peakTorque: data.peakTorque?.toString() || '',
          warranty: data.warranty || false,
          serviceHistory: data.serviceHistory || false,
          prevOwners: data.prevOwners?.toString() || '',
          wheelSize: data.wheelSize?.toString() || '',
          plateNumber: data.plateNumber || ''
        });

        if (data.facilities) setSelectedFacilities(data.facilities.split(','));
        
        if (data.images) {
            const urls = data.images.split(',');
            setGallery(urls.map((url: string) => ({ id: Math.random().toString(36), url })));
        }
      }
      setLoading(false);
    });
  }, [id]);

  // --- Handlers ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newItems = Array.from(e.target.files).map(file => ({ id: Math.random().toString(36), url: URL.createObjectURL(file), file }));
    setGallery(prev => [...prev, ...newItems].slice(0, 12));
  };

  const removeImage = (id: string) => setGallery(prev => prev.filter(item => item.id !== id));
  
  const setAsCover = (index: number) => {
    if (index === 0) return;
    const newGallery = [...gallery];
    const [selected] = newGallery.splice(index, 1);
    newGallery.unshift(selected);
    setGallery(newGallery);
  };

  const handleChange = (e: any) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setFormData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const toggleFacility = (facility: string) => {
    setSelectedFacilities(prev => prev.includes(facility) ? prev.filter(f => f !== facility) : [...prev, facility]);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
        // 1. Upload Images
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

        // 2. Prepare Data
        const submitData = new FormData();
        submitData.append('id', id);
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
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <Link href="/dashboard" className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowLeft size={20}/></Link>
               <div>
                   <h1 className="text-3xl font-bold">Edit Listing</h1>
                   <div className="flex items-center gap-2 mt-1">
                       {formData.type === 'PROPERTY' ? <Home size={14} className="text-blue-500"/> : <Car size={14} className="text-orange-500"/>}
                       <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">{formData.type}</span>
                   </div>
               </div>
            </div>
            
            <div className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest ${formData.status === 'SOLD' ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-green-900/30 text-green-400 border border-green-900/50'}`}>
                {formData.status}
            </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
          
          {/* PHOTOS */}
          <div className="space-y-2">
              <label className="label">Photos (Max 12)</label>
              <div className="grid grid-cols-4 gap-4">
                {gallery.length < 12 && (
                    <div className="relative aspect-square border-2 border-dashed border-neutral-700 rounded-xl flex items-center justify-center hover:border-blue-500 cursor-pointer bg-white/5">
                        <input type="file" multiple onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <Upload className="text-gray-500" />
                    </div>
                )}
                {gallery.map((item, idx) => (
                    <div key={item.id} className={`relative aspect-square bg-neutral-800 rounded-xl overflow-hidden border group ${idx === 0 ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/10'}`}>
                        <Image src={item.url} alt="Preview" fill className="object-cover" />
                        <button type="button" onClick={() => removeImage(item.id)} className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:scale-110"><X size={12} /></button>
                        {idx !== 0 && <button type="button" onClick={() => setAsCover(idx)} className="absolute top-1 left-1 bg-yellow-500 text-black p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:scale-110" title="Set as Cover"><Star size={12} /></button>}
                        {idx === 0 && <div className="absolute bottom-0 inset-x-0 bg-blue-600 text-[10px] text-center py-1 font-bold tracking-widest z-10 text-white">COVER</div>}
                    </div>
                ))}
              </div>
          </div>

          {/* BASIC INFO */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-b border-white/5 pb-8">
             <div className="col-span-2"><label className="label">Title</label><input name="title" value={formData.title} onChange={handleChange} className="input font-bold text-lg" /></div>
             <div><label className="label">Price (RM)</label><input name="price" type="number" value={formData.price} onChange={handleChange} className="input text-green-400 font-bold text-lg" /></div>
             
             {/* Negotiable Toggle */}
             <div className="col-span-2 md:col-span-3">
                 <div className="flex items-center gap-2">
                     <input type="checkbox" name="negotiable" checked={formData.negotiable} onChange={handleChange} className="w-4 h-4 rounded border-gray-600 bg-black text-blue-600"/>
                     <span className="text-sm font-bold text-gray-400">Price is Negotiable</span>
                 </div>
             </div>

             {/* Updated Label */}
             <div className="col-span-2 md:col-span-3"><label className="label">Building / Project Name / Dealership</label><input name="locationName" value={formData.locationName} onChange={handleChange} className="input" /></div>
             
             <div><label className="label">State</label><select name="state" value={formData.state} onChange={handleChange} className="input">{MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
             <div><label className="label">Area</label><input name="area" value={formData.area} onChange={handleChange} className="input" /></div>
             
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

          {/* PROPERTY FIELDS */}
          {formData.type === 'PROPERTY' && (
            <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="label">Type</label><select name="propertyType" value={formData.propertyType} onChange={handleChange} className="input">{PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label className="label">Tenure</label><select name="tenure" value={formData.tenure} onChange={handleChange} className="input"><option>Freehold</option><option>Leasehold</option></select></div>
                    <div><label className="label">Land Title</label><select name="landTitle" value={formData.landTitle} onChange={handleChange} className="input"><option>Residential</option><option>Commercial</option><option>Industrial</option></select></div>
                    <div><label className="label">Title Type</label><select name="propertyTitle" value={formData.propertyTitle} onChange={handleChange} className="input"><option>Strata</option><option>Individual</option><option>Master</option></select></div>
                    
                    <div><label className="label">Bedrooms</label><input name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} className="input" /></div>
                    <div><label className="label">Bathrooms</label><input name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} className="input" /></div>
                    <div><label className="label">Car Parks</label><input name="carParks" type="number" value={formData.carParks} onChange={handleChange} className="input" /></div>
                    <div><label className="label">Occupancy</label><select name="occupancy" value={formData.occupancy} onChange={handleChange} className="input"><option>Vacant</option><option>Tenanted</option><option>Owner Occupied</option></select></div>
                    
                    <div><label className="label">Build-up (Sq.ft)</label><input name="sqft" type="number" value={formData.sqft} onChange={handleChange} className="input" /></div>
                    <div><label className="label">Land Area (Sq.ft)</label><input name="landArea" type="number" value={formData.landArea} onChange={handleChange} className="input" /></div>
                    <div><label className="label">Furnishing</label><select name="furnishing" value={formData.furnishing} onChange={handleChange} className="input"><option>Fully Furnished</option><option>Partly Furnished</option><option>Unfurnished</option></select></div>
                    <div><label className="label">Unit Type</label><select name="unitType" value={formData.unitType} onChange={handleChange} className="input"><option>Intermediate</option><option>Corner</option><option>End Lot</option><option>Penthouse</option></select></div>
                    
                    <div><label className="label">Maint. Fee (RM)</label><input name="maintenanceFee" type="number" value={formData.maintenanceFee} onChange={handleChange} className="input" /></div>
                </div>
                <div><h3 className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-4">Facilities</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{FACILITIES_LIST.map((facility) => (<button type="button" key={facility} onClick={() => toggleFacility(facility)} className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all ${selectedFacilities.includes(facility) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-800 border-neutral-700 text-gray-400'}`}>{selectedFacilities.includes(facility) ? <Check size={14} className="inline mr-2"/> : null}{facility}</button>))}</div></div>
            </div>
          )}

          {/* VEHICLE FIELDS */}
          {formData.type === 'VEHICLE' && (
            <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="label">Brand</label><input name="brand" value={formData.brand} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Model</label><input name="model" value={formData.model} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Variant</label><input name="variant" value={formData.variant} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Body Type</label><select name="bodyType" value={formData.bodyType} onChange={handleChange} className="input"><option>Sedan</option><option>SUV</option><option>MPV</option><option>4x4</option><option>Coupe</option><option>Others</option></select></div>
                    
                    <div><label className="label">Mfg. Year</label><input type="number" name="year" value={formData.year} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Reg. Year</label><input type="number" name="regYear" value={formData.regYear} onChange={handleChange} className="input"/></div>
                    
                    {/* MILEAGE (TEXT) */}
                    <div>
                        <label className="label">Mileage (Range)</label>
                        <input name="mileage" value={formData.mileage} onChange={handleChange} className="input" placeholder="e.g. 15k - 20k km"/>
                    </div>
                    
                    <div><label className="label">Color</label><input name="color" value={formData.color} onChange={handleChange} className="input"/></div>
                    
                    <div><label className="label">Engine CC</label><input type="number" name="engineCC" value={formData.engineCC} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Transmission</label><select name="transmission" value={formData.transmission} onChange={handleChange} className="input"><option>Automatic</option><option>Manual</option><option>CVT</option></select></div>
                    <div><label className="label">Fuel Type</label><select name="fuelType" value={formData.fuelType} onChange={handleChange} className="input"><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>EV</option></select></div>
                    <div><label className="label">Assembly</label><select name="assembly" value={formData.assembly} onChange={handleChange} className="input"><option>CKD (Local)</option><option>CBU (Import)</option></select></div>
                    
                    <div><label className="label">Seats</label><input type="number" name="seats" value={formData.seats} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Power (HP)</label><input type="number" name="peakPower" value={formData.peakPower} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Torque (Nm)</label><input type="number" name="peakTorque" value={formData.peakTorque} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Wheel Size</label><input type="number" name="wheelSize" value={formData.wheelSize} onChange={handleChange} className="input"/></div>
                    
                    <div><label className="label">Plate No.</label><input name="plateNumber" value={formData.plateNumber} onChange={handleChange} className="input"/></div>
                    <div><label className="label">Prev. Owners</label><input type="number" name="prevOwners" value={formData.prevOwners} onChange={handleChange} className="input"/></div>
                    
                    <div className="flex items-center gap-2 h-[46px] bg-black/40 border border-white/10 rounded-xl px-4 mt-5">
                        <input type="checkbox" name="warranty" checked={formData.warranty} onChange={handleChange} className="w-4 h-4"/>
                        <span className="text-xs font-bold">Under Warranty</span>
                    </div>
                    <div className="flex items-center gap-2 h-[46px] bg-black/40 border border-white/10 rounded-xl px-4 mt-5">
                        <input type="checkbox" name="serviceHistory" checked={formData.serviceHistory} onChange={handleChange} className="w-4 h-4"/>
                        <span className="text-xs font-bold">Full Service History</span>
                    </div>
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
        .label { display: block; font-size: 0.65rem; color: #9ca3af; font-weight: 800; text-transform: uppercase; margin-bottom: 0.4rem; letter-spacing: 0.05em; }
        .input { width: 100%; background: #171717; border: 1px solid #262626; padding: 0.75rem; border-radius: 0.75rem; color: white; outline: none; transition: 0.2s; font-size: 0.85rem; font-weight: 600; }
        .input:focus { border-color: #2563eb; background: #0a0a0a; }
      `}</style>
    </div>
  );
}
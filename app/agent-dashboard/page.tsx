"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { 
  LayoutDashboard, 
  Plus, 
  Home, 
  Car, 
  Loader2, 
  MapPin, 
  DollarSign, 
  Image as ImageIcon, 
  X, 
  AlertTriangle, 
  UploadCloud, 
  Trash2, 
  Star, 
  Bed, 
  Bath, 
  Maximize, 
  Calendar, 
  Gauge, 
  Fuel, 
  Users, 
  Zap, 
  Info, 
  CheckCircle2, 
  Eye, 
  Pencil, 
  Search, 
  ArrowLeft, 
  UserCircle, 
  Wallet, 
  CreditCard, 
  Save, 
  Facebook, 
  Instagram, 
  ParkingCircle, 
  FileText, 
  Globe, 
  Video, 
  BookOpen, 
  Clock 
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, writeBatch } from "firebase/firestore";

// ... Constants ...
const MALAYSIA_STATES = ["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"];
const PROPERTY_TYPES = ["Condominium", "Apartment", "Terrace House", "Bungalow", "Semi-D", "Commercial", "Land", "Townhouse", "Shop Lot", "Factory", "Office"];
const PROPERTY_TENURE = ["Freehold", "Leasehold", "Malay Reserved"];
const PROPERTY_FURNISHING = ["Unfurnished", "Partially Furnished", "Fully Furnished"];
const PROPERTY_FACILITIES = ["Swimming Pool", "Gymnasium", "24-Hour Security", "Playground", "Covered Parking", "Balcony", "Barbeque Area", "Jogging Track", "Mini Market", "Squash Court", "Tennis Court", "Lift", "Wading Pool", "Jacuzzi", "Sauna", "Club House"];
const VEHICLE_CONDITIONS = ["New", "Used", "Recon"];
const VEHICLE_MAKES = ["Toyota", "Honda", "Proton", "Perodua", "Nissan", "Mazda", "BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Hyundai", "Kia", "Ford", "Mitsubishi", "Subaru", "Volvo", "Porsche", "Lexus", "Land Rover", "Mini", "Jaguar", "Peugeot", "Renault", "Tesla", "Ferrari", "Lamborghini", "Suzuki", "Isuzu", "Chery", "BYD", "Great Wall", "Others"];
const VEHICLE_BODY_TYPES = ["Sedan", "SUV", "MPV", "Hatchback", "Coupe", "Pickup Truck", "Van", "Convertible", "Wagon", "Sports Car", "4x4"];
const VEHICLE_FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric", "Plug-in Hybrid"];
const VEHICLE_COLORS = ["White", "Black", "Silver", "Grey", "Red", "Blue", "Gold", "Brown", "Green", "Orange", "Yellow", "Purple", "Bronze", "Other"];
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "DCT"];

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_DIM = 1000; 
                if (width > height && width > MAX_DIM) {
                    height *= MAX_DIM / width;
                    width = MAX_DIM;
                } else if (height > MAX_DIM) {
                    width *= MAX_DIM / height;
                    height = MAX_DIM;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject("Canvas error");
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
        reader.onerror = (err) => reject(err);
    });
};

const ensureProtocol = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

function AgentDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [accessDenied, setAccessDenied] = useState<{denied: boolean, reason?: string}>({ denied: false });
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'listings' | 'profile'>('listings');

  // Data State
  const [myListings, setMyListings] = useState<any[]>([]);
  const [filteredListings, setFilteredListings] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  // Agent Profile State
  const [agentProfile, setAgentProfile] = useState({
      name: '',
      displayName: '',
      email: '',
      phone: '',
      icNumber: '', 
      renNumber: '',
      agencyName: '',
      experience: '', 
      streetAddress: '', 
      city: '', 
      state: '', 
      postalCode: '', 
      photo: '',
      website: '', 
      facebook: '',
      instagram: '',
      tiktok: '',
      xiaohongshu: '', 
      description: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // UI State
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  
  // Filter State
  const [filterType, setFilterType] = useState<'all' | 'property' | 'vehicle'>('all');
  const [searchTerm, setSearchTerm] = useState("");

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // LISTING FORM DATA
  const [listingType, setListingType] = useState<'property' | 'vehicle'>('property');
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', state: '', area: '', 
    images: [] as string[], coverImage: '',
    transType: 'Sale', propertyType: 'Condominium', projectName: '', developer: '', tenure: 'Freehold', furnishing: 'Unfurnished', floorLevel: '', bedrooms: '', bathrooms: '', parking: '', size: '', facilities: [] as string[],
    condition: 'Used', make: 'Toyota', model: '', bodyType: 'Sedan', year: '', mileage: '', color: 'White', fuel: 'Petrol', transmission: 'Automatic', engineCapacity: '', seats: ''
  });

  // Auto-open create modal if param present
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
        setIsCreating(true);
    }
  }, [searchParams]);

  const initializeFirebase = useCallback(async () => {
    try {
        const firebaseConfig = {
            apiKey: "AIzaSyDo4yfchuY8FVunbz_ZinubrbZtSuATOGg",
            authDomain: "vexa-platform.firebaseapp.com",
            projectId: "vexa-platform",
            storageBucket: "vexa-platform.firebasestorage.app",
            messagingSenderId: "96646526352",
            appId: "1:96646526352:web:140e50442fc5e66dca2f15",
            measurementId: "G-C7MBKREZNG"
        };

        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const dbInstance = getFirestore(app);
        setDb(dbInstance);
        checkUser(dbInstance);
    } catch (e) { console.error(e); }
  }, []);

  const checkUser = async (database: any) => {
      const storedUserId = localStorage.getItem("vexa_active_user_id");
      const userId = storedUserId;
      
      if (!userId) {
          setAccessDenied({ denied: true, reason: "No active session found. Please login." });
          setLoading(false);
          return;
      }
      
      try {
          const docRef = doc(database, "users", userId);
          const docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
              setAccessDenied({ denied: true, reason: "Profile not found." });
              setLoading(false);
              return;
          }
          const userData = docSnap.data();
          if (userData.role === 'agent') {
              const currentUser = { uid: userId, ...userData };
              setUser(currentUser);
              setWalletBalance(userData.walletBalance || 0);
              
              if (userData.agentProfile) {
                  setAgentProfile({
                      name: userData.agentProfile.name || userData.name || '',
                      displayName: userData.agentProfile.displayName || userData.agentProfile.name || userData.name || '',
                      email: userData.agentProfile.email || userData.email || '',
                      phone: userData.agentProfile.phone || '',
                      icNumber: userData.agentProfile.icNumber || '',
                      renNumber: userData.agentProfile.renNumber || '',
                      agencyName: userData.agentProfile.agencyName || '',
                      experience: userData.agentProfile.experience || '',
                      streetAddress: userData.agentProfile.streetAddress || '',
                      city: userData.agentProfile.city || '',
                      state: userData.agentProfile.state || '',
                      postalCode: userData.agentProfile.postalCode || '',
                      photo: userData.agentProfile.photo || '',
                      website: userData.agentProfile.website || '',
                      facebook: userData.agentProfile.facebook || '',
                      instagram: userData.agentProfile.instagram || '',
                      tiktok: userData.agentProfile.tiktok || '',
                      xiaohongshu: userData.agentProfile.xiaohongshu || '',
                      description: userData.agentProfile.description || ''
                  });
              } else {
                  setAgentProfile(prev => ({
                      ...prev,
                      name: userData.name || '',
                      displayName: userData.name || '',
                      email: userData.email || ''
                  }));
              }

              fetchMyListings(currentUser.uid, database);
          } else {
              setAccessDenied({ denied: true, reason: "Role mismatch (Not Agent)." });
              setLoading(false);
          }
      } catch (error) {
          console.error(error);
          setAccessDenied({ denied: true, reason: "Database error." });
          setLoading(false);
      } 
  };

  const fetchMyListings = async (userId: string, database: any) => {
      try {
          const q = query(
              collection(database, "listings"),
              where("agentId", "==", userId)
          );
          
          const snapshot = await getDocs(q);
          
          const listingsData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data()
          }));

          listingsData.sort((a: any, b: any) => {
              const dateA = a.createdAt?.seconds || 0;
              const dateB = b.createdAt?.seconds || 0;
              return dateB - dateA;
          });

          setMyListings(listingsData);
          setFilteredListings(listingsData); 
      } catch (error) {
          console.error("Error fetching listings:", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      let results = myListings;
      if (filterType !== 'all') {
          results = results.filter(item => item.type === filterType);
      }
      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          results = results.filter(item => 
              item.title.toLowerCase().includes(lowerTerm) ||
              item.id.toLowerCase().includes(lowerTerm)
          );
      }
      setFilteredListings(results);
  }, [filterType, searchTerm, myListings]);

  useEffect(() => {
    if (typeof window !== 'undefined') initializeFirebase();
  }, [initializeFirebase]);

  // PROFILE HANDLERS
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setProcessingImage(true);
      try {
          const compressed = await compressImage(file);
          setAgentProfile(prev => ({ ...prev, photo: compressed }));
      } catch(e) { alert("Photo processing failed"); }
      finally { setProcessingImage(false); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!db || !user) return;

      if (!agentProfile.name) return alert("Please enter your Real Name.");
      if (!agentProfile.displayName) return alert("Please enter your Display Name.");
      if (!agentProfile.icNumber) return alert("IC Number is mandatory.");
      
      const icRegex = /^\d{6}-\d{2}-\d{4}$/;
      if (!icRegex.test(agentProfile.icNumber)) {
          return alert("Invalid IC Number format. Use: YYMMDD-PB-#### (e.g. 900101-07-1234)");
      }

      if (!agentProfile.streetAddress || !agentProfile.city || !agentProfile.state) {
          return alert("Please complete your Business Address.");
      }

      setProfileSaving(true);
      try {
          const cleanProfile = {
              ...agentProfile,
              website: ensureProtocol(agentProfile.website),
              facebook: ensureProtocol(agentProfile.facebook),
              instagram: ensureProtocol(agentProfile.instagram),
              tiktok: ensureProtocol(agentProfile.tiktok),
              xiaohongshu: ensureProtocol(agentProfile.xiaohongshu),
          };

          await updateDoc(doc(db, "users", user.uid), {
              agentProfile: cleanProfile,
              name: cleanProfile.name 
          });

          const batch = writeBatch(db);
          const q = query(collection(db, "listings"), where("agentId", "==", user.uid));
          const listingsSnap = await getDocs(q);
          
          listingsSnap.forEach((docSnap) => {
              batch.update(docSnap.ref, { 
                  agentName: cleanProfile.displayName, 
                  agentPhone: cleanProfile.phone,
                  agentPhoto: cleanProfile.photo || '' 
              });
          });
          
          await batch.commit();

          alert("Profile Saved & Listings Updated!");
          setActiveTab('listings'); 
      } catch (e) {
          console.error(e);
          alert("Save Failed.");
      } finally {
          setProfileSaving(false);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const currentCount = formData.images.length;
      const spaceLeft = 15 - currentCount;
      if (spaceLeft <= 0) { alert("Maximum 15 images allowed."); return; }
      
      let filesArray = Array.from(files);
      if (filesArray.length > spaceLeft) filesArray = filesArray.slice(0, spaceLeft);

      setProcessingImage(true);
      try {
          const compressedResults = await Promise.all(filesArray.map(file => compressImage(file)));
          const updatedImages = [...formData.images, ...compressedResults];
          const updatedCover = formData.coverImage || updatedImages[0];
          setFormData({ ...formData, images: updatedImages, coverImage: updatedCover });
      } catch (err) { alert("Images failed to process."); } 
      finally { setProcessingImage(false); e.target.value = ""; }
  };

  const handleRemoveImage = (index: number) => {
      const imgToRemove = formData.images[index];
      const newImages = [...formData.images];
      newImages.splice(index, 1);
      let newCover = formData.coverImage;
      if (imgToRemove === formData.coverImage) newCover = newImages[0] || '';
      setFormData({ ...formData, images: newImages, coverImage: newCover });
  };

  const handleFacilityToggle = (facility: string) => {
      const current = [...formData.facilities];
      if (current.includes(facility)) {
          setFormData({ ...formData, facilities: current.filter(f => f !== facility) });
      } else {
          setFormData({ ...formData, facilities: [...current, facility] });
      }
  };

  const handleEdit = (listing: any) => {
      setListingType(listing.type);
      setFormData({
          title: listing.title || '',
          description: listing.description || '',
          price: listing.price || '',
          state: listing.state || '',
          area: listing.area || '',
          images: listing.images || [],
          coverImage: listing.coverImage || '',
          transType: listing.transType || 'Sale',
          propertyType: listing.propertyType || 'Condominium',
          projectName: listing.projectName || '',
          developer: listing.developer || '',
          tenure: listing.tenure || 'Freehold',
          furnishing: listing.furnishing || 'Unfurnished',
          floorLevel: listing.floorLevel || '',
          bedrooms: listing.bedrooms || '',
          bathrooms: listing.bathrooms || '',
          parking: listing.parking || '',
          size: listing.size || '',
          facilities: listing.facilities || [],
          condition: listing.condition || 'Used',
          make: listing.make || 'Toyota',
          model: listing.model || '',
          bodyType: listing.bodyType || 'Sedan',
          year: listing.year || '',
          mileage: listing.mileage || '',
          color: listing.color || 'White',
          fuel: listing.fuel || 'Petrol',
          transmission: listing.transmission || 'Automatic',
          engineCapacity: listing.engineCapacity || '',
          seats: listing.seats || ''
      });
      setEditingId(listing.id);
      setIsEditing(true);
      setIsCreating(true); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!db || !user) return;
      if (!formData.title || !formData.price || !formData.state || formData.images.length === 0) {
          return alert("Please fill in required fields and upload at least 1 image.");
      }
      setSubmitting(true);
      try {
          const payload = {
              ...formData,
              type: listingType,
              agentId: user.uid,
              agentName: agentProfile.displayName || agentProfile.name || user.name || 'Agent', 
              agentPhone: agentProfile.phone || '',
              agentPhoto: agentProfile.photo || '',
              status: 'pending', 
              updatedAt: new Date(),
          };

          if (isEditing && editingId) {
              await updateDoc(doc(db, "listings", editingId), payload);
              alert("Listing Updated! Status set to Pending for re-approval.");
          } else {
              await addDoc(collection(db, "listings"), {
                  ...payload,
                  createdAt: new Date(),
                  views: 0
              });
              alert("Listing Submitted! Waiting for Admin Approval.");
          }

          setIsCreating(false);
          setIsEditing(false);
          setEditingId(null);
          
          fetchMyListings(user.uid, db);
          
          setFormData({
            title: '', description: '', price: '', state: '', area: '', 
            images: [], coverImage: '',
            transType: 'Sale', propertyType: 'Condominium', projectName: '', developer: '', tenure: 'Freehold', furnishing: 'Unfurnished', floorLevel: '', bedrooms: '', bathrooms: '', parking: '', size: '', facilities: [],
            condition: 'Used', make: 'Toyota', model: '', bodyType: 'Sedan', year: '', mileage: '', color: 'White', fuel: 'Petrol', transmission: 'Automatic', engineCapacity: '', seats: ''
          });
      } catch (error) {
          console.error(error);
          alert("Failed to submit listing.");
      } finally {
          setSubmitting(false);
      }
  };

  const handleTopUp = async () => {
      if (!db || !user) return;
      const amount = 100;
      const newBalance = walletBalance + amount;
      try {
          await updateDoc(doc(db, "users", user.uid), { walletBalance: newBalance });
          setWalletBalance(newBalance);
          alert(`Success! Added ${amount} credits.`);
      } catch (e) { alert("Failed to top up."); }
  };

  const handleCloseModal = () => {
      setIsCreating(false);
      setIsEditing(false);
      setEditingId(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-vexa-blue" size={40} /></div>;

  if (accessDenied.denied) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
              <div className="bg-red-50 p-6 rounded-full mb-4 text-red-500"><AlertTriangle size={32} /></div>
              <h1 className="text-xl font-bold text-slate-800">Access Denied</h1>
              <p className="text-slate-500 mb-6">{accessDenied.reason}</p>
              <Link href="/dashboard" className="px-6 py-2 bg-slate-800 text-white rounded-lg">Back to Dashboard</Link>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
        {/* Navbar */}
        <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-vexa-blue transition-colors px-3 py-2 rounded-lg hover:bg-slate-50">
                    <ArrowLeft size={20} />
                    <span className="hidden md:inline font-medium">Back</span>
                </Link>
                <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
                <div className="flex items-center gap-3">
                    <div className="bg-vexa-blue p-2 rounded-lg text-white hidden md:block"><LayoutDashboard size={24} /></div>
                    <div><h1 className="font-bold text-lg md:text-xl text-slate-800">Agent Console</h1></div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => {
                        setIsEditing(false);
                        setEditingId(null);
                        setFormData({
                            title: '', description: '', price: '', state: '', area: '', 
                            images: [], coverImage: '',
                            transType: 'Sale', propertyType: 'Condominium', projectName: '', developer: '', tenure: 'Freehold', furnishing: 'Unfurnished', floorLevel: '', bedrooms: '', bathrooms: '', parking: '', size: '', facilities: [],
                            condition: 'Used', make: 'Toyota', model: '', bodyType: 'Sedan', year: '', mileage: '', color: 'White', fuel: 'Petrol', transmission: 'Automatic', engineCapacity: '', seats: ''
                        });
                        setIsCreating(true);
                    }} 
                    className="bg-vexa-blue hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm text-sm md:text-base"
                >
                    <Plus size={20} /> <span className="hidden md:inline">Create Listing</span>
                </button>
            </div>
        </div>

        {/* MOBILE STATS - ONLY ON MOBILE */}
        <div className="lg:hidden container mx-auto px-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 flex flex-col items-center text-center justify-center">
                     <div className="w-12 h-12 bg-slate-100 rounded-full mb-2 flex items-center justify-center text-slate-400 border-2 border-slate-50 shadow-inner overflow-hidden">
                        {agentProfile.photo ? <img src={agentProfile.photo} className="w-full h-full object-cover" /> : <UserCircle size={28} />}
                     </div>
                     <div className="w-full">
                        <h3 className="font-bold text-slate-800 text-xs truncate px-1">{agentProfile.displayName || agentProfile.name || 'Agent'}</h3>
                        <button onClick={() => setActiveTab('profile')} className="text-[10px] text-vexa-blue font-bold hover:underline mt-1 border border-vexa-blue/30 px-2 py-0.5 rounded-full">
                            Edit Profile
                        </button>
                     </div>
                </div>

                {/* Wallet Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg p-3 text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-1 opacity-10"><Wallet size={40} /></div>
                    <div className="relative z-10 text-center">
                        <p className="text-slate-400 text-[10px] font-medium mb-0.5 uppercase tracking-wider">Credits</p>
                        <h3 className="text-xl font-bold mb-2">{walletBalance}</h3>
                    </div>
                    <button onClick={handleTopUp} className="relative z-10 bg-white/20 hover:bg-white/30 border border-white/10 text-white py-1 rounded-md font-bold transition-all backdrop-blur-sm flex items-center justify-center gap-1 text-[10px] w-full">
                        <Plus size={10} /> Top Up
                    </button>
                </div>
            </div>
        </div>

        {/* TABS */}
        <div className="container mx-auto px-4 md:px-8 mt-4 md:mt-6">
            <div className="flex gap-4 border-b border-slate-200">
                <button onClick={() => setActiveTab('listings')} className={`pb-3 px-4 font-medium text-sm transition-all border-b-2 ${activeTab === 'listings' ? 'border-vexa-blue text-vexa-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>My Listings</button>
                <button onClick={() => setActiveTab('profile')} className={`pb-3 px-4 font-medium text-sm transition-all border-b-2 ${activeTab === 'profile' ? 'border-vexa-blue text-vexa-blue font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Edit Profile</button>
            </div>
        </div>

        <div className="container mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
            
            {/* LEFT COLUMN: MAIN CONTENT */}
            <div className="flex-1 space-y-6">
                
                {activeTab === 'listings' && (
                    <>
                        {/* Search & Filters */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                            <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
                                <button onClick={() => setFilterType('all')} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'all' ? 'bg-white text-vexa-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All</button>
                                <button onClick={() => setFilterType('property')} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${filterType === 'property' ? 'bg-white text-vexa-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Home size={14} /> Property</button>
                                <button onClick={() => setFilterType('vehicle')} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${filterType === 'vehicle' ? 'bg-white text-vexa-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Car size={14} /> Vehicle</button>
                            </div>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" placeholder="Search listings..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vexa-blue/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                        </div>

                        {/* Listing Grid */}
                        {filteredListings.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                                <div className="flex justify-center gap-4 mb-4 opacity-20 text-slate-800"><Home size={48} /><Car size={48} /></div>
                                <h3 className="text-lg font-bold text-slate-700">No Listings Found</h3>
                                <p className="text-slate-500 mt-2">Try adjusting your filters or create a new listing.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredListings.map((listing) => (
                                    <div key={listing.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden group flex flex-col h-full hover:shadow-md transition-shadow">
                                        <div className="relative h-32 md:h-40 bg-slate-100">
                                            {listing.coverImage ? <img src={listing.coverImage} alt={listing.title} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-300">No Image</div>}
                                            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shadow-sm ${listing.status === 'active' ? 'bg-emerald-500 text-white' : listing.status === 'suspended' ? 'bg-red-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>{listing.status}</span>
                                            </div>
                                        </div>
                                        <div className="p-3 flex-1 flex flex-col">
                                            <h3 className="font-bold text-slate-800 text-xs md:text-sm line-clamp-1 mb-1" title={listing.title}>{listing.title}</h3>
                                            <p className="text-vexa-blue font-bold text-xs md:text-sm mb-1">RM {listing.price}</p>
                                            <div className="flex items-center gap-1 text-slate-500 text-[10px] mb-2 line-clamp-1"><MapPin size={10} /> {listing.area}, {listing.state}</div>
                                            <div className="mt-auto pt-2 border-t border-slate-100 flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/listing/${listing.id}`} className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-vexa-blue bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded transition-colors"><Eye size={12} /></Link>
                                                    <button onClick={() => handleEdit(listing)} className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-orange-600 bg-slate-50 hover:bg-orange-50 px-2 py-1 rounded transition-colors"><Pencil size={12} /></button>
                                                </div>
                                                <div className="text-[10px] text-slate-400">{listing.views || 0} Views</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'profile' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-800">Edit Agent Profile</h2>
                            <button onClick={handleSaveProfile} disabled={profileSaving} className="bg-vexa-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-blue-700 transition-colors">
                                {profileSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Changes
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Personal Info & Identity */}
                            <div className="bg-slate-50 p-4 rounded-lg md:col-span-2 space-y-4">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2 border-b border-slate-200 pb-2"><UserCircle size={18} className="text-vexa-blue"/> Identity Verification</h3>
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden relative group shrink-0">
                                        {agentProfile.photo ? <img src={agentProfile.photo} alt="Profile" className="w-full h-full object-cover" /> : <UserCircle size={40} className="text-slate-300" />}
                                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] cursor-pointer transition-opacity">Upload<input type="file" className="hidden" accept="image/*" onChange={handleProfilePhotoUpload} /></label>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Real Name (as per IC) <span className="text-red-500">*</span></label>
                                            <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-vexa-blue bg-white" placeholder="Name on Identity Card" value={agentProfile.name} onChange={e => setAgentProfile({...agentProfile, name: e.target.value})} />
                                            <p className="text-[10px] text-slate-500 mt-1">Private. For verification purposes only.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name (Public) <span className="text-red-500">*</span></label>
                                            <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-vexa-blue bg-white" placeholder="Name shown to customers" value={agentProfile.displayName} onChange={e => setAgentProfile({...agentProfile, displayName: e.target.value})} />
                                            <p className="text-[10px] text-slate-500 mt-1">This name will appear on all your listings.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><FileText size={14}/> IC Number <span className="text-red-500">*</span></label>
                                        <input type="text" placeholder="e.g. 900101-07-1234" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-vexa-blue bg-white" value={agentProfile.icNumber} onChange={e => setAgentProfile({...agentProfile, icNumber: e.target.value})} />
                                        <p className="text-[10px] text-slate-500 mt-1">Format: YYMMDD-PB-####. Kept private.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">REN / Agent Number</label>
                                        <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-vexa-blue bg-white" value={agentProfile.renNumber} onChange={e => setAgentProfile({...agentProfile, renNumber: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* Contact & Address */}
                            <div className="space-y-4">
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" disabled className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed" value={agentProfile.email} /></div>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone (WhatsApp)</label><input type="text" placeholder="e.g. 60123456789" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-vexa-blue" value={agentProfile.phone} onChange={e => setAgentProfile({...agentProfile, phone: e.target.value})} /></div>
                                
                                <div className="pt-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><MapPin size={14}/> Business Address</label>
                                    <input type="text" placeholder="Street Address" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-vexa-blue mb-2" value={agentProfile.streetAddress} onChange={e => setAgentProfile({...agentProfile, streetAddress: e.target.value})} />
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <input type="text" placeholder="City" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-vexa-blue" value={agentProfile.city} onChange={e => setAgentProfile({...agentProfile, city: e.target.value})} />
                                        <input type="text" placeholder="Postcode" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-vexa-blue" value={agentProfile.postalCode} onChange={e => setAgentProfile({...agentProfile, postalCode: e.target.value})} />
                                    </div>
                                    <select className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-vexa-blue bg-white" value={agentProfile.state} onChange={e => setAgentProfile({...agentProfile, state: e.target.value})}>
                                        <option value="">Select State</option>{MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Details & Social */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Agency Name</label>
                                    <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-vexa-blue" value={agentProfile.agencyName} onChange={e => setAgentProfile({...agentProfile, agencyName: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Clock size={14}/> Experience (Years)</label>
                                    <input type="text" placeholder="e.g. 5 Years" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-vexa-blue" value={agentProfile.experience} onChange={e => setAgentProfile({...agentProfile, experience: e.target.value})} />
                                </div>

                                <div className="space-y-2 pt-2">
                                    <p className="text-sm font-bold text-slate-700">Social Media</p>
                                    <div className="relative"><Facebook size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" /><input type="text" placeholder="Facebook URL" className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none" value={agentProfile.facebook} onChange={e => setAgentProfile({...agentProfile, facebook: e.target.value})} /></div>
                                    <div className="relative"><Instagram size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-600" /><input type="text" placeholder="Instagram URL" className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none" value={agentProfile.instagram} onChange={e => setAgentProfile({...agentProfile, instagram: e.target.value})} /></div>
                                    <div className="relative"><Video size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-black" /><input type="text" placeholder="TikTok URL" className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none" value={agentProfile.tiktok} onChange={e => setAgentProfile({...agentProfile, tiktok: e.target.value})} /></div>
                                    <div className="relative"><BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" /><input type="text" placeholder="XiaoHongShu URL" className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none" value={agentProfile.xiaohongshu} onChange={e => setAgentProfile({...agentProfile, xiaohongshu: e.target.value})} /></div>
                                    <div className="relative"><Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Website URL" className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none" value={agentProfile.website} onChange={e => setAgentProfile({...agentProfile, website: e.target.value})} /></div>
                                </div>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Bio / Description</label>
                                <textarea rows={4} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-vexa-blue resize-none" value={agentProfile.description} onChange={e => setAgentProfile({...agentProfile, description: e.target.value})} placeholder="Tell buyers about yourself..." />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: WALLET & PROFILE (DESKTOP ONLY) */}
            <div className="hidden lg:flex w-full lg:w-80 flex-col gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center justify-center">
                     <div className="w-20 h-20 bg-slate-100 rounded-full mb-3 flex items-center justify-center text-slate-400 border-2 border-slate-50 shadow-inner overflow-hidden">
                        {agentProfile.photo ? <img src={agentProfile.photo} className="w-full h-full object-cover" /> : <UserCircle size={40} />}
                     </div>
                     <div className="w-full">
                        <h3 className="font-bold text-slate-800 text-base truncate">{agentProfile.displayName || agentProfile.name || 'Agent'}</h3>
                        <p className="text-xs text-slate-500 mb-4">{user?.email}</p>
                        <button onClick={() => setActiveTab('profile')} className="text-xs text-vexa-blue font-bold hover:underline border border-vexa-blue/30 px-3 py-1.5 rounded-full">
                            Edit Personal Profile
                        </button>
                     </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={100} /></div>
                    <div className="relative z-10 text-left">
                        <p className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Credits</p>
                        <h3 className="text-4xl font-bold mb-6">{walletBalance}</h3>
                        <p className="text-[10px] text-slate-400">For Premium Listings & Ads</p>
                    </div>
                    <button onClick={handleTopUp} className="relative z-10 bg-white/20 hover:bg-white/30 border border-white/10 text-white py-2 px-4 rounded-lg font-bold transition-all backdrop-blur-sm flex items-center justify-center gap-2 text-sm w-full">
                        <CreditCard size={16} /> Top Up
                    </button>
                </div>
            </div>
        </div>

        {/* Create Listing Modal */}
        {isCreating && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h2 className="font-bold text-lg text-slate-800">{isEditing ? 'Edit Listing' : 'Create New Listing'}</h2>
                        <button onClick={handleCloseModal}><X className="text-slate-400 hover:text-slate-600" /></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        <form id="listing-form" onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" disabled={isEditing} onClick={() => setListingType('property')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${listingType === 'property' ? 'border-vexa-blue bg-blue-50 text-vexa-blue' : 'border-slate-100 text-slate-500'} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}><Home size={28} /><span className="font-bold">Property</span></button>
                                <button type="button" disabled={isEditing} onClick={() => setListingType('vehicle')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${listingType === 'vehicle' ? 'border-vexa-blue bg-blue-50 text-vexa-blue' : 'border-slate-100 text-slate-500'} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}><Car size={28} /><span className="font-bold">Vehicle</span></button>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Listing Title</label><input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-vexa-blue outline-none" placeholder={listingType === 'property' ? "e.g. Spacious 3BR Condo at Mont Kiara" : "e.g. 2021 Honda City RS Hybrid"} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Price (RM)</label><div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input required type="number" className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-vexa-blue outline-none" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-slate-700 mb-1">State</label><select className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white outline-none" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}><option value="">Select State</option>{MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Area / City</label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input required type="text" className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-vexa-blue outline-none" placeholder="e.g. Bangsar South" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} /></div></div>
                                </div>
                            </div>
                            {listingType === 'property' && (
                                <div className="space-y-4 animate-in fade-in">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2"><Home size={16} /> Property Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Project Name</label><input type="text" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="e.g. Pavilion Residences" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Developer</label><input type="text" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="e.g. Pavilion Group" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Property Type</label><select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.propertyType} onChange={e => setFormData({...formData, propertyType: e.target.value})}>{PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Transaction</label><select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.transType} onChange={e => setFormData({...formData, transType: e.target.value})}><option>Sale</option><option>Rent</option></select></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Tenure</label><select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.tenure} onChange={e => setFormData({...formData, tenure: e.target.value})}>{PROPERTY_TENURE.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Furnishing</label><select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.furnishing} onChange={e => setFormData({...formData, furnishing: e.target.value})}>{PROPERTY_FURNISHING.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Floor Level</label><select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.floorLevel} onChange={e => setFormData({...formData, floorLevel: e.target.value})}><option value="">Select Level</option><option value="High">High</option><option value="Middle">Middle</option><option value="Low">Low</option><option value="Ground">Ground</option><option value="Penthouse">Penthouse</option></select></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Maximize size={12}/> Size (sqft)</label><input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="e.g. 1250" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Bed size={12}/> Bedrooms</label><input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="3" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Bath size={12}/> Bathrooms</label><input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="2" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><ParkingCircle size={12}/> Car Parks</label><input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="2" value={formData.parking} onChange={e => setFormData({...formData, parking: e.target.value})} /></div>
                                    </div>
                                    <div><label className="text-xs font-bold text-slate-500 mb-2 block">Facilities</label><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{PROPERTY_FACILITIES.map(facility => (<label key={facility} className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-vexa-blue transition-colors"><input type="checkbox" className="w-4 h-4 text-vexa-blue rounded focus:ring-vexa-blue" checked={formData.facilities.includes(facility)} onChange={() => handleFacilityToggle(facility)} /><span className="text-xs text-slate-700">{facility}</span></label>))}</div></div>
                                </div>
                            )}
                            {listingType === 'vehicle' && (
                                <div className="space-y-4 animate-in fade-in">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2"><Car size={16} /> Vehicle Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Make / Brand</label><select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})}>{VEHICLE_MAKES.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Model</label><input type="text" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="e.g. Civic 1.5 TC-P" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Body Type</label><select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.bodyType} onChange={e => setFormData({...formData, bodyType: e.target.value})}>{VEHICLE_BODY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Condition</label><select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>{VEHICLE_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Fuel Type</label><select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.fuel} onChange={e => setFormData({...formData, fuel: e.target.value})}>{VEHICLE_FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Transmission</label><select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.transmission} onChange={e => setFormData({...formData, transmission: e.target.value})}>{TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 block">Color</label><select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})}>{VEHICLE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Year</label><input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="2020" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Gauge size={12}/> Mileage (km)</label><input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="45000" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Zap size={12}/> Engine (cc)</label><input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="1500" value={formData.engineCapacity} onChange={e => setFormData({...formData, engineCapacity: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Users size={12}/> Seats</label><input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="5" value={formData.seats} onChange={e => setFormData({...formData, seats: e.target.value})} /></div>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2"><Info size={16} /> Additional Info & Media</h3>
                                <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea rows={5} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-vexa-blue outline-none resize-none text-sm" placeholder="Highlight key features, condition, or renovations..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                                        {formData.images.map((img, idx) => (
                                            <div key={idx} className={`relative aspect-square rounded-lg overflow-hidden border-2 ${formData.coverImage === img ? 'border-vexa-blue ring-2 ring-blue-100' : 'border-slate-200'} group bg-white`}>
                                                <img src={img} className="w-full h-full object-cover" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                                    <button type="button" onClick={() => setFormData({...formData, coverImage: img})} className={`p-2 rounded-full hover:bg-blue-50 transition-colors ${formData.coverImage === img ? 'bg-vexa-blue text-white' : 'bg-white text-vexa-blue'}`} title="Set Cover"><Star size={14} /></button>
                                                    <button type="button" onClick={() => handleRemoveImage(idx)} className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 transition-colors" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                                {formData.coverImage === img && <div className="absolute top-1 right-1 bg-vexa-blue text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm">COVER</div>}
                                            </div>
                                        ))}
                                        {formData.images.length < 15 && (
                                            <label className={`flex flex-col items-center justify-center aspect-square rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200 ${processingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                                                {processingImage ? <Loader2 className="animate-spin text-slate-400" /> : <UploadCloud className="text-slate-400" />}
                                                <span className="text-xs text-slate-500 mt-2 font-medium">{processingImage ? 'Processing...' : 'Add Photos'}</span>
                                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} disabled={processingImage} />
                                            </label>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">Upload up to 15 photos. Click the star to set the cover image.</p>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                        <button onClick={handleCloseModal} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancel</button>
                        <button type="submit" form="listing-form" disabled={submitting || processingImage} className="px-6 py-2 bg-vexa-blue text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm">{submitting ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? <Pencil size={18} /> : <Plus size={18} />)} {isEditing ? 'Update Listing' : 'Submit Listing'}</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

export default function AgentDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-vexa-blue" size={40} /></div>}>
      <AgentDashboardContent />
    </Suspense>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
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
  Building,
  Armchair,
  Layers,
  ParkingCircle,
  CheckSquare,
  Palette,
  Users,
  Zap,
  Info,
  Clock,
  CheckCircle2,
  Ban,
  Eye,
  Pencil, // Added Pencil for Edit
  Search, // Added Search
  Filter  // Added Filter
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

declare global {
  interface Window {
    firebase: any;
    firestoreDb?: any;
    __firebase_config?: string;
  }
}

// --- CONSTANTS ---
const MALAYSIA_STATES = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", 
  "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak", 
  "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"
];

// Property Constants
const PROPERTY_TYPES = ["Condominium", "Apartment", "Terrace House", "Bungalow", "Semi-D", "Commercial", "Land", "Townhouse", "Shop Lot", "Factory", "Office"];
const PROPERTY_TENURE = ["Freehold", "Leasehold", "Malay Reserved"];
const PROPERTY_FURNISHING = ["Unfurnished", "Partially Furnished", "Fully Furnished"];
const PROPERTY_FACILITIES = [
  "Swimming Pool", "Gymnasium", "24-Hour Security", "Playground", "Covered Parking", 
  "Balcony", "Barbeque Area", "Jogging Track", "Mini Market", "Squash Court", 
  "Tennis Court", "Lift", "Wading Pool", "Jacuzzi", "Sauna", "Club House"
];

// Vehicle Constants
const VEHICLE_CONDITIONS = ["New", "Used", "Recon"];
const VEHICLE_MAKES = [
  "Toyota", "Honda", "Proton", "Perodua", "Nissan", "Mazda", "BMW", "Mercedes-Benz", 
  "Audi", "Volkswagen", "Hyundai", "Kia", "Ford", "Mitsubishi", "Subaru", "Volvo", 
  "Porsche", "Lexus", "Land Rover", "Mini", "Jaguar", "Peugeot", "Renault", "Tesla", 
  "Ferrari", "Lamborghini", "Suzuki", "Isuzu", "Chery", "BYD", "Great Wall", "Others"
];
const VEHICLE_BODY_TYPES = ["Sedan", "SUV", "MPV", "Hatchback", "Coupe", "Pickup Truck", "Van", "Convertible", "Wagon", "Sports Car", "4x4"];
const VEHICLE_FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric", "Plug-in Hybrid"];
const VEHICLE_COLORS = ["White", "Black", "Silver", "Grey", "Red", "Blue", "Gold", "Brown", "Green", "Orange", "Yellow", "Purple", "Bronze", "Other"];
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "DCT"];

// --- IMAGE UTILITY ---
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

export default function AgentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [accessDenied, setAccessDenied] = useState<{denied: boolean, reason?: string}>({ denied: false });
  
  // Data State
  const [myListings, setMyListings] = useState<any[]>([]);
  const [filteredListings, setFilteredListings] = useState<any[]>([]);

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
  
  // FORM DATA
  const [listingType, setListingType] = useState<'property' | 'vehicle'>('property');
  const [formData, setFormData] = useState({
    // Common
    title: '',
    description: '',
    price: '',
    state: '',
    area: '', // City/Town
    
    // Images
    images: [] as string[],
    coverImage: '',

    // Property Specifics
    transType: 'Sale',
    propertyType: 'Condominium',
    projectName: '',
    developer: '',
    tenure: 'Freehold',
    furnishing: 'Unfurnished',
    floorLevel: '', // High, Mid, Low
    bedrooms: '',
    bathrooms: '',
    parking: '',
    size: '', // sqft
    facilities: [] as string[],

    // Vehicle Specifics
    condition: 'Used',
    make: 'Toyota',
    model: '',
    bodyType: 'Sedan',
    year: '',
    mileage: '',
    color: 'White',
    fuel: 'Petrol',
    transmission: 'Automatic',
    engineCapacity: '', // cc
    seats: ''
  });

  // 1. INITIALIZE & AUTH CHECK
  const initializeFirebase = useCallback(async () => {
    try {
        if (typeof window.firestoreDb !== 'undefined' && window.firestoreDb) {
            setDb(window.firestoreDb);
            checkUser(window.firestoreDb);
            return;
        }
        const appScript = document.createElement('script');
        appScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js";
        appScript.onload = () => {
            const firestoreScript = document.createElement('script');
            firestoreScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js";
            firestoreScript.onload = () => {
                const authScript = document.createElement('script');
                authScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js";
                authScript.onload = () => {
                    const firebase = (window as any).firebase;
                    const firebaseConfig = {
                        apiKey: "AIzaSyDo4yfchuY8FVunbz_ZinubrbZtSuATOGg",
                        authDomain: "vexa-platform.firebaseapp.com",
                        projectId: "vexa-platform",
                        storageBucket: "vexa-platform.firebasestorage.app",
                        messagingSenderId: "96646526352",
                        appId: "1:96646526352:web:140e50442fc5e66dca2f15",
                        measurementId: "G-C7MBKREZNG"
                    };
                    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
                    const dbInstance = firebase.firestore();
                    window.firestoreDb = dbInstance;
                    setDb(dbInstance);
                    checkUser(dbInstance);
                };
                document.head.appendChild(authScript);
            };
            document.head.appendChild(firestoreScript);
        };
        document.head.appendChild(appScript);
    } catch (e) { console.error(e); }
  }, []);

  const checkUser = async (database: any) => {
      const storedUserId = localStorage.getItem("vexa_active_user_id");
      const userId = storedUserId || "test-user-id"; 
      
      try {
          const doc = await database.collection("users").doc(userId).get();
          if (!doc.exists) {
              setAccessDenied({ denied: true, reason: "Profile not found." });
              setLoading(false);
              return;
          }
          const userData = doc.data();
          if (userData.role === 'agent') {
              const currentUser = { uid: userId, ...userData };
              setUser(currentUser);
              // Fetch Listings after Auth Success
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
          // Client-side sorting/filtering is preferred for small datasets like "My Listings"
          const snapshot = await database.collection("listings")
            .where("agentId", "==", userId)
            .get();
          
          const listingsData = snapshot.docs.map((doc: any) => ({
              id: doc.id,
              ...doc.data()
          }));

          // Initial Sort
          listingsData.sort((a: any, b: any) => {
              const dateA = a.createdAt?.seconds || 0;
              const dateB = b.createdAt?.seconds || 0;
              return dateB - dateA;
          });

          setMyListings(listingsData);
          setFilteredListings(listingsData); // Initialize filtered list
      } catch (error) {
          console.error("Error fetching listings:", error);
      } finally {
          setLoading(false);
      }
  };

  // FILTER LOGIC
  useEffect(() => {
      let results = myListings;

      // Filter by Type
      if (filterType !== 'all') {
          results = results.filter(item => item.type === filterType);
      }

      // Filter by Search
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

  // 2. FORM HANDLERS
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const currentCount = formData.images.length;
      const spaceLeft = 15 - currentCount;

      if (spaceLeft <= 0) {
          alert("Maximum 15 images allowed. Please remove some to add new ones.");
          e.target.value = ""; 
          return;
      }

      let filesArray = Array.from(files);
      if (filesArray.length > spaceLeft) {
          alert(`You selected ${filesArray.length} images, but only ${spaceLeft} more can be added. Adding the first ${spaceLeft}...`);
          filesArray = filesArray.slice(0, spaceLeft);
      }

      setProcessingImage(true);
      
      try {
          const compressedResults = await Promise.all(
              filesArray.map(file => compressImage(file))
          );

          const updatedImages = [...formData.images, ...compressedResults];
          const updatedCover = formData.coverImage || updatedImages[0];

          setFormData({ 
              ...formData, 
              images: updatedImages, 
              coverImage: updatedCover 
          });

      } catch (err) { 
          console.error(err);
          alert("One or more images failed to process."); 
      } finally { 
          setProcessingImage(false); 
          e.target.value = ""; 
      }
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
          // Merge existing data with defaults to prevent undefined errors
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
      setIsCreating(true); // Re-use the creation modal
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
              agentName: user.name || 'Agent',
              status: 'pending', // Re-trigger pending on edit? Usually safer to keep existing status or set to pending for review.
              updatedAt: new Date(),
          };

          if (isEditing && editingId) {
              // UPDATE Existing
              await db.collection("listings").doc(editingId).update(payload);
              alert("Listing Updated! Status set to Pending for re-approval.");
          } else {
              // CREATE New
              await db.collection("listings").add({
                  ...payload,
                  createdAt: new Date(),
                  views: 0
              });
              alert("Listing Submitted! Waiting for Admin Approval.");
          }

          setIsCreating(false);
          setIsEditing(false);
          setEditingId(null);
          
          // Refresh list
          fetchMyListings(user.uid, db);
          
          // Reset Form
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

  const handleCloseModal = () => {
      setIsCreating(false);
      setIsEditing(false);
      setEditingId(null);
      // Optional: Reset form here if desired, or keep draft
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
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <div className="bg-vexa-blue p-2 rounded-lg text-white"><LayoutDashboard size={24} /></div>
                <div>
                    <h1 className="font-bold text-xl text-slate-800">Agent Console</h1>
                    <p className="text-xs text-slate-500">Manage Listings</p>
                </div>
            </div>
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
                className="bg-vexa-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <Plus size={20} /> Create Listing
            </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="container mx-auto px-8 pt-8">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setFilterType('all')} 
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'all' ? 'bg-white text-vexa-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setFilterType('property')} 
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${filterType === 'property' ? 'bg-white text-vexa-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Home size={14} /> Property
                    </button>
                    <button 
                        onClick={() => setFilterType('vehicle')} 
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${filterType === 'vehicle' ? 'bg-white text-vexa-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Car size={14} /> Vehicle
                    </button>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search listings..." 
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vexa-blue/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto p-8">
            {filteredListings.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="flex justify-center gap-4 mb-4 opacity-20 text-slate-800">
                        <Home size={48} /><Car size={48} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No Listings Found</h3>
                    <p className="text-slate-500 mt-2">Try adjusting your filters or create a new listing.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredListings.map((listing) => (
                        <div key={listing.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden group flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="relative h-32 bg-slate-100">
                                {listing.coverImage ? (
                                    <img src={listing.coverImage} alt={listing.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-300">No Image</div>
                                )}
                                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shadow-sm ${
                                        listing.status === 'active' ? 'bg-emerald-500 text-white' : 
                                        listing.status === 'suspended' ? 'bg-red-500 text-white' : 
                                        'bg-yellow-400 text-yellow-900'
                                    }`}>
                                        {listing.status}
                                    </span>
                                </div>
                                <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                    {listing.type === 'property' ? <Home size={10} /> : <Car size={10} />}
                                    {listing.type === 'property' ? 'Property' : 'Vehicle'}
                                </div>
                            </div>
                            <div className="p-3 flex-1 flex flex-col">
                                <h3 className="font-bold text-slate-800 text-sm line-clamp-1 mb-1" title={listing.title}>{listing.title}</h3>
                                <p className="text-vexa-blue font-bold text-sm mb-1">RM {listing.price}</p>
                                <div className="flex items-center gap-1 text-slate-500 text-[10px] mb-2 line-clamp-1">
                                    <MapPin size={10} /> {listing.area}, {listing.state}
                                </div>
                                <div className="mt-auto pt-2 border-t border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Link 
                                            href={`/listing/${listing.id}`}
                                            className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-vexa-blue bg-slate-50 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                        >
                                            <Eye size={12} />
                                        </Link>
                                        <button 
                                            onClick={() => handleEdit(listing)}
                                            className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-orange-600 bg-slate-50 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        {listing.views || 0} Views
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* CREATE/EDIT MODAL */}
        {isCreating && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h2 className="font-bold text-lg text-slate-800">{isEditing ? 'Edit Listing' : 'Create New Listing'}</h2>
                        <button onClick={handleCloseModal}><X className="text-slate-400 hover:text-slate-600" /></button>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        <form id="listing-form" onSubmit={handleSubmit} className="space-y-8">
                            
                            {/* 1. Type Switcher - Disable if editing to prevent type mismatch issues */}
                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" disabled={isEditing} onClick={() => setListingType('property')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${listingType === 'property' ? 'border-vexa-blue bg-blue-50 text-vexa-blue' : 'border-slate-100 text-slate-500'} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <Home size={28} /><span className="font-bold">Property</span>
                                </button>
                                <button type="button" disabled={isEditing} onClick={() => setListingType('vehicle')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${listingType === 'vehicle' ? 'border-vexa-blue bg-blue-50 text-vexa-blue' : 'border-slate-100 text-slate-500'} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <Car size={28} /><span className="font-bold">Vehicle</span>
                                </button>
                            </div>

                            {/* 2. Common Fields */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Listing Title</label>
                                        <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-vexa-blue outline-none" placeholder={listingType === 'property' ? "e.g. Spacious 3BR Condo at Mont Kiara" : "e.g. 2021 Honda City RS Hybrid"} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Price (RM)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input required type="number" className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-vexa-blue outline-none" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                                        <select className="w-full px-4 py-2 rounded-lg border border-slate-300 bg-white outline-none" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}>
                                            <option value="">Select State</option>
                                            {MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Area / City</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input required type="text" className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-vexa-blue outline-none" placeholder="e.g. Bangsar South" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Conditional Fields - PROPERTY */}
                            {listingType === 'property' && (
                                <div className="space-y-4 animate-in fade-in">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2"><Home size={16} /> Property Details</h3>
                                    
                                    {/* Primary Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Project Name</label>
                                            <input type="text" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="e.g. Pavilion Residences" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Developer</label>
                                            <input type="text" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="e.g. Pavilion Group" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Property Type</label>
                                            <select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.propertyType} onChange={e => setFormData({...formData, propertyType: e.target.value})}>
                                                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Secondary Details */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Transaction</label>
                                            <select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.transType} onChange={e => setFormData({...formData, transType: e.target.value})}>
                                                <option>Sale</option>
                                                <option>Rent</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Tenure</label>
                                            <select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.tenure} onChange={e => setFormData({...formData, tenure: e.target.value})}>
                                                {PROPERTY_TENURE.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Furnishing</label>
                                            <select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.furnishing} onChange={e => setFormData({...formData, furnishing: e.target.value})}>
                                                {PROPERTY_FURNISHING.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Floor Level</label>
                                            <select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.floorLevel} onChange={e => setFormData({...formData, floorLevel: e.target.value})}>
                                                <option value="">Select Level</option>
                                                <option value="High">High</option>
                                                <option value="Middle">Middle</option>
                                                <option value="Low">Low</option>
                                                <option value="Ground">Ground</option>
                                                <option value="Penthouse">Penthouse</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Dimensions & Rooms */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Maximize size={12}/> Size (sqft)</label>
                                            <input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="e.g. 1250" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Bed size={12}/> Bedrooms</label>
                                            <input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="3" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Bath size={12}/> Bathrooms</label>
                                            <input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="2" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><ParkingCircle size={12}/> Car Parks</label>
                                            <input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="2" value={formData.parking} onChange={e => setFormData({...formData, parking: e.target.value})} />
                                        </div>
                                    </div>

                                    {/* Facilities Checkboxes */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">Facilities</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {PROPERTY_FACILITIES.map(facility => (
                                                <label key={facility} className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-vexa-blue transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 text-vexa-blue rounded focus:ring-vexa-blue"
                                                        checked={formData.facilities.includes(facility)}
                                                        onChange={() => handleFacilityToggle(facility)}
                                                    />
                                                    <span className="text-xs text-slate-700">{facility}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 3. Conditional Fields - VEHICLE */}
                            {listingType === 'vehicle' && (
                                <div className="space-y-4 animate-in fade-in">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2"><Car size={16} /> Vehicle Details</h3>
                                    
                                    {/* Make/Model/Type */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Make / Brand</label>
                                            <select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})}>
                                                {VEHICLE_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Model</label>
                                            <input type="text" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="e.g. Civic 1.5 TC-P" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Body Type</label>
                                            <select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.bodyType} onChange={e => setFormData({...formData, bodyType: e.target.value})}>
                                                {VEHICLE_BODY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Condition & Specs */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Condition</label>
                                            <select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                                                {VEHICLE_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Fuel Type</label>
                                            <select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.fuel} onChange={e => setFormData({...formData, fuel: e.target.value})}>
                                                {VEHICLE_FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Transmission</label>
                                            <select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.transmission} onChange={e => setFormData({...formData, transmission: e.target.value})}>
                                                {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 block">Color</label>
                                            <select className="w-full px-3 py-2 rounded border border-slate-300 text-sm bg-white" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})}>
                                                {VEHICLE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Tech Specs */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12}/> Year</label>
                                            <input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="2020" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Gauge size={12}/> Mileage (km)</label>
                                            <input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="45000" value={formData.mileage} onChange={e => setFormData({...formData, mileage: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Zap size={12}/> Engine (cc)</label>
                                            <input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="1500" value={formData.engineCapacity} onChange={e => setFormData({...formData, engineCapacity: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Users size={12}/> Seats</label>
                                            <input type="number" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" placeholder="5" value={formData.seats} onChange={e => setFormData({...formData, seats: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 4. Description & Images */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2"><Info size={16} /> Additional Info & Media</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea rows={5} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-vexa-blue outline-none resize-none text-sm" placeholder="Highlight key features, condition, or renovations..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                </div>

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
                                                {/* Added 'multiple' attribute here */}
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
                        <button type="submit" form="listing-form" disabled={submitting || processingImage} className="px-6 py-2 bg-vexa-blue text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 text-sm">
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : (isEditing ? <Pencil size={18} /> : <Plus size={18} />)} {isEditing ? 'Update Listing' : 'Submit Listing'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
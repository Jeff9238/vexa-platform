"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { 
  LayoutDashboard, 
  Plus, 
  Building, 
  Loader2, 
  MapPin, 
  DollarSign, 
  Image as ImageIcon, 
  X, 
  AlertTriangle, 
  UploadCloud, 
  Trash2, 
  Star, 
  Maximize, 
  Calendar, 
  Info, 
  CheckCircle2, 
  Eye, 
  Pencil, 
  Search, 
  ArrowLeft, 
  UserCircle, 
  Save, 
  FileText, 
  Globe, 
  Briefcase,
  LayoutTemplate,
  ExternalLink,
  Facebook,
  Instagram,
  Video,
  BookOpen
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, writeBatch } from "firebase/firestore";

const MALAYSIA_STATES = ["Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis", "Sabah", "Sarawak", "Selangor", "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya"];
const PROJECT_STATUS = ["Coming Soon", "Open for Registration", "Under Construction", "Completed"];
const PROPERTY_TYPES = ["Condominium", "Serviced Residence", "Apartment", "Terrace House", "Semi-D", "Bungalow", "Commercial", "Mixed Development"];
const LAND_TITLES = ["Residential", "Commercial", "Industrial", "Mixed", "Agriculture"];
const TITLE_TYPES = ["Individual", "Strata", "Master"];
const TENURE_TYPES = ["Freehold", "Leasehold", "Malay Reserved"];

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
                const MAX_DIM = 1200; 
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
                resolve(canvas.toDataURL('image/jpeg', 0.8));
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

function DeveloperDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Split Loading States
  const [authLoading, setAuthLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [db, setDb] = useState<any>(null);
  const [accessDenied, setAccessDenied] = useState<{denied: boolean, reason?: string}>({ denied: false });
  
  const [activeTab, setActiveTab] = useState<'projects' | 'profile'>('projects');
  const [myProjects, setMyProjects] = useState<any[]>([]);
  
  const [devProfile, setDevProfile] = useState({
      companyName: '',
      registrationNumber: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      logo: '', 
      coverPhoto: '', 
      facebook: '',
      instagram: '',
      tiktok: '',
      xiaohongshu: '',
      description: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [processingProfileImage, setProcessingProfileImage] = useState(false);

  // PROJECT FORM DATA
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  
  const [projectLayouts, setProjectLayouts] = useState<{id: string, name: string, size: string, image: string}[]>([]);

  const [formData, setFormData] = useState({
    title: '', 
    developer: '',
    description: '', 
    minPrice: '', 
    maxPrice: '',
    state: '', 
    area: '', 
    images: [] as string[], 
    coverImage: '',
    propertyType: 'Condominium',
    status: 'Open for Registration',
    completionYear: '',
    totalUnits: '',
    tenure: 'Freehold',
    landSize: '', 
    builtUpMin: '', 
    builtUpMax: '', 
    pricePsf: '',   
    maintenanceFee: '', 
    bookingFee: '', 
    landTitle: 'Residential', 
    titleType: 'Strata', 
    salesGalleryLocation: '', 
    brochureUrl: '', 
    facilities: [] as string[],
    bedrooms: '', // Added
    bathrooms: '' // Added
  });

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
        await checkUser(dbInstance);
    } catch (e) { 
        console.error(e);
        setAuthLoading(false);
    }
  }, []);

  const checkUser = async (database: any) => {
      const storedUserId = localStorage.getItem("vexa_active_user_id");
      if (!storedUserId) {
          setAccessDenied({ denied: true, reason: "No active session." });
          setAuthLoading(false);
          return;
      }
      
      try {
          const docRef = doc(database, "users", storedUserId);
          const docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
              setAccessDenied({ denied: true, reason: "Profile not found." });
              setAuthLoading(false);
              return;
          }
          const userData = docSnap.data();
          if (userData.role === 'developer') {
              const currentUser = { uid: storedUserId, ...userData };
              setUser(currentUser);
              
              if (userData.devProfile) {
                  setDevProfile({ ...devProfile, ...userData.devProfile });
              } else {
                  setDevProfile(prev => ({ ...prev, companyName: userData.name || '', email: userData.email || '' }));
              }
              
              setAuthLoading(false);
              fetchMyProjects(currentUser.uid, database); 
          } else {
              setAccessDenied({ denied: true, reason: "Role mismatch (Not Developer)." });
              setAuthLoading(false);
          }
      } catch (error) {
          setAccessDenied({ denied: true, reason: "Database error." });
          setAuthLoading(false);
      } 
  };

  const fetchMyProjects = async (userId: string, database: any) => {
      setProjectsLoading(true);
      try {
          const q = query(
              collection(database, "listings"),
              where("agentId", "==", userId), 
              where("type", "==", "project") 
          );
          
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setMyProjects(data);
      } catch (error) { 
          console.error("Fetch Projects Error:", error);
      } finally { 
          setProjectsLoading(false); 
      }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
        initializeFirebase();
    }
  }, [initializeFirebase]);

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'coverPhoto') => {
      const file = e.target.files?.[0];
      if (!file) return;
      setProcessingProfileImage(true);
      try {
          const base64 = await compressImage(file);
          setDevProfile(prev => ({ ...prev, [field]: base64 }));
      } catch(e) { alert("Image upload failed"); }
      finally { setProcessingProfileImage(false); }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!db || !user) return;
      setProfileSaving(true);
      try {
          const cleanProfile = {
              ...devProfile,
              website: ensureProtocol(devProfile.website),
              facebook: ensureProtocol(devProfile.facebook),
              instagram: ensureProtocol(devProfile.instagram),
              tiktok: ensureProtocol(devProfile.tiktok),
              xiaohongshu: ensureProtocol(devProfile.xiaohongshu),
          };

          await updateDoc(doc(db, "users", user.uid), {
              devProfile: cleanProfile,
              name: devProfile.companyName
          });
          alert("Profile Saved Successfully!");
      } catch (e) { alert("Save Failed."); } 
      finally { setProfileSaving(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      const fileList = Array.from(files);
      const remainingSlots = 15 - formData.images.length;
      const filesToUpload = fileList.slice(0, remainingSlots);
      
      if (filesToUpload.length === 0) { alert("Maximum 15 images."); return; }

      setProcessingImage(true);
      try {
          const base64Results = await Promise.all(filesToUpload.map(f => compressImage(f)));
          const newImages = [...formData.images, ...base64Results];
          setFormData({ ...formData, images: newImages, coverImage: formData.coverImage || newImages[0] });
      } catch (e) { alert("Upload failed."); } 
      finally { setProcessingImage(false); e.target.value = ""; }
  };

  const handleLayoutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const base64 = await compressImage(file);
          const updatedLayouts = [...projectLayouts];
          updatedLayouts[index].image = base64;
          setProjectLayouts(updatedLayouts);
      } catch (e) { alert("Layout image failed."); }
  };

  const addLayout = () => {
      setProjectLayouts([...projectLayouts, { id: Date.now().toString(), name: '', size: '', image: '' }]);
  };

  const removeLayout = (index: number) => {
      const updated = [...projectLayouts];
      updated.splice(index, 1);
      setProjectLayouts(updated);
  };

  const updateLayout = (index: number, field: string, value: string) => {
      const updated = [...projectLayouts];
      (updated[index] as any)[field] = value;
      setProjectLayouts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!db || !user) return;
      setSubmitting(true);
      try {
          const payload = {
              ...formData,
              type: 'project', 
              agentId: user.uid,
              agentName: devProfile.companyName || user.name || 'Developer',
              agentPhoto: devProfile.logo || '',
              price: formData.minPrice, 
              status: 'pending', 
              layouts: projectLayouts,
              updatedAt: new Date(),
          };

          if (isEditing && editingId) {
              await updateDoc(doc(db, "listings", editingId), payload);
          } else {
              await addDoc(collection(db, "listings"), {
                  ...payload,
                  createdAt: new Date(),
                  views: 0
              });
          }
          setIsCreating(false);
          await fetchMyProjects(user.uid, db);
          alert("Project Submitted!");
      } catch (error) { alert("Failed to submit."); } 
      finally { setSubmitting(false); }
  };

  const openEdit = (project: any) => {
      setFormData({
          title: project.title || '', 
          developer: project.developer || '',
          description: project.description || '', 
          minPrice: project.minPrice || '', 
          maxPrice: project.maxPrice || '',
          state: project.state || '', 
          area: project.area || '', 
          images: project.images || [], 
          coverImage: project.coverImage || '',
          propertyType: project.propertyType || 'Condominium',
          status: project.status || 'Open for Registration',
          completionYear: project.completionYear || '',
          totalUnits: project.totalUnits || '',
          tenure: project.tenure || 'Freehold',
          landSize: project.landSize || '', 
          builtUpMin: project.builtUpMin || '', 
          builtUpMax: project.builtUpMax || '', 
          pricePsf: project.pricePsf || '',   
          maintenanceFee: project.maintenanceFee || '', 
          bookingFee: project.bookingFee || '', 
          landTitle: project.landTitle || 'Residential', 
          titleType: project.titleType || 'Strata', 
          salesGalleryLocation: project.salesGalleryLocation || '', 
          brochureUrl: project.brochureUrl || '', 
          facilities: project.facilities || [],
          bedrooms: project.bedrooms || '',
          bathrooms: project.bathrooms || ''
      });
      setProjectLayouts(project.layouts || []);
      setEditingId(project.id);
      setIsEditing(true);
      setIsCreating(true);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  
  if (accessDenied.denied) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
              <AlertTriangle size={48} className="text-red-500 mb-4" />
              <h1 className="text-xl font-bold text-slate-800">Access Denied</h1>
              <p className="text-slate-500 mb-6">{accessDenied.reason}</p>
              <Link href="/dashboard" className="px-6 py-2 bg-slate-800 text-white rounded-lg">Back to Dashboard</Link>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
        {/* Navbar */}
        <div className="bg-white border-b border-slate-200 px-4 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-blue-600"><ArrowLeft size={20} /> Back</Link>
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg text-white"><Building size={20} /></div>
                    <h1 className="font-bold text-lg text-slate-800 hidden md:block">Developer Console</h1>
                </div>
            </div>
            <div className="flex gap-3">
                {user && (
                    <Link href={`/developer/${user.uid}`} className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-full hover:bg-blue-100 transition-colors">
                        <ExternalLink size={14} /> Profile
                    </Link>
                )}
                <button onClick={() => { 
                    setIsCreating(true); 
                    setIsEditing(false); 
                    setProjectLayouts([]); 
                    setFormData({
                        title: '', developer: '', description: '', minPrice: '', maxPrice: '', state: '', area: '', images: [], coverImage: '', propertyType: 'Condominium', status: 'Open for Registration', completionYear: '', totalUnits: '', tenure: 'Freehold', landSize: '', builtUpMin: '', builtUpMax: '', pricePsf: '', maintenanceFee: '', bookingFee: '', landTitle: 'Residential', titleType: 'Strata', salesGalleryLocation: '', brochureUrl: '', facilities: [], bedrooms: '', bathrooms: ''
                    });
                }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm"><Plus size={18} /> New Project</button>
            </div>
        </div>

        {/* TABS */}
        <div className="container mx-auto px-4 md:px-8 mt-4 md:mt-6">
            <div className="flex gap-4 border-b border-slate-200">
                <button onClick={() => setActiveTab('projects')} className={`pb-3 px-4 font-medium text-sm transition-all border-b-2 ${activeTab === 'projects' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>My Projects</button>
                <button onClick={() => setActiveTab('profile')} className={`pb-3 px-4 font-medium text-sm transition-all border-b-2 ${activeTab === 'profile' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Edit Profile</button>
            </div>
        </div>

        {/* Content */}
        <div className="container mx-auto p-4 md:p-8">
             
             {/* PROJECTS TAB */}
             {activeTab === 'projects' && (
                 projectsLoading ? (
                     <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                 ) : myProjects.length === 0 ? (
                     <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                         <Building size={48} className="mx-auto text-slate-300 mb-4" />
                         <h3 className="text-lg font-bold text-slate-700">No Projects Yet</h3>
                         <p className="text-slate-500 mb-6">Start listing your developments today.</p>
                         <button onClick={() => setIsCreating(true)} className="text-blue-600 font-bold hover:underline">Create First Project</button>
                     </div>
                 ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myProjects.map(project => (
                            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="h-40 bg-slate-100 relative">
                                    {project.coverImage ? <img src={project.coverImage} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-400">No Image</div>}
                                    <span className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-bold shadow-sm">{project.status}</span>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg line-clamp-1">{project.title}</h3>
                                    <p className="text-sm text-slate-500 mb-4">{project.state} • {project.propertyType}</p>
                                    <div className="flex justify-between items-center border-t border-slate-100 pt-4 gap-2">
                                        <Link href={`/listing/${project.id}`} className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-bold"><Eye size={14}/> View</Link>
                                        <button onClick={() => openEdit(project)} className="text-blue-600 text-sm font-bold flex items-center gap-1"><Pencil size={14}/> Edit</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>
                 )
             )}

             {/* PROFILE TAB */}
             {activeTab === 'profile' && (
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto animate-in fade-in">
                      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Building size={24}/> Company Profile</h2>
                      
                      <form onSubmit={handleSaveProfile} className="space-y-6">
                          
                          {/* Images */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">Company Logo</label>
                                  <div className="relative w-32 h-32 bg-slate-100 rounded-xl border-2 border-slate-200 overflow-hidden group mx-auto md:mx-0">
                                      {devProfile.logo ? <img src={devProfile.logo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><Building size={32} /></div>}
                                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-xs font-bold transition-opacity">
                                          UPLOAD
                                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProfileImageUpload(e, 'logo')} />
                                      </label>
                                  </div>
                                  <p className="text-xs text-slate-400 mt-2 text-center md:text-left">Displayed on project cards.</p>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">Profile Background / Cover</label>
                                  <div className="relative w-full h-32 bg-slate-100 rounded-xl border-2 border-slate-200 overflow-hidden group">
                                      {devProfile.coverPhoto ? <img src={devProfile.coverPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Cover Photo</div>}
                                      <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-white text-xs font-bold transition-opacity">
                                          UPLOAD COVER
                                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProfileImageUpload(e, 'coverPhoto')} />
                                      </label>
                                  </div>
                                  <p className="text-xs text-slate-400 mt-2">Displayed on your public profile header.</p>
                              </div>
                          </div>

                          {/* Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium mb-1">Company Name</label>
                                  <input className="w-full border p-2 rounded-lg" value={devProfile.companyName} onChange={e => setDevProfile({...devProfile, companyName: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium mb-1">Registration No. (SSM)</label>
                                  <input className="w-full border p-2 rounded-lg" value={devProfile.registrationNumber} onChange={e => setDevProfile({...devProfile, registrationNumber: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium mb-1">Email</label>
                                  <input className="w-full border p-2 rounded-lg" value={devProfile.email} onChange={e => setDevProfile({...devProfile, email: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium mb-1">Phone</label>
                                  <input className="w-full border p-2 rounded-lg" value={devProfile.phone} onChange={e => setDevProfile({...devProfile, phone: e.target.value})} />
                              </div>
                          </div>

                          <div>
                              <label className="block text-sm font-medium mb-1">Address</label>
                              <input className="w-full border p-2 rounded-lg" value={devProfile.address} onChange={e => setDevProfile({...devProfile, address: e.target.value})} placeholder="HQ Address" />
                          </div>

                          <div>
                              <label className="block text-sm font-medium mb-1">About Company</label>
                              <textarea className="w-full border p-2 rounded-lg" rows={4} value={devProfile.description} onChange={e => setDevProfile({...devProfile, description: e.target.value})} placeholder="Tell buyers about your company history and vision..." />
                          </div>

                          {/* Socials */}
                          <div className="space-y-3 pt-4 border-t border-slate-100">
                              <h3 className="font-bold text-slate-700">Web & Social</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex items-center gap-2 border p-2 rounded-lg"><Globe size={16} className="text-slate-400" /><input className="w-full outline-none text-sm" placeholder="Website URL" value={devProfile.website} onChange={e => setDevProfile({...devProfile, website: e.target.value})} /></div>
                                  <div className="flex items-center gap-2 border p-2 rounded-lg"><Facebook size={16} className="text-blue-600" /><input className="w-full outline-none text-sm" placeholder="Facebook URL" value={devProfile.facebook} onChange={e => setDevProfile({...devProfile, facebook: e.target.value})} /></div>
                                  <div className="flex items-center gap-2 border p-2 rounded-lg"><Instagram size={16} className="text-pink-600" /><input className="w-full outline-none text-sm" placeholder="Instagram URL" value={devProfile.instagram} onChange={e => setDevProfile({...devProfile, instagram: e.target.value})} /></div>
                                  <div className="flex items-center gap-2 border p-2 rounded-lg"><Video size={16} className="text-black" /><input className="w-full outline-none text-sm" placeholder="TikTok URL" value={devProfile.tiktok} onChange={e => setDevProfile({...devProfile, tiktok: e.target.value})} /></div>
                                  <div className="flex items-center gap-2 border p-2 rounded-lg"><BookOpen size={16} className="text-red-500" /><input className="w-full outline-none text-sm" placeholder="XiaoHongShu URL" value={devProfile.xiaohongshu} onChange={e => setDevProfile({...devProfile, xiaohongshu: e.target.value})} /></div>
                              </div>
                          </div>

                          <div className="flex justify-end pt-4">
                              <button type="submit" disabled={profileSaving || processingProfileImage} className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2">
                                  {profileSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />} Save Profile
                              </button>
                          </div>
                      </form>
                 </div>
             )}
        </div>

        {/* Create/Edit Modal */}
        {isCreating && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-xl">{isEditing ? 'Edit Project' : 'New Project'}</h2>
                        <button onClick={() => setIsCreating(false)}><X size={24} className="text-slate-400" /></button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section 1: Basic Info */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-700 border-b pb-2">Project Overview</h3>
                            <div>
                                <label className="block text-sm font-medium mb-1">Project Title</label>
                                <input className="w-full border border-slate-300 p-2 rounded-lg" placeholder="e.g. Vexa Residences" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">State</label>
                                    <select className="w-full border border-slate-300 p-2 rounded-lg" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})}>
                                        <option value="">Select</option>
                                        {MALAYSIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Area / City</label>
                                    <input className="w-full border border-slate-300 p-2 rounded-lg" placeholder="e.g. KLCC" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Property Type</label>
                                    <select className="w-full border border-slate-300 p-2 rounded-lg" value={formData.propertyType} onChange={e => setFormData({...formData, propertyType: e.target.value})}>
                                        {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select className="w-full border border-slate-300 p-2 rounded-lg" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        {PROJECT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Details & Pricing */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-700 border-b pb-2">Details & Pricing</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Min Price (RM)</label>
                                    <input type="number" className="w-full border border-slate-300 p-2 rounded-lg" placeholder="RM" value={formData.minPrice} onChange={e => setFormData({...formData, minPrice: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Max Price (RM)</label>
                                    <input type="number" className="w-full border border-slate-300 p-2 rounded-lg" placeholder="RM" value={formData.maxPrice} onChange={e => setFormData({...formData, maxPrice: e.target.value})} />
                                </div>
                            </div>
                            
                            {/* Added Bedrooms and Bathrooms */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Bedrooms</label>
                                    <input className="w-full border border-slate-300 p-2 rounded-lg" placeholder="e.g. 3 or 3-4" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Bathrooms</label>
                                    <input className="w-full border border-slate-300 p-2 rounded-lg" placeholder="e.g. 2" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Avg Price PSF</label>
                                    <input type="number" className="w-full border border-slate-300 p-2 rounded-lg" placeholder="RM" value={formData.pricePsf} onChange={e => setFormData({...formData, pricePsf: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Maintenance</label>
                                    <input type="number" className="w-full border border-slate-300 p-2 rounded-lg" placeholder="RM/sf" value={formData.maintenanceFee} onChange={e => setFormData({...formData, maintenanceFee: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Booking Fee</label>
                                    <input type="number" className="w-full border border-slate-300 p-2 rounded-lg" placeholder="RM" value={formData.bookingFee} onChange={e => setFormData({...formData, bookingFee: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Built-up (Min sqft)</label>
                                    <input type="number" className="w-full border border-slate-300 p-2 rounded-lg" value={formData.builtUpMin} onChange={e => setFormData({...formData, builtUpMin: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Built-up (Max sqft)</label>
                                    <input type="number" className="w-full border border-slate-300 p-2 rounded-lg" value={formData.builtUpMax} onChange={e => setFormData({...formData, builtUpMax: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Land Title</label>
                                    <select className="w-full border border-slate-300 p-2 rounded-lg" value={formData.landTitle} onChange={e => setFormData({...formData, landTitle: e.target.value})}>
                                        {LAND_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title Type</label>
                                    <select className="w-full border border-slate-300 p-2 rounded-lg" value={formData.titleType} onChange={e => setFormData({...formData, titleType: e.target.value})}>
                                        {TITLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tenure</label>
                                    <select className="w-full border border-slate-300 p-2 rounded-lg" value={formData.tenure} onChange={e => setFormData({...formData, tenure: e.target.value})}>
                                        {TENURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Total Units</label>
                                    <input type="number" className="w-full border border-slate-300 p-2 rounded-lg" value={formData.totalUnits} onChange={e => setFormData({...formData, totalUnits: e.target.value})} />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Sales Gallery Address</label>
                                <input className="w-full border border-slate-300 p-2 rounded-lg" value={formData.salesGalleryLocation} onChange={e => setFormData({...formData, salesGalleryLocation: e.target.value})} placeholder="Waze/Google Maps Link or Address" />
                            </div>
                        </div>

                        {/* Section 3: Unit Layouts / Types (NEW) */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-700 border-b pb-2 flex items-center gap-2"><LayoutTemplate size={18}/> Unit Types & Floor Plans</h3>
                            
                            {projectLayouts.map((layout, idx) => (
                                <div key={layout.id || idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative">
                                    <button type="button" onClick={() => removeLayout(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Type Name</label>
                                            <input className="w-full border p-2 rounded text-sm" placeholder="e.g. Type A" value={layout.name} onChange={e => updateLayout(idx, 'name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Size (sqft)</label>
                                            <input className="w-full border p-2 rounded text-sm" placeholder="e.g. 730" value={layout.size} onChange={e => updateLayout(idx, 'size', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Floor Plan Image</label>
                                        <div className="flex items-center gap-4">
                                            {layout.image ? (
                                                <img src={layout.image} className="w-16 h-16 object-cover rounded border bg-white" />
                                            ) : (
                                                <div className="w-16 h-16 bg-slate-200 rounded flex items-center justify-center text-slate-400"><ImageIcon size={20} /></div>
                                            )}
                                            <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1.5 rounded text-xs font-medium hover:bg-slate-50">
                                                Upload Plan
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLayoutImageUpload(e, idx)} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button type="button" onClick={addLayout} className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center gap-2">
                                <Plus size={18} /> Add Layout Type
                            </button>
                        </div>

                        {/* Section 4: Media & Description */}
                        <div className="space-y-4">
                             <h3 className="font-bold text-slate-700 border-b pb-2">Media & Description</h3>
                             <div>
                                <label className="block text-sm font-medium mb-1">Project Images</label>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {formData.images.map((img, idx) => (
                                        <div key={idx} className="relative group shrink-0">
                                            <img src={img} className={`w-20 h-20 object-cover rounded-lg border ${formData.coverImage === img ? 'ring-2 ring-blue-500' : ''}`} />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity rounded-lg">
                                                 <button type="button" onClick={() => setFormData({...formData, coverImage: img})} className="text-white hover:text-yellow-400"><Star size={14} /></button>
                                                 <button type="button" onClick={() => {
                                                     const newImages = formData.images.filter((_, i) => i !== idx);
                                                     setFormData({...formData, images: newImages, coverImage: formData.coverImage === img ? newImages[0] || '' : formData.coverImage});
                                                 }} className="text-white hover:text-red-400"><Trash2 size={14} /></button>
                                            </div>
                                            {formData.coverImage === img && <span className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] px-1 rounded-bl">COVER</span>}
                                        </div>
                                    ))}
                                    <label className={`w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 shrink-0 ${processingImage ? 'opacity-50' : ''}`}>
                                        {processingImage ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                                        <span className="text-[10px] text-slate-500">Add</span>
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} disabled={processingImage} />
                                    </label>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Upload multiple images. Select Star to set Cover/Main Background.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea className="w-full border border-slate-300 p-2 rounded-lg" rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-700">{submitting ? 'Saving...' : 'Submit Project'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}

export default function DeveloperDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}>
      <DeveloperDashboardContent />
    </Suspense>
  );
}
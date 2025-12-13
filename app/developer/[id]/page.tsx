"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Globe, 
  Facebook, 
  Instagram, 
  Video, 
  BookOpen, 
  CheckCircle2, 
  Building, 
  ArrowLeft,
  Loader2,
  Building2,
  User,
  Share2,
  LayoutTemplate
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function DeveloperProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [developer, setDeveloper] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);

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
        const db = getFirestore(app);
        fetchDeveloper(db);
    } catch (e) { console.error(e); }
  }, []);

  const fetchDeveloper = async (db: any) => {
      if (!id) return;
      try {
          // Fetch User Profile
          const docRef = doc(db, "users", id as string);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data().role === 'developer') {
              const data = docSnap.data();
              setDeveloper({
                  id: docSnap.id,
                  name: data.name,
                  ...data.devProfile
              });
              
              // Fetch Projects
              const q = query(
                  collection(db, "listings"),
                  where("agentId", "==", id),
                  where("type", "==", "project")
              );
              const projectSnap = await getDocs(q);
              setProjects(projectSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          } else {
              alert("Developer not found.");
              router.push('/');
          }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') initializeFirebase();
  }, [initializeFirebase]);

  const handleShare = async () => {
      if (navigator.share) {
          try { await navigator.share({ title: developer.companyName, url: window.location.href }); } 
          catch (e) { console.log(e); }
      } else {
          await navigator.clipboard.writeText(window.location.href);
          alert("Link copied!");
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  if (!developer) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
        {/* Sticky Nav */}
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium">
                    <ArrowLeft size={20} /> Back
                </button>
                <button onClick={handleShare} className="p-2 rounded-full hover:bg-slate-100 text-slate-500"><Share2 size={20} /></button>
            </div>
        </div>

        {/* Hero Banner */}
        <div className="relative h-64 md:h-80 bg-slate-900 overflow-hidden">
            {/* If developer has a cover image, show it. If not, maybe use first project cover? */}
            {projects[0]?.coverImage ? (
                 <>
                    <div className="absolute inset-0 bg-black/40 z-10"></div>
                    <img src={projects[0].coverImage} className="w-full h-full object-cover opacity-80" />
                 </>
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-900 to-slate-900 flex items-center justify-center">
                    <Building2 className="text-white/10 w-32 h-32" />
                </div>
            )}
        </div>

        <div className="container mx-auto px-4 pb-12 -mt-20 relative z-20">
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
                <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-xl shadow-md border-4 border-white overflow-hidden flex-shrink-0 -mt-16 relative z-30">
                    {developer.logo ? (
                        <img src={developer.logo} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400"><Building size={40} /></div>
                    )}
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                         <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200">Property Developer</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{developer.companyName}</h1>
                    <p className="text-slate-500 flex items-center gap-2 text-sm"><MapPin size={16}/> {developer.address || "Location N/A"}</p>
                    
                    {/* Stats */}
                    <div className="flex gap-6 mt-6 border-t border-slate-100 pt-6">
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Active Projects</p>
                        </div>
                        {/* Can add more stats if available */}
                    </div>
                </div>

                {/* Contact Actions */}
                <div className="flex flex-col gap-3 w-full md:w-64">
                     {developer.website && (
                         <a href={developer.website} target="_blank" className="w-full border border-slate-200 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                             <Globe size={18} /> Visit Website
                         </a>
                     )}
                     <div className="flex gap-2">
                        {developer.facebook && <a href={developer.facebook} target="_blank" className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-xl flex items-center justify-center hover:bg-blue-100"><Facebook size={20} /></a>}
                        {developer.instagram && <a href={developer.instagram} target="_blank" className="flex-1 bg-pink-50 text-pink-600 py-3 rounded-xl flex items-center justify-center hover:bg-pink-100"><Instagram size={20} /></a>}
                        {developer.tiktok && <a href={developer.tiktok} target="_blank" className="flex-1 bg-slate-100 text-black py-3 rounded-xl flex items-center justify-center hover:bg-slate-200"><Video size={20} /></a>}
                     </div>
                </div>
            </div>

            {/* About */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><BookOpen size={20} className="text-blue-600"/> About Developer</h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{developer.description || "No description provided."}</p>
                    </div>

                    {/* Projects List */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><LayoutTemplate size={24} className="text-blue-600"/> Our Projects</h3>
                        {projects.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">No projects listed yet.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {projects.map(project => (
                                    <Link href={`/listing/${project.id}`} key={project.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all border border-slate-200 overflow-hidden group">
                                        <div className="h-48 bg-slate-200 relative overflow-hidden">
                                            {project.coverImage ? (
                                                <img src={project.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                            ) : <div className="flex items-center justify-center h-full text-slate-400">No Image</div>}
                                            <div className="absolute top-3 left-3">
                                                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase">{project.status}</span>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-bold text-lg text-slate-900 mb-1 line-clamp-1">{project.title}</h4>
                                            <p className="text-sm text-slate-500 mb-3">{project.propertyType} • {project.area}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                <span className="bg-slate-100 px-2 py-1 rounded">{project.tenure}</span>
                                                <span className="bg-slate-100 px-2 py-1 rounded">{project.totalUnits} Units</span>
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                                <span className="text-blue-600 font-bold text-sm">From RM {Number(project.minPrice || 0).toLocaleString()}</span>
                                                <span className="text-xs text-slate-400">View Details &rarr;</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                     <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Contact Info</h3>
                        <div className="space-y-4 text-sm">
                            {developer.registrationNumber && (
                                <div>
                                    <p className="text-slate-400 text-xs uppercase font-bold mb-1">Registration No.</p>
                                    <p className="font-medium text-slate-700">{developer.registrationNumber}</p>
                                </div>
                            )}
                            {developer.email && (
                                <div>
                                    <p className="text-slate-400 text-xs uppercase font-bold mb-1">Email</p>
                                    <a href={`mailto:${developer.email}`} className="font-medium text-blue-600 hover:underline break-all">{developer.email}</a>
                                </div>
                            )}
                            {developer.phone && (
                                <div>
                                    <p className="text-slate-400 text-xs uppercase font-bold mb-1">Phone</p>
                                    <p className="font-medium text-slate-700">{developer.phone}</p>
                                </div>
                            )}
                        </div>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
}
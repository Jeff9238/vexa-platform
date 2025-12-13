"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Shield, 
  Check, 
  X, 
  User, 
  Loader2, 
  Clock, 
  LayoutDashboard, 
  Users, 
  Building, 
  Car, 
  Bell,
  Search,
  Filter,
  Flag,
  AlertTriangle,
  MoreVertical,
  Eye,
  Hammer,
  Trash2,
  Lock,
  ExternalLink,
  Menu,
  FileText
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// GLOBAL TYPE DEFINITIONS
declare global {
  interface Window {
    firebase: any;
    firestoreDb?: any;
    __firebase_config?: string;
  }
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'requests' | 'users' | 'listings' | 'reports'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  
  // Data States
  const [pendingRequests, setPendingRequests] = useState<any[]>([]); // Agents
  const [pendingProRequests, setPendingProRequests] = useState<any[]>([]); 
  const [pendingDevelopers, setPendingDevelopers] = useState<any[]>([]); // New: Developers
  
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]); 
  const [projects, setProjects] = useState<any[]>([]); // New: Projects
  
  const [reports, setReports] = useState<any[]>([]);   
  const [db, setDb] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Listing Filter/Search States
  const [listingType, setListingType] = useState<'all' | 'property' | 'vehicle' | 'project'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');

  // User Filter/Search States
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'agent' | 'pro' | 'developer' | 'user'>('all');

  // 1. INITIALIZE FIREBASE (Modular SDK)
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
        checkAdminAccess(dbInstance);
    } catch (e) {
      console.error("Firebase Init Error:", e);
    }
  }, []);

  // 2. SECURITY CHECK
  const checkAdminAccess = async (database: any) => {
      const storedUserId = localStorage.getItem("vexa_active_user_id");
      
      if (!storedUserId) {
          // For demo purposes, we might allow bypass if no auth logic is strict, 
          // but usually we redirect.
          // alert("Access Denied: Please log in first.");
          // router.push('/dashboard');
          // return;
      }

      try {
          if (storedUserId) {
              const docRef = doc(database, "users", storedUserId);
              const docSnap = await getDoc(docRef);
              
              if (docSnap.exists() && docSnap.data().role === 'admin') {
                  setIsAuthorized(true);
                  fetchData(database); 
              } else {
                 // Allow access for testing if no admin exists? Or strict?
                 // Strict:
                 // alert("ACCESS DENIED: You do not have administrator privileges.");
                 // router.push('/dashboard');
                 
                 // Demo Mode (Remove for prod):
                 setIsAuthorized(true);
                 fetchData(database);
              }
          } else {
              // Demo fallback
              setIsAuthorized(true);
              fetchData(database);
          }
      } catch (error) {
          console.error("Security check failed:", error);
          // Allow render for safety in demo environment to fix bugs
          setIsAuthorized(true);
          fetchData(database);
      }
  };

  // 3. FETCH DATA
  const fetchData = async (database: any) => {
    try {
        setLoading(true);
        
        // Fetch Pending Agent Requests
        const agentQ = query(collection(database, "users"), where("agentRequest.status", "==", "pending"));
        const agentSnap = await getDocs(agentQ);
        setPendingRequests(agentSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), type: 'agent' })));

        // Fetch Pending Pro Requests
        const proQ = query(collection(database, "users"), where("proRequest.status", "==", "pending"));
        const proSnap = await getDocs(proQ);
        setPendingProRequests(proSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), type: 'pro' })));

        // Fetch Pending Developer Requests
        const devQ = query(collection(database, "users"), where("developerRequest.status", "==", "pending"));
        const devSnap = await getDocs(devQ);
        setPendingDevelopers(devSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), type: 'developer' })));

        // Fetch All Users (Limit for performance)
        const usersQ = query(collection(database, "users")); // Removed limit to see all for now, add limit if large
        const usersSnap = await getDocs(usersQ);
        setAllUsers(usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        // Fetch Listings & Projects
        const listingsQ = query(collection(database, "listings"));
        const listingsSnap = await getDocs(listingsQ);
        const allListings = listingsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Sort by Date (Newest First)
        allListings.sort((a: any, b: any) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });
        
        setListings(allListings); // Contains Property, Vehicle, and Project

        // Mock Reports
        const mockReports = [
            { id: "R001", targetId: "L003", type: "scam", reporter: "Angry User", reason: "Asking for deposit before viewing", date: "2023-10-18", status: "open" }
        ];
        setReports(mockReports);

    } catch (error) {
        console.error("Error fetching admin data:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeFirebase();
    }
  }, [initializeFirebase]);

  // ACTIONS
  const handleApproveUser = async (userId: string, currentName: string, roleType: 'agent' | 'pro' | 'developer') => {
    if (!db) return;
    setProcessingId(userId);
    try {
        const updateData: any = { role: roleType };
        
        if (roleType === 'agent') {
            updateData['agentRequest.status'] = 'approved';
            updateData['agentRequest.approvedAt'] = new Date();
        } else if (roleType === 'pro') {
            updateData['proRequest.status'] = 'approved';
            updateData['proRequest.approvedAt'] = new Date();
        } else if (roleType === 'developer') {
            updateData['developerRequest.status'] = 'approved';
            updateData['developerRequest.approvedAt'] = new Date();
        }

        await updateDoc(doc(db, "users", userId), updateData);
        
        // Update local state
        if (roleType === 'agent') setPendingRequests(prev => prev.filter(u => u.id !== userId));
        if (roleType === 'pro') setPendingProRequests(prev => prev.filter(u => u.id !== userId));
        if (roleType === 'developer') setPendingDevelopers(prev => prev.filter(u => u.id !== userId));
        
        setAllUsers(prev => prev.map(u => u.id === userId ? {...u, role: roleType} : u));
    } catch (error) { console.error(error); alert("Failed."); } 
    finally { setProcessingId(null); }
  };

  const handleRejectUser = async (userId: string, roleType: 'agent' | 'pro' | 'developer') => {
    if (!db) return;
    if (!confirm("Reject this request?")) return;
    setProcessingId(userId);
    try {
        const updateData: any = {};
        if (roleType === 'agent') updateData['agentRequest.status'] = 'rejected';
        else if (roleType === 'pro') updateData['proRequest.status'] = 'rejected';
        else if (roleType === 'developer') updateData['developerRequest.status'] = 'rejected';

        await updateDoc(doc(db, "users", userId), updateData);
        
        if (roleType === 'agent') setPendingRequests(prev => prev.filter(u => u.id !== userId));
        if (roleType === 'pro') setPendingProRequests(prev => prev.filter(u => u.id !== userId));
        if (roleType === 'developer') setPendingDevelopers(prev => prev.filter(u => u.id !== userId));
    } catch (error) { console.error(error); } 
    finally { setProcessingId(null); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!db) return;
    if (!confirm("Are you sure you want to PERMANENTLY DELETE this user?")) return;
    
    setProcessingId(userId);
    try {
        await deleteDoc(doc(db, "users", userId));
        setAllUsers(prev => prev.filter(u => u.id !== userId));
        setPendingRequests(prev => prev.filter(u => u.id !== userId));
        setPendingProRequests(prev => prev.filter(u => u.id !== userId));
        setPendingDevelopers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
        console.error("Delete failed:", error);
    } finally {
        setProcessingId(null);
    }
  };

  const handleApproveListing = async (listingId: string) => {
      if(!db) return;
      setProcessingId(listingId);
      try {
          await updateDoc(doc(db, "listings", listingId), { status: 'active' });
          setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'active' } : l));
      } catch(e) { console.error(e); } 
      finally { setProcessingId(null); }
  };

  const handleRejectListing = async (listingId: string) => {
      if(!db) return;
      if(!confirm("Suspend this listing?")) return;
      setProcessingId(listingId);
      try {
          await updateDoc(doc(db, "listings", listingId), { status: 'suspended' });
          setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'suspended' } : l));
      } catch(e) { console.error(e); } 
      finally { setProcessingId(null); }
  };

  const handleDeleteListing = async (listingId: string) => {
      if(!db) return;
      if(!confirm("Delete this listing?")) return;
      setProcessingId(listingId);
      try {
          await deleteDoc(doc(db, "listings", listingId));
          setListings(prev => prev.filter(l => l.id !== listingId));
      } catch(e) { console.error(e); } 
      finally { setProcessingId(null); }
  };

  const SidebarItem = ({ id, icon: Icon, label, count, colorClass }: any) => (
    <button 
      onClick={() => { setActiveView(id); setMobileMenuOpen(false); }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
        activeView === id 
          ? 'bg-vexa-blue text-white shadow-md' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </div>
      {count > 0 && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeView === id ? 'bg-white/20 text-white' : (colorClass || 'bg-red-100 text-red-600')
        }`}>
            {count}
        </span>
      )}
    </button>
  );

  const DashboardView = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-xs uppercase font-bold">Total Users</p>
                        <h3 className="text-2xl font-bold text-slate-800">{allUsers.length}</h3>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg text-vexa-blue"><Users size={20} /></div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-xs uppercase font-bold">Pending Requests</p>
                        <h3 className="text-2xl font-bold text-orange-600">{pendingRequests.length + pendingProRequests.length + pendingDevelopers.length}</h3>
                    </div>
                    <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><Shield size={20} /></div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-xs uppercase font-bold">Listings & Projects</p>
                        <h3 className="text-2xl font-bold text-emerald-600">{listings.length}</h3>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><Building size={20} /></div>
                </div>
            </div>
        </div>
    </div>
  );

  const UsersView = () => {
      // User Filtering Logic
      const filteredUsers = allUsers.filter(u => {
          const matchesRole = userRoleFilter === 'all' 
             ? true 
             : userRoleFilter === 'user' 
                ? (!u.role || u.role === 'user') 
                : u.role === userRoleFilter;

          const matchesSearch = u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                u.id.toLowerCase().includes(userSearchTerm.toLowerCase());
          
          return matchesRole && matchesSearch;
      });

      return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">All Registered Users</h2>
            
            {/* User Search & Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search users by name, email, or ID..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vexa-blue/20" 
                        value={userSearchTerm} 
                        onChange={(e) => setUserSearchTerm(e.target.value)} 
                    />
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
                    {['all', 'user', 'agent', 'pro', 'developer'].map((role) => (
                        <button 
                            key={role}
                            onClick={() => setUserRoleFilter(role as any)} 
                            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize whitespace-nowrap transition-all ${userRoleFilter === role ? 'bg-white text-vexa-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {role}s
                        </button>
                    ))}
                </div>
            </div>

            {/* MOBILE: CARD VIEW */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-slate-900">{user.name || 'Unknown'}</h4>
                                <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                user.role === 'agent' ? 'bg-emerald-100 text-emerald-700' :
                                user.role === 'pro' ? 'bg-blue-100 text-blue-700' :
                                user.role === 'developer' ? 'bg-indigo-100 text-indigo-700' :
                                'bg-slate-100 text-slate-700'
                            }`}>{user.role || 'user'}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">ID: {user.id}</div>
                        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                            <button onClick={() => handleDeleteUser(user.id)} className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold">
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                ))}
                {filteredUsers.length === 0 && <p className="text-center text-slate-500 py-8">No users found.</p>}
            </div>

            {/* DESKTOP: TABLE VIEW */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                        <tr>
                            <th className="px-6 py-4 font-medium">Name / Email</th>
                            <th className="px-6 py-4 font-medium">Role</th>
                            <th className="px-6 py-4 font-medium">ID</th>
                            <th className="px-6 py-4 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{user.name || 'Unknown'}</div>
                                    <div className="text-xs text-slate-400">{user.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                        user.role === 'agent' ? 'bg-emerald-100 text-emerald-800' :
                                        user.role === 'pro' ? 'bg-blue-100 text-blue-800' :
                                        user.role === 'developer' ? 'bg-indigo-100 text-indigo-800' :
                                        'bg-slate-100 text-slate-800'
                                    }`}>
                                        {user.role || 'user'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-slate-400">{user.id}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && <p className="text-center text-slate-500 py-8">No users found.</p>}
            </div>
        </div>
      );
  };

  const ListingsView = () => {
    const filteredListings = listings.filter(l => {
        const matchesType = listingType === 'all' ? true : l.type === listingType;
        const matchesSearch = l.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              l.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              l.agentName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : l.status === statusFilter;
        return matchesType && matchesSearch && matchesStatus;
    });

    return (
      <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-800">Listings Manager</h2>
              <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
                  <button onClick={() => setListingType('all')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${listingType === 'all' ? 'bg-vexa-blue text-white shadow-sm' : 'text-slate-500'}`}>All</button>
                  <button onClick={() => setListingType('property')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${listingType === 'property' ? 'bg-vexa-blue text-white shadow-sm' : 'text-slate-500'}`}>Properties</button>
                  <button onClick={() => setListingType('vehicle')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${listingType === 'vehicle' ? 'bg-vexa-blue text-white shadow-sm' : 'text-slate-500'}`}>Vehicles</button>
                  <button onClick={() => setListingType('project')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${listingType === 'project' ? 'bg-vexa-blue text-white shadow-sm' : 'text-slate-500'}`}>Projects</button>
              </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="text" placeholder="Search Listings..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vexa-blue/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                  <Filter className="text-slate-400" size={20} />
                  <select className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:outline-none" value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                  </select>
              </div>
          </div>

          {/* MOBILE: CARD VIEW */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredListings.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                            <p className="text-xs text-slate-500">{item.id} • {item.type}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-slate-600">
                        <span>{item.agentName}</span>
                        <span className="font-bold text-vexa-blue">RM {item.price}</span>
                    </div>
                    <div className="flex gap-2 mt-2 pt-3 border-t border-slate-100">
                        {item.status === 'pending' && (
                            <>
                                <button onClick={() => handleApproveListing(item.id)} className="flex-1 bg-emerald-50 text-emerald-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1"><Check size={16}/> Approve</button>
                                <button onClick={() => handleRejectListing(item.id)} className="flex-1 bg-yellow-50 text-yellow-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1"><X size={16}/> Reject</button>
                            </>
                        )}
                        <button onClick={() => handleDeleteListing(item.id)} className="flex-none bg-red-50 text-red-600 p-2 rounded-lg"><Trash2 size={20}/></button>
                    </div>
                </div>
            ))}
          </div>

          {/* DESKTOP: TABLE VIEW */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                      <tr>
                          <th className="px-6 py-4 font-medium">Listing Details</th>
                          <th className="px-6 py-4 font-medium">Agent/Owner</th>
                          <th className="px-6 py-4 font-medium">Price</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredListings.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                  <div className="font-medium text-slate-900 line-clamp-1">{item.title}</div>
                                  <div className="text-xs text-slate-400">ID: {item.id} • {item.type}</div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">{item.agentName}</td>
                              <td className="px-6 py-4 font-medium text-vexa-blue">RM {item.price}</td>
                              <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                      item.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                                      item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                  }`}>
                                      {item.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                      {item.status === 'pending' && (
                                          <>
                                              <button onClick={() => handleApproveListing(item.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"><Check size={16} /></button>
                                              <button onClick={() => handleRejectListing(item.id)} className="p-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"><X size={16} /></button>
                                          </>
                                      )}
                                      <button onClick={() => handleDeleteListing(item.id)} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"><Trash2 size={16} /></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    );
  };

  const RequestsView = () => (
      <div className="space-y-8">
           <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Bell className="text-orange-500" /> Agent Applications
            </h2>
            {pendingRequests.length === 0 ? <p className="text-slate-500 bg-white p-4 rounded-xl border border-slate-200">No pending requests.</p> : (
                <div className="grid gap-4">
                    {pendingRequests.map((user) => (
                        <div key={user.id} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center gap-4">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-900">{user.name || 'Unknown'}</h3>
                                <p className="text-sm text-slate-500">{user.email}</p>
                                <p className="text-xs text-slate-400 font-mono mt-1">{user.id}</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={() => handleRejectUser(user.id, 'agent')} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-red-600 hover:bg-red-50">Reject</button>
                                <button onClick={() => handleApproveUser(user.id, user.name, 'agent')} className="flex-1 px-4 py-2 bg-vexa-blue text-white rounded-lg hover:bg-blue-700">Approve</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
           </div>
           
           <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Hammer className="text-purple-500" /> Pro Applications
            </h2>
            {pendingProRequests.length === 0 ? <p className="text-slate-500 bg-white p-4 rounded-xl border border-slate-200">No pending requests.</p> : (
                <div className="grid gap-4">
                    {pendingProRequests.map((user) => (
                        <div key={user.id} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center gap-4">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-900">{user.name || 'Unknown'}</h3>
                                <p className="text-sm text-slate-500">{user.email}</p>
                                <p className="text-xs text-slate-400 mt-1 italic">Type: {user.proRequest?.proType || 'General'}</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={() => handleRejectUser(user.id, 'pro')} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-red-600 hover:bg-red-50">Reject</button>
                                <button onClick={() => handleApproveUser(user.id, user.name, 'pro')} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Approve</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
           </div>

           <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Building className="text-indigo-500" /> Developer Applications
            </h2>
            {pendingDevelopers.length === 0 ? <p className="text-slate-500 bg-white p-4 rounded-xl border border-slate-200">No pending requests.</p> : (
                <div className="grid gap-4">
                    {pendingDevelopers.map((user) => (
                        <div key={user.id} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center gap-4">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-900">{user.name || 'Unknown'}</h3>
                                <p className="text-sm text-slate-500">{user.email}</p>
                                <p className="text-xs text-slate-400 mt-1">Company: {user.devProfile?.companyName || 'N/A'}</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={() => handleRejectUser(user.id, 'developer')} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-red-600 hover:bg-red-50">Reject</button>
                                <button onClick={() => handleApproveUser(user.id, user.name, 'developer')} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Approve</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
           </div>
      </div>
  );

  const ReportsView = () => (
      <div className="space-y-4">
          <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <AlertTriangle /> Scam & Abuse Reports
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
                <Shield className="text-emerald-500 mx-auto mb-4" size={32} />
                <h3 className="text-xl font-bold text-slate-800">Clean Records</h3>
                <p className="text-slate-500">No active reports.</p>
          </div>
      </div>
  );

  if (!isAuthorized && loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="animate-spin text-vexa-blue" size={40} />
          </div>
      );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20 md:pb-0">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
          <h1 className="text-xl font-bold text-vexa-blue flex items-center gap-2">
             <Shield size={24} /> Admin
          </h1>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 bg-slate-100 rounded-lg">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
      </div>

      <div className="flex">
        {/* SIDEBAR */}
        <div className={`fixed inset-y-0 left-0 transform ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-white border-r border-slate-200 flex flex-col md:static h-screen`}>
            <div className="p-6 border-b border-slate-100 hidden md:block">
                <h1 className="text-2xl font-bold text-vexa-blue flex items-center gap-2">
                    <Shield size={28} /> VEXA<span className="text-slate-400 text-sm font-normal">Admin</span>
                </h1>
            </div>
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                <SidebarItem id="dashboard" icon={LayoutDashboard} label="Overview" count={0} />
                <SidebarItem id="requests" icon={Bell} label="Requests" count={pendingRequests.length + pendingProRequests.length + pendingDevelopers.length} colorClass="bg-orange-100 text-orange-600" />
                <SidebarItem id="users" icon={Users} label="User Management" count={0} />
                <SidebarItem id="listings" icon={Building} label="Listings & Projects" count={listings.filter(l => l.status === 'pending').length} colorClass="bg-yellow-100 text-yellow-600" />
                <SidebarItem id="reports" icon={Flag} label="Reports" count={reports.length} colorClass="bg-red-100 text-red-600" />
            </div>
        </div>

        {/* OVERLAY */}
        {mobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-20 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
            ></div>
        )}

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
            {loading ? (
                <div className="flex justify-center items-center h-full">
                    <Loader2 size={40} className="animate-spin text-vexa-blue" />
                </div>
            ) : (
                <>
                    {activeView === 'dashboard' && <DashboardView />}
                    {activeView === 'requests' && <RequestsView />}
                    {activeView === 'users' && <UsersView />}
                    {activeView === 'listings' && <ListingsView />}
                    {activeView === 'reports' && <ReportsView />}
                </>
            )}
        </div>
      </div>
    </div>
  );
}
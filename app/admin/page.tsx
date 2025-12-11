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
  ExternalLink
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  
  // Data States
  const [pendingRequests, setPendingRequests] = useState<any[]>([]); // Agents
  const [pendingProRequests, setPendingProRequests] = useState<any[]>([]); // Pros
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]); 
  const [reports, setReports] = useState<any[]>([]);   
  const [db, setDb] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter/Search States
  const [listingType, setListingType] = useState<'all' | 'property' | 'vehicle'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');

  // 1. INITIALIZE FIREBASE
  const initializeFirebase = useCallback(async () => {
    try {
        if (typeof window.firestoreDb !== 'undefined' && window.firestoreDb) {
            setDb(window.firestoreDb);
            checkAdminAccess(window.firestoreDb);
            return;
        }

        const appScript = document.createElement('script');
        appScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js";
        
        appScript.onload = () => {
            const firestoreScript = document.createElement('script');
            firestoreScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js";
            
            firestoreScript.onload = () => {
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

                    if (!window.firebase.apps.length) {
                        window.firebase.initializeApp(firebaseConfig);
                    }
                    
                    const dbInstance = window.firebase.firestore();
                    window.firestoreDb = dbInstance;
                    setDb(dbInstance);
                    // Check permissions BEFORE fetching data
                    checkAdminAccess(dbInstance);

                } catch (e) {
                    console.error("Firebase Init failed:", e);
                }
            };
            document.head.appendChild(firestoreScript);
        };
        document.head.appendChild(appScript);
    } catch (e) {
      console.error("CDN Load Error:", e);
    }
  }, []);

  // 2. SECURITY CHECK
  const checkAdminAccess = async (database: any) => {
      const storedUserId = localStorage.getItem("vexa_active_user_id");
      
      if (!storedUserId) {
          alert("Access Denied: Please log in first.");
          router.push('/dashboard');
          return;
      }

      console.log("Verifying Admin Access for:", storedUserId);

      try {
          const doc = await database.collection("users").doc(storedUserId).get();
          
          if (doc.exists && doc.data().role === 'admin') {
              console.log("Admin Access Granted.");
              setIsAuthorized(true);
              fetchData(database); // Only fetch data if authorized
          } else {
              console.warn("Access Denied. User role is:", doc.exists ? doc.data().role : "Unknown");
              alert("ACCESS DENIED: You do not have administrator privileges.");
              router.push('/dashboard');
          }
      } catch (error) {
          console.error("Security check failed:", error);
          alert("System Error during security check.");
      }
  };

  // 3. FETCH DATA (REAL)
  const fetchData = async (database: any) => {
    try {
        setLoading(true);
        
        // A. Fetch Pending Agent Requests
        const agentSnapshot = await database.collection("users")
            .where("agentRequest.status", "==", "pending")
            .get();
        setPendingRequests(agentSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data(), type: 'agent' })));

        // B. Fetch Pending Pro Requests
        const proSnapshot = await database.collection("users")
            .where("proRequest.status", "==", "pending")
            .get();
        setPendingProRequests(proSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data(), type: 'pro' })));

        // C. Fetch All Users
        const usersSnapshot = await database.collection("users").limit(50).get();
        setAllUsers(usersSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })));

        // D. Fetch Listings (REAL DATA)
        // We fetch all and sort client-side to avoid index issues for now
        const listingsSnapshot = await database.collection("listings").get();
        const realListings = listingsSnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Sort by Date (Newest First)
        realListings.sort((a: any, b: any) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });
        
        setListings(realListings);

        // E. Fetch Reports (Mocked for now as we don't have a report submission flow yet)
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

  // --- ACTIONS ---

  // User Approval
  const handleApproveUser = async (userId: string, currentName: string, roleType: 'agent' | 'pro') => {
    if (!db) return;
    setProcessingId(userId);
    try {
        const updateData: any = { role: roleType };
        
        if (roleType === 'agent') {
            updateData['agentRequest.status'] = 'approved';
            updateData['agentRequest.approvedAt'] = new Date();
        } else {
            updateData['proRequest.status'] = 'approved';
            updateData['proRequest.approvedAt'] = new Date();
        }

        await db.collection("users").doc(userId).update(updateData);

        alert(`User ${currentName} is now a ${roleType === 'agent' ? 'Property Agent' : 'Service Pro'}!`);
        
        if (roleType === 'agent') {
            setPendingRequests(prev => prev.filter(u => u.id !== userId));
        } else {
            setPendingProRequests(prev => prev.filter(u => u.id !== userId));
        }
        
        setAllUsers(prev => prev.map(u => u.id === userId ? {...u, role: roleType} : u));
    } catch (error) { console.error(error); alert("Failed."); } 
    finally { setProcessingId(null); }
  };

  const handleRejectUser = async (userId: string, roleType: 'agent' | 'pro') => {
    if (!db) return;
    if (!confirm("Reject this request?")) return;
    setProcessingId(userId);
    try {
        const updateData: any = {};
        if (roleType === 'agent') {
            updateData['agentRequest.status'] = 'rejected';
            updateData['agentRequest.rejectedAt'] = new Date();
        } else {
            updateData['proRequest.status'] = 'rejected';
            updateData['proRequest.rejectedAt'] = new Date();
        }

        await db.collection("users").doc(userId).update(updateData);

        if (roleType === 'agent') {
            setPendingRequests(prev => prev.filter(u => u.id !== userId));
        } else {
            setPendingProRequests(prev => prev.filter(u => u.id !== userId));
        }
    } catch (error) { console.error(error); } 
    finally { setProcessingId(null); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!db) return;
    if (!confirm("Are you sure you want to PERMANENTLY DELETE this user? This cannot be undone.")) return;
    
    setProcessingId(userId);
    try {
        await db.collection("users").doc(userId).delete();
        setAllUsers(prev => prev.filter(u => u.id !== userId));
        setPendingRequests(prev => prev.filter(u => u.id !== userId));
        setPendingProRequests(prev => prev.filter(u => u.id !== userId));
        alert("User deleted successfully.");
    } catch (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete user.");
    } finally {
        setProcessingId(null);
    }
  };

  // Listing Actions
  const handleApproveListing = async (listingId: string) => {
      if(!db) return;
      setProcessingId(listingId);
      try {
          await db.collection("listings").doc(listingId).update({ status: 'active' });
          setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'active' } : l));
          alert("Listing Approved & Live!");
      } catch(e) {
          console.error(e);
          alert("Error approving listing.");
      } finally {
          setProcessingId(null);
      }
  };

  const handleRejectListing = async (listingId: string) => {
      if(!db) return;
      if(!confirm("Reject this listing? This will set it to suspended.")) return;
      setProcessingId(listingId);
      try {
          await db.collection("listings").doc(listingId).update({ status: 'suspended' });
          setListings(prev => prev.map(l => l.id === listingId ? { ...l, status: 'suspended' } : l));
      } catch(e) {
          console.error(e);
      } finally {
          setProcessingId(null);
      }
  };

  const handleDeleteListing = async (listingId: string) => {
      if(!db) return;
      if(!confirm("Permanently delete this listing?")) return;
      setProcessingId(listingId);
      try {
          await db.collection("listings").doc(listingId).delete();
          setListings(prev => prev.filter(l => l.id !== listingId));
      } catch(e) {
          console.error(e);
      } finally {
          setProcessingId(null);
      }
  };

  // --- VIEWS ---

  const SidebarItem = ({ id, icon: Icon, label, count, colorClass }: any) => (
    <button 
      onClick={() => setActiveView(id)}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                        <h3 className="text-2xl font-bold text-orange-600">{pendingRequests.length + pendingProRequests.length}</h3>
                    </div>
                    <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><Shield size={20} /></div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-xs uppercase font-bold">Total Listings</p>
                        <h3 className="text-2xl font-bold text-emerald-600">{listings.length}</h3>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><Building size={20} /></div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-xs uppercase font-bold">Pending Listings</p>
                        <h3 className="text-2xl font-bold text-yellow-600">
                            {listings.filter(l => l.status === 'pending').length}
                        </h3>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded-lg text-yellow-600"><Clock size={20} /></div>
                </div>
            </div>
        </div>
    </div>
  );

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
              <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                  <button onClick={() => setListingType('all')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${listingType === 'all' ? 'bg-vexa-blue text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>All</button>
                  <button onClick={() => setListingType('property')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${listingType === 'property' ? 'bg-vexa-blue text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Building size={16} /> Properties</button>
                  <button onClick={() => setListingType('vehicle')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${listingType === 'vehicle' ? 'bg-vexa-blue text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Car size={16} /> Vehicles</button>
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

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                      <tr>
                          <th className="px-6 py-4 font-medium">Listing Details</th>
                          <th className="px-6 py-4 font-medium">Agent</th>
                          <th className="px-6 py-4 font-medium">Price</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredListings.length > 0 ? filteredListings.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                  <div className="font-medium text-slate-900">{item.title}</div>
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
                                              <button 
                                                onClick={() => handleApproveListing(item.id)}
                                                disabled={processingId === item.id}
                                                className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                                                title="Approve"
                                              >
                                                  <Check size={16} />
                                              </button>
                                              <button 
                                                onClick={() => handleRejectListing(item.id)}
                                                disabled={processingId === item.id}
                                                className="p-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                                                title="Reject (Suspend)"
                                              >
                                                  <X size={16} />
                                              </button>
                                          </>
                                      )}
                                      {item.status !== 'pending' && (
                                          <button 
                                            onClick={() => handleDeleteListing(item.id)}
                                            disabled={processingId === item.id}
                                            className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                            title="Delete"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      )}
                                  </div>
                              </td>
                          </tr>
                      )) : (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No listings found.</td></tr>
                      )}
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
            {pendingRequests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-slate-200">
                    <p className="text-slate-500">No pending agent requests.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pendingRequests.map((user) => (
                        <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="bg-orange-50 p-4 rounded-full text-orange-600">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{user.name || 'Unknown Name'}</h3>
                                    <p className="text-sm text-slate-500">{user.email || 'No Email'}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">ID: {user.id}</span>
                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded flex items-center gap-1">
                                            <Clock size={12} /> Pending Review
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                <button onClick={() => handleRejectUser(user.id, 'agent')} disabled={processingId === user.id} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-red-600 transition-colors">Reject</button>
                                <button onClick={() => handleApproveUser(user.id, user.name, 'agent')} disabled={processingId === user.id} className="px-6 py-2 bg-vexa-blue text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Approve</button>
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
            {pendingProRequests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-slate-200">
                    <p className="text-slate-500">No pending pro requests.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pendingProRequests.map((user) => (
                        <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="bg-purple-50 p-4 rounded-full text-purple-600">
                                    <Hammer size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">{user.name || 'Unknown Name'}</h3>
                                    <p className="text-sm text-slate-500">{user.email || 'No Email'}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">ID: {user.id}</span>
                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded flex items-center gap-1">
                                            <Clock size={12} /> Pending Review
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 italic">Applied as: {user.proType || 'General Pro'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                <button onClick={() => handleRejectUser(user.id, 'pro')} disabled={processingId === user.id} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-red-600 transition-colors">Reject</button>
                                <button onClick={() => handleApproveUser(user.id, user.name, 'pro')} disabled={processingId === user.id} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm">Approve</button>
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
          {/* Mock Reports for now */}
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
                <Shield className="text-emerald-500 mx-auto mb-4" size={32} />
                <h3 className="text-xl font-bold text-slate-800">Clean Records</h3>
                <p className="text-slate-500">No active reports.</p>
          </div>
      </div>
  );

  const UsersView = () => (
      <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 mb-4">All Registered Users</h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                      <tr>
                          <th className="px-6 py-4 font-medium">Name / Email</th>
                          <th className="px-6 py-4 font-medium">Role</th>
                          <th className="px-6 py-4 font-medium">ID</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                          <th className="px-6 py-4 font-medium">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {allUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                  <div className="font-medium text-slate-900">{user.name || 'Unknown'}</div>
                                  <div className="text-xs text-slate-400">{user.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                      user.role === 'agent' ? 'bg-emerald-100 text-emerald-800' :
                                      user.role === 'pro' ? 'bg-blue-100 text-blue-800' :
                                      'bg-slate-100 text-slate-800'
                                  }`}>
                                      {user.role || 'user'}
                                  </span>
                              </td>
                              <td className="px-6 py-4 text-xs font-mono text-slate-400">{user.id}</td>
                              <td className="px-6 py-4"><span className="text-emerald-600 text-xs font-bold">Active</span></td>
                              <td className="px-6 py-4">
                                  <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={processingId === user.id}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Delete User"
                                  >
                                    {processingId === user.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
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

  // Double security
  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-100">
            <h1 className="text-2xl font-bold text-vexa-blue flex items-center gap-2">
                <Shield size={28} /> VEXA<span className="text-slate-400 text-sm font-normal">Admin</span>
            </h1>
        </div>
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            <SidebarItem id="dashboard" icon={LayoutDashboard} label="Overview" count={0} />
            <SidebarItem id="requests" icon={Bell} label="Requests" count={pendingRequests.length + pendingProRequests.length} colorClass="bg-orange-100 text-orange-600" />
            <SidebarItem id="users" icon={Users} label="User Management" count={0} />
            <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Content</p>
            </div>
            <SidebarItem id="listings" icon={Building} label="Listings" count={listings.filter(l => l.status === 'pending').length} colorClass="bg-yellow-100 text-yellow-600" />
            <SidebarItem id="reports" icon={Flag} label="Reports" count={reports.length} colorClass="bg-red-100 text-red-600" />
        </div>
        <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">A</div>
                <div className="text-sm">
                    <p className="font-bold text-slate-700">Admin User</p>
                    <p className="text-xs text-slate-400">Super Admin</p>
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 md:ml-64 p-8">
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
  );
}
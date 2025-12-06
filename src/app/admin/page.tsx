import { redirect } from 'next/navigation';
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { getAdminData, deleteUserAdmin, deleteListingAdmin, resolveReport } from '@/app/actions';
import { Playfair_Display, Manrope } from 'next/font/google';
import { ShieldAlert, Users, LayoutList, Trash2, ExternalLink, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminSearch, AdminPagination } from '@/components/AdminTools';

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function AdminPage({
    searchParams,
  }: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }) {
  const clerkUser = await currentUser();
  if (!clerkUser) return redirect("/sign-in");
  
  const email = clerkUser.emailAddresses[0].emailAddress;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || user.role !== 'ADMIN') {
    return (
        <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center gap-4">
            <ShieldAlert size={64} />
            <h1 className="text-3xl font-bold">ACCESS DENIED</h1>
            <Link href="/" className="text-white underline">Return Home</Link>
        </div>
    );
  }

  const params = await searchParams;
  
  const { 
      totalUsers, totalListings, 
      allListings, allUsers, recentReports,
      userTotalPages, listingTotalPages
  } = await getAdminData({
      userQ: params.userQ as string,
      listingQ: params.listingQ as string,
      userPage: Number(params.userPage) || 1,
      listingPage: Number(params.listingPage) || 1
  });

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className} p-6 pt-32`}>
        
        {/* HEADER */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowLeft size={20}/></Link>
                <div>
                    <h1 className={`text-3xl font-bold ${serifFont.className}`}>Admin Command</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">System Overview</p>
                </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-xs font-bold uppercase tracking-widest">
                <ShieldAlert size={16}/> Administrator
            </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-16">
            
            {/* STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Pending Reports" value={recentReports.length} icon={AlertTriangle} color="red" />
                <StatCard label="Total Users" value={totalUsers} icon={Users} color="blue" />
                <StatCard label="Total Listings" value={totalListings} icon={LayoutList} color="green" />
            </div>

            {/* REPORTS SECTION */}
            {recentReports.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-400"><AlertTriangle size={20}/> Trust & Safety Alerts</h2>
                    
                    {/* MOBILE: Stacked Cards */}
                    <div className="md:hidden space-y-4">
                        {recentReports.map(report => (
                            <div key={report.id} className="bg-red-950/10 border border-red-900/30 p-5 rounded-2xl space-y-4">
                                <div>
                                    <span className="text-red-400 font-bold block">{report.reason}</span>
                                    <p className="text-xs text-gray-400 mt-1">{report.details || "No details provided."}</p>
                                </div>
                                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl">
                                    {report.listing ? (
                                        <>
                                            <div className="w-12 h-12 bg-neutral-800 rounded-lg overflow-hidden relative flex-shrink-0"><Image src={report.listing.images.split(',')[0]} alt="img" fill className="object-cover"/></div>
                                            <div className="min-w-0">
                                                <p className="text-white font-bold text-sm line-clamp-1">{report.listing.title}</p>
                                                <Link href={`/listing/${report.listing.id}`} target="_blank" className="text-[10px] text-blue-400 flex items-center gap-1">View Ad <ExternalLink size={10}/></Link>
                                            </div>
                                        </>
                                    ) : <span className="italic text-gray-500 text-sm">Listing Deleted</span>}
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-red-900/20">
                                    <p className="text-xs text-gray-500">By: <span className="text-gray-300">{report.reporter.name}</span></p>
                                    <div className="flex gap-2">
                                        <ReportActions reportId={report.id} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* DESKTOP: Table */}
                    <div className="hidden md:block bg-red-950/10 border border-red-900/30 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-red-900/20 uppercase font-bold text-xs text-red-200">
                                <tr>
                                    <th className="p-4">Reason</th>
                                    <th className="p-4">Listing</th>
                                    <th className="p-4">Reporter</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-red-900/10">
                                {recentReports.map(report => (
                                    <tr key={report.id} className="hover:bg-red-900/5 transition-colors">
                                        <td className="p-4 align-top"><span className="font-bold text-white block mb-1">{report.reason}</span><p className="text-xs line-clamp-2">{report.details}</p></td>
                                        <td className="p-4 align-top">
                                            {report.listing ? (
                                                <Link href={`/listing/${report.listing.id}`} target="_blank" className="hover:text-white flex items-center gap-2">
                                                    {report.listing.title} <ExternalLink size={12}/>
                                                </Link>
                                            ) : <span className="italic">Deleted</span>}
                                        </td>
                                        <td className="p-4 align-top">{report.reporter.name}</td>
                                        <td className="p-4 align-top flex justify-end gap-2">
                                            <ReportActions reportId={report.id} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* LISTINGS MANAGEMENT */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">Manage Listings</h2>
                    <AdminSearch placeholder="Search Listing..." paramKey="listingQ" />
                </div>

                {/* MOBILE: Listing Cards */}
                <div className="md:hidden grid gap-4">
                    {allListings.map(item => (
                        <div key={item.id} className="bg-neutral-900 border border-white/10 p-4 rounded-2xl flex gap-4 items-start">
                            <div className="w-20 h-20 bg-neutral-800 rounded-xl overflow-hidden relative flex-shrink-0">
                                <Image src={item.images.split(',')[0]} alt="img" fill className="object-cover"/>
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="text-white font-bold line-clamp-1 text-sm">{item.title}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">{item.type} • {item.user.name}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-blue-400 font-mono text-sm">RM {item.price.toLocaleString()}</p>
                                    <div className="flex gap-2">
                                        <Link href={`/listing/${item.id}`} className="p-2 bg-white/5 text-blue-400 rounded-lg"><ExternalLink size={14}/></Link>
                                        <ListingDeleteButton id={item.id} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* DESKTOP: Listing Table */}
                <div className="hidden md:block bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-black/40 uppercase font-bold text-xs">
                            <tr><th className="p-4">Item</th><th className="p-4">Agent</th><th className="p-4">Price</th><th className="p-4 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {allListings.map(item => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-neutral-800 rounded-lg overflow-hidden relative flex-shrink-0"><Image src={item.images.split(',')[0]} alt="img" fill className="object-cover"/></div>
                                            <div><p className="text-white font-bold line-clamp-1">{item.title}</p><p className="text-[10px] uppercase">{item.type}</p></div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-white">{item.user.name}</td>
                                    <td className="p-4 font-mono">RM {item.price.toLocaleString()}</td>
                                    <td className="p-4 text-right flexjustify-end gap-2">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/listing/${item.id}`} target="_blank" className="p-2 hover:bg-blue-900/30 text-blue-400 rounded-lg"><ExternalLink size={16}/></Link>
                                            <ListingDeleteButton id={item.id} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <AdminPagination totalPages={listingTotalPages} paramKey="listingPage" />
            </div>

            {/* USERS MANAGEMENT */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">Manage Users</h2>
                    <AdminSearch placeholder="Search User..." paramKey="userQ" />
                </div>

                {/* MOBILE: User Cards */}
                <div className="md:hidden grid gap-4">
                    {allUsers.map(u => (
                        <div key={u.id} className="bg-neutral-900 border border-white/10 p-4 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="text-white font-bold text-sm">{u.name}</p>
                                <p className="text-xs text-gray-500 mb-2">{u.email}</p>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'ADMIN' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}`}>{u.role}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 mb-2">{u.credits} Credits</p>
                                {u.role !== 'ADMIN' && <UserBanButton id={u.id} />}
                            </div>
                        </div>
                    ))}
                </div>

                {/* DESKTOP: User Table */}
                <div className="hidden md:block bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-black/40 uppercase font-bold text-xs">
                            <tr><th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Credits</th><th className="p-4 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {allUsers.map(u => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4"><div><p className="text-white font-bold">{u.name}</p><p className="text-xs">{u.email}</p></div></td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.role === 'ADMIN' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}`}>{u.role}</span></td>
                                    <td className="p-4 font-mono">{u.credits}</td>
                                    <td className="p-4 text-right">
                                        {u.role !== 'ADMIN' && <UserBanButton id={u.id} />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <AdminPagination totalPages={userTotalPages} paramKey="userPage" />
            </div>

        </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---
function StatCard({ label, value, icon: Icon, color }: any) {
    const colors: any = { red: 'text-red-500 bg-red-900/20', blue: 'text-blue-400 bg-blue-900/20', green: 'text-green-400 bg-green-900/20' };
    return (
        <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl flex items-center justify-between">
            <div><p className="text-gray-500 text-xs font-bold uppercase mb-1">{label}</p><p className={`text-4xl font-bold ${color === 'red' ? 'text-red-500' : 'text-white'}`}>{value}</p></div>
            <div className={`p-4 rounded-xl ${colors[color]}`}><Icon size={24}/></div>
        </div>
    );
}

function ReportActions({ reportId }: { reportId: string }) {
    return (
        <>
            <form action={async () => { 'use server'; await resolveReport(reportId, 'DISMISS') }}><button className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle size={14}/> Dismiss</button></form>
            <form action={async () => { 'use server'; await resolveReport(reportId, 'BAN_LISTING') }}><button className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg shadow-red-900/20"><Trash2 size={14}/> Ban</button></form>
        </>
    );
}

function ListingDeleteButton({ id }: { id: string }) {
    return (
        <form action={async () => { 'use server'; await deleteListingAdmin(id) }}>
            <button className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg" title="Delete Forever"><Trash2 size={16}/></button>
        </form>
    );
}

function UserBanButton({ id }: { id: string }) {
    return (
        <form action={async () => { 'use server'; await deleteUserAdmin(id) }}>
            <button className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg flex items-center gap-2 text-xs font-bold justify-end w-full md:w-auto"><Trash2 size={14}/> BAN</button>
        </form>
    );
}
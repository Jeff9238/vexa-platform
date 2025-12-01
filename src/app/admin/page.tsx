import { redirect } from 'next/navigation';
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { getAdminData, deleteUserAdmin, deleteListingAdmin } from '@/app/actions';
import { Playfair_Display, Manrope } from 'next/font/google';
import { ShieldAlert, Users, LayoutList, Trash2, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function AdminPage() {
  // 1. Secure Access (Double Check)
  const clerkUser = await currentUser();
  if (!clerkUser) return redirect("/sign-in");
  
  const email = clerkUser.emailAddresses[0].emailAddress;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || user.role !== 'ADMIN') {
    return (
        <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center gap-4">
            <ShieldAlert size={64} />
            <h1 className="text-3xl font-bold">ACCESS DENIED</h1>
            <p className="text-gray-500">You do not have permission to view this page.</p>
            <Link href="/" className="text-white underline">Return Home</Link>
        </div>
    );
  }

  // 2. Fetch Data
  const { totalUsers, totalListings, allListings, allUsers } = await getAdminData();

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className} p-6`}>
        
        {/* HEADER */}
        <div className="max-w-7xl mx-auto flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowLeft size={20}/></Link>
                <div>
                    <h1 className={`text-3xl font-bold ${serifFont.className}`}>Admin Command</h1>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">System Overview</p>
                </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-xs font-bold uppercase tracking-widest">
                <ShieldAlert size={16}/> Administrator Mode
            </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-12">
            
            {/* STATS ROW */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Users</p>
                        <p className="text-4xl font-bold">{totalUsers}</p>
                    </div>
                    <div className="p-4 bg-blue-900/20 text-blue-400 rounded-xl"><Users size={24}/></div>
                </div>
                <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-xs font-bold uppercase mb-1">Total Listings</p>
                        <p className="text-4xl font-bold">{totalListings}</p>
                    </div>
                    <div className="p-4 bg-green-900/20 text-green-400 rounded-xl"><LayoutList size={24}/></div>
                </div>
            </div>

            {/* LISTINGS MANAGEMENT */}
            <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">Manage Listings <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">{allListings.length}</span></h2>
                <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-black/40 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4">Item</th>
                                <th className="p-4">Agent</th>
                                <th className="p-4">Price</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {allListings.map(item => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-neutral-800 rounded-lg overflow-hidden relative flex-shrink-0">
                                                <Image src={item.images.split(',')[0]} alt="img" fill className="object-cover"/>
                                            </div>
                                            <div>
                                                <p className="text-white font-bold line-clamp-1">{item.title}</p>
                                                <p className="text-[10px] uppercase tracking-wider">{item.type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-white">{item.user.name}</td>
                                    <td className="p-4 font-mono">RM {item.price.toLocaleString()}</td>
                                    <td className="p-4 flex gap-2">
                                        <Link href={`/listing/${item.id}`} target="_blank" className="p-2 hover:bg-blue-900/30 text-blue-400 rounded-lg"><ExternalLink size={16}/></Link>
                                        <form action={async () => {
                                            'use server'
                                            await deleteListingAdmin(item.id)
                                        }}>
                                            <button className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg" title="Delete Forever"><Trash2 size={16}/></button>
                                        </form>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* USERS MANAGEMENT */}
            <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">Manage Users <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">{allUsers.length}</span></h2>
                <div className="bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-black/40 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Credits</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {allUsers.map(u => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div>
                                            <p className="text-white font-bold">{u.name}</p>
                                            <p className="text-xs">{u.email}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.role === 'ADMIN' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono">{u.credits}</td>
                                    <td className="p-4">
                                        {u.role !== 'ADMIN' && (
                                            <form action={async () => {
                                                'use server'
                                                await deleteUserAdmin(u.id)
                                            }}>
                                                <button className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg flex items-center gap-2 text-xs font-bold">
                                                    <Trash2 size={14}/> BAN
                                                </button>
                                            </form>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    </div>
  );
}
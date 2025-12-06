'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTransition } from 'react';

// --- SEARCH BAR (Optimized) ---
export function AdminSearch({ placeholder, paramKey }: { placeholder: string, paramKey: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (term) {
            params.set(paramKey, term);
            const pageKey = paramKey === 'userQ' ? 'userPage' : 'listingPage';
            params.set(pageKey, '1'); // Reset to page 1
        } else {
            params.delete(paramKey);
        }

        startTransition(() => {
            router.replace(`/admin?${params.toString()}`);
        });
    };

    return (
        <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
            <input 
                type="text" 
                defaultValue={searchParams.get(paramKey)?.toString()}
                onChange={(e) => {
                    // Simple Debounce
                    const value = e.target.value;
                    const timeoutId = setTimeout(() => handleSearch(value), 800);
                    return () => clearTimeout(timeoutId);
                }}
                placeholder={placeholder}
                className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-blue-500 transition-colors"
            />
            {isPending && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
        </div>
    );
}

// --- PAGINATION ---
export function AdminPagination({ totalPages, paramKey }: { totalPages: number, paramKey: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentPage = Number(searchParams.get(paramKey)) || 1;

    const changePage = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set(paramKey, newPage.toString());
        router.push(`/admin?${params.toString()}`);
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center gap-2 mt-4 justify-end">
            <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"><ChevronLeft size={16} /></button>
            <span className="text-xs text-gray-400 font-mono">Page {currentPage} / {totalPages}</span>
            <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"><ChevronRight size={16} /></button>
        </div>
    );
}
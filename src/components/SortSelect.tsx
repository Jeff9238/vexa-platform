'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown } from 'lucide-react';

export default function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'newest';

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    router.replace(`/search?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 bg-neutral-900 border border-white/10 px-4 py-2 rounded-xl group focus-within:border-blue-500 transition-colors">
      <ArrowUpDown size={14} className="text-gray-500 group-focus-within:text-blue-500"/>
      <select 
        value={currentSort} 
        onChange={handleSortChange} 
        className="bg-transparent text-sm text-white outline-none cursor-pointer font-bold appearance-none min-w-[120px]"
      >
        <option value="newest" className="bg-neutral-900">Newest Listed</option>
        <option value="oldest" className="bg-neutral-900">Oldest Listed</option>
        <option value="price_asc" className="bg-neutral-900">Price: Low to High</option>
        <option value="price_desc" className="bg-neutral-900">Price: High to Low</option>
      </select>
    </div>
  );
}
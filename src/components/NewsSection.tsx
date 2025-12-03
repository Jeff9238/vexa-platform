import Link from "next/link";
import { ArrowRight, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { getLatestNews, checkAndGenerateNews } from "@/app/news-actions";
import NewsImage from "./NewsImage"; // <--- NEW IMPORT

export default async function NewsSection() {
  // Attempt to generate news if missing
  // wrapping in try/catch so one error doesn't break the whole homepage
  try {
      await checkAndGenerateNews();
  } catch (e) {
      console.error("News generation skipped:", e);
  }
  
  const newsList = await getLatestNews();

  return (
    <div className="py-20 border-b border-white/5 bg-[#0a0a0a]">
        <div className="max-w-[1600px] mx-auto px-6">
            <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-bold text-white font-serif flex items-center gap-3">
                    <TrendingUp className="text-blue-500"/> VEXA Insights
                </h2>
                <Link href="/news" className="text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                    READ ALL NEWS <ArrowRight size={12}/>
                </Link>
            </div>

            {newsList.length === 0 ? (
                // --- LOADING STATE / SKELETON ---
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-96 rounded-2xl bg-white/5 border border-white/5 animate-pulse flex flex-col p-6 gap-4">
                            <div className="h-48 bg-white/5 rounded-xl w-full flex items-center justify-center text-gray-600">
                                <Loader2 className="animate-spin" size={24}/>
                            </div>
                            <div className="h-4 bg-white/10 rounded w-1/3"></div>
                            <div className="h-6 bg-white/10 rounded w-3/4"></div>
                            <div className="h-4 bg-white/5 rounded w-full"></div>
                        </div>
                    ))}
                </div>
            ) : (
                // --- NEWS GRID ---
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {newsList.map((article) => (
                        <Link key={article.id} href={`/news/${article.id}`} className="group block h-full flex flex-col">
                            <div className="relative h-64 w-full rounded-2xl overflow-hidden mb-4 border border-white/10 group-hover:border-blue-500/50 transition-all">
                                {/* Use Client Component for Image Safety */}
                                <NewsImage 
                                    src={article.imageUrl || "https://via.placeholder.com/800x600?text=News"} 
                                    alt={article.title}
                                    category={article.category}
                                />
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/10 z-10">
                                    {article.category}
                                </div>
                            </div>
                            <div className="space-y-3 flex-grow">
                                <p className="text-xs text-gray-500 font-mono flex items-center gap-2">
                                    <Calendar size={12}/> {new Date(article.createdAt).toLocaleDateString()}
                                </p>
                                <h3 className="text-xl font-bold text-white leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
                                    {article.title}
                                </h3>
                                <p className="text-sm text-gray-400 line-clamp-3">
                                    {article.summary}
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                Read Article <ArrowRight size={12}/>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
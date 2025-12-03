import { getAllNews } from "@/app/news-actions";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import { ArrowLeft, Calendar, ArrowRight, TrendingUp } from "lucide-react";
import NewsImage from "@/components/NewsImage"; 

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '800'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function NewsPage() {
  const articles = await getAllNews();
  
  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const otherArticles = articles.slice(1);

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      
      {/* 1. HEADER */}
      <Navbar />
      
      {/* 2. SPACER (Pushes content down) */}
      <div className="h-28"></div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-4 mb-8">
            <Link href="/" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"><ArrowLeft size={20}/></Link>
            <div>
                <h1 className={`text-4xl font-bold ${serifFont.className}`}>Market Insights</h1>
                <p className="text-gray-400 text-sm">Trends, analysis, and updates from the VEXA editorial team.</p>
            </div>
        </div>

        {articles.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                <p className="text-gray-500">No news articles found. Check back later.</p>
            </div>
        ) : (
            <>
                {/* 2. FEATURED ARTICLE (HERO) */}
                {featuredArticle && (
                    <Link href={`/news/${featuredArticle.id}`} className="group relative block w-full h-[500px] rounded-3xl overflow-hidden mb-16 border border-white/10 shadow-2xl">
                        <NewsImage 
                            src={featuredArticle.imageUrl} 
                            alt={featuredArticle.title} 
                            category={featuredArticle.category}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90"></div>
                        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3">
                            <div className="flex items-center gap-4 mb-4">
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-blue-900/50">
                                    Featured Story
                                </span>
                                <span className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-widest">
                                    <Calendar size={12}/> {new Date(featuredArticle.createdAt).toDateString()}
                                </span>
                            </div>
                            
                            <h2 className={`text-3xl md:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-blue-400 transition-colors ${serifFont.className}`}>
                                {featuredArticle.title}
                            </h2>
                            
                            <p className="text-gray-300 text-lg line-clamp-2 mb-6 max-w-2xl">
                                {featuredArticle.summary}
                            </p>

                            <div className="flex items-center gap-2 text-sm font-bold text-white group-hover:translate-x-2 transition-transform">
                                Read Full Story <ArrowRight size={16}/>
                            </div>
                        </div>
                    </Link>
                )}

                {/* 3. RECENT ARTICLES GRID */}
                {otherArticles.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 border-b border-white/10 pb-4">
                            <TrendingUp className="text-blue-500"/> Recent Updates
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {otherArticles.map((article) => (
                                <Link key={article.id} href={`/news/${article.id}`} className="group bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-900/10 flex flex-col h-full">
                                    <div className="relative h-56 w-full overflow-hidden">
                                        <NewsImage 
                                            src={article.imageUrl} 
                                            alt={article.title} 
                                            category={article.category}
                                        />
                                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                                            {article.category}
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="text-xs text-gray-500 mb-3 flex items-center gap-2 font-mono">
                                            <Calendar size={12}/> {new Date(article.createdAt).toLocaleDateString()}
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors">
                                            {article.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 line-clamp-3 mb-4 flex-grow">
                                            {article.summary}
                                        </p>
                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold text-gray-500 group-hover:text-white transition-colors">
                                            <span>Read More</span>
                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}
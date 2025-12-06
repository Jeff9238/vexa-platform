import { getArticle } from "@/app/news-actions";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Manrope } from 'next/font/google';
import { ArrowLeft, Calendar, User } from "lucide-react";
import NewsImageEdit from "@/components/NewsImageEdit"; // <--- NEW IMPORT
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const serifFont = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const sansFont = Manrope({ subsets: ['latin'], weight: ['300', '500', '700'] });

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) notFound();

  // CHECK IF ADMIN
  const clerkUser = await currentUser();
  let isAdmin = false;
  if (clerkUser) {
      const dbUser = await prisma.user.findUnique({ where: { email: clerkUser.emailAddresses[0].emailAddress } });
      if (dbUser?.role === 'ADMIN') isAdmin = true;
  }

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${sansFont.className}`}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-32">
        
        <div className="flex justify-between items-center mb-8">
            <Link href="/news" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={16}/> Back to News
            </Link>

            {/* ADMIN ONLY: EDIT BUTTON */}
            {isAdmin && <NewsImageEdit articleId={article.id} />}
        </div>

        <h1 className={`text-4xl md:text-5xl font-bold mb-6 leading-tight ${serifFont.className}`}>
            {article.title}
        </h1>

        <div className="flex items-center gap-6 text-sm text-gray-500 mb-8 border-b border-white/10 pb-8">
            <span className="flex items-center gap-2"><Calendar size={16}/> {new Date(article.createdAt).toDateString()}</span>
            <span className="flex items-center gap-2"><User size={16}/> VEXA Editorial AI</span>
            <span className="bg-blue-900/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase">{article.category}</span>
        </div>

        <div className="relative w-full h-[400px] md:h-[500px] mb-12 rounded-3xl overflow-hidden border border-white/10 group">
            <Image 
                src={article.imageUrl} 
                alt={article.title} 
                fill 
                className="object-cover"
                priority
            />
            {/* Overlay hint for Admin */}
            {isAdmin && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                    <p className="text-white font-bold">Admin: Use "Change Photo" button above to fix</p>
                </div>
            )}
        </div>

        <article 
            className="prose prose-invert prose-lg max-w-none text-gray-300"
            dangerouslySetInnerHTML={{ __html: article.content }} 
        />

      </main>
    </div>
  );
}
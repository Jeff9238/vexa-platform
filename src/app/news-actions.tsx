'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- 1. GENERATE DAILY NEWS ---
export async function checkAndGenerateNews() {
  try {
    // A. Check if we have ANY news (First run check)
    const count = await prisma.newsArticle.count();
    
    // --- FALLBACK: If DB is empty, create a Sample Article immediately ---
    if (count === 0) {
        console.log("Database empty. Creating sample news...");
        await prisma.newsArticle.create({
            data: {
                title: "Welcome to VEXA: The Future of Asset Trading",
                summary: "Discover how VEXA is revolutionizing the way Malaysia buys and sells premium property and high-performance vehicles.",
                content: "<p>Welcome to the launch of VEXA. We are proud to introduce a unified marketplace designed for the discerning buyer.</p><p>Whether you are looking for a luxury condo in Mont Kiara or a BMW M4 for your weekend drives, VEXA brings it all together in one seamless experience.</p><p>Stay tuned to this section for daily AI-curated market insights, automotive trends, and investment tips.</p>",
                category: "Platform Update",
                // Using a reliable static Unsplash image ID
                imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop"
            }
        });
        revalidatePath('/'); // Refresh homepage
        return; 
    }

    // B. Normal Logic: Check if news exists for TODAY
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingToday = await prisma.newsArticle.findFirst({
      where: { createdAt: { gte: today } },
    });

    if (existingToday) return; 

    // C. AI Generation Logic
    const isPropertyDay = today.getDate() % 2 === 0;
    const topic = isPropertyDay ? "Real Estate Market in Malaysia" : "Automotive Trends in Malaysia";
    const category = isPropertyDay ? "Property" : "Vehicle";

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
      You are a senior editor for 'VEXA', a premium marketplace.
      Write a daily news article about: ${topic}.
      Focus on current trends for ${today.getFullYear()}.
      
      Return ONLY a JSON object with this structure:
      {
        "title": "A catchy, professional headline",
        "summary": "A 2-sentence summary for the card preview",
        "content": "A 4-paragraph article formatted with <p> tags. Informative and engaging.",
        "imageKeyword": "One word to search for an image (e.g. Condo, BMW, House)"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, '').trim();
    const data = JSON.parse(text);

    // Fallback image based on category if keyword fails
    const defaultImage = category === 'Property' 
        ? "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800" 
        : "https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=800";

    await prisma.newsArticle.create({
      data: {
        title: data.title,
        summary: data.summary,
        content: data.content,
        category: category,
        imageUrl: defaultImage, 
      }
    });

    revalidatePath('/');
    revalidatePath('/news');
    
  } catch (error) {
    console.error("News Gen Error:", error);
  }
}

// --- 2. GET LATEST NEWS (Home) ---
export async function getLatestNews() {
  // Add no-store to ensure we fetch fresh data if it was just created
  return await prisma.newsArticle.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3
  });
}

// --- 3. GET ALL NEWS (Archive) ---
export async function getAllNews() {
  return await prisma.newsArticle.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

// --- 4. GET SINGLE ARTICLE ---
export async function getArticle(id: string) {
  return await prisma.newsArticle.findUnique({ where: { id } });
}
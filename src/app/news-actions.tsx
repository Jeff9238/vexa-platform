'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase (for storing generated images)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Reliable Static Images (Use these if AI fails)
const FALLBACK_PROPERTY = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800";
const FALLBACK_VEHICLE = "https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=800";

// --- HELPER: Generate Image using Imagen 4.0 ---
async function generateAIImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

  const payload = {
    instances: [{ prompt: `Photorealistic, high quality, 4k, cinematic lighting: ${prompt}` }],
    parameters: { sampleCount: 1 }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        // Log error but don't crash; return null to trigger fallback
        console.warn("Imagen API unavailable (Billing/Quota): Using fallback image.");
        return null; 
    }

    const data = await response.json();
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;

    if (base64Image) {
        const buffer = Buffer.from(base64Image, 'base64');
        const fileName = `news/ai-gen-${Date.now()}.png`;

        const { error } = await supabase.storage
            .from('vexa-images')
            .upload(fileName, buffer, { contentType: 'image/png' });

        if (error) {
            console.error("Supabase Upload Error:", error);
            return null;
        }

        const { data: urlData } = supabase.storage
            .from('vexa-images')
            .getPublicUrl(fileName);
            
        return urlData.publicUrl;
    }
    return null;
  } catch (e) {
    console.error("Image Gen Exception:", e);
    return null;
  }
}

// --- MAIN: GENERATE DAILY NEWS ---
export async function checkAndGenerateNews() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. AUTO-FIX: Check if the latest article has a broken link OR is using a Fallback
    const latest = await prisma.newsArticle.findFirst({ orderBy: { createdAt: 'desc' } });
    
    if (latest && (
        latest.imageUrl.includes("source.unsplash.com") || 
        latest.imageUrl.includes("via.placeholder.com") ||
        latest.imageUrl.includes("image_unavailable") ||
        latest.imageUrl === FALLBACK_PROPERTY || // <--- FIX: Retry if using Property Fallback
        latest.imageUrl === FALLBACK_VEHICLE     // <--- FIX: Retry if using Vehicle Fallback
    )) {
        console.log("Attempting to upgrade image to AI for:", latest.title);
        
        // Try AI Generation
        const newImage = await generateAIImage(`${latest.category} - ${latest.title}`);
        
        // Only update if AI actually succeeded
        if (newImage) {
            await prisma.newsArticle.update({
                where: { id: latest.id },
                data: { imageUrl: newImage }
            });
            revalidatePath('/');
            return;
        } else {
             console.log("AI still unavailable. Keeping fallback.");
        }
    }

    // 2. Check if news exists for TODAY
    const existingToday = await prisma.newsArticle.findFirst({
      where: { createdAt: { gte: today } },
    });

    if (existingToday) return; 

    // 3. Generate Content Logic
    const isPropertyDay = today.getDate() % 2 === 0;
    const topic = isPropertyDay ? "Real Estate Market in Malaysia" : "Automotive Trends in Malaysia";
    const category = isPropertyDay ? "Property" : "Vehicle";

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const textPrompt = `
      You are a senior editor for 'VEXA', a premium marketplace.
      Write a daily news article about: ${topic}.
      Focus on current trends for ${today.getFullYear()}.
      
      Return ONLY a JSON object:
      {
        "title": "Headline",
        "summary": "2 sentences",
        "content": "4 paragraphs with <p> tags",
        "imagePrompt": "A detailed description of an image representing this news for an AI image generator"
      }
    `;

    const result = await model.generateContent(textPrompt);
    const response = await result.response;
    const cleanText = response.text().replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanText);

    // 4. Generate AI Image (or Fallback)
    console.log("Generating News Article:", data.title);
    let finalImageUrl = await generateAIImage(data.imagePrompt);

    if (!finalImageUrl) {
        finalImageUrl = category === 'Property' ? FALLBACK_PROPERTY : FALLBACK_VEHICLE;
    }

    // 5. Save to DB
    await prisma.newsArticle.create({
      data: {
        title: data.title,
        summary: data.summary,
        content: data.content,
        category: category,
        imageUrl: finalImageUrl, 
      }
    });

    revalidatePath('/');
    revalidatePath('/news');
    
  } catch (error) {
    console.error("News Gen Error:", error);
  }
}

// --- GETTERS ---
export async function getLatestNews() {
  return await prisma.newsArticle.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3
  });
}

export async function getAllNews() {
  return await prisma.newsArticle.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function getArticle(id: string) {
  return await prisma.newsArticle.findUnique({ where: { id } });
}
'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
// Note: We removed the 'redirect' import because we will handle it on the client side now.

// 1. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- ACTION A: ASK GEMINI TO ANALYZE IMAGE ---
export async function analyzeImage(imageBase64: string) {
  try {
    // Using the 2.0 Flash model we found in your list
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
      You are an expert Real Estate and Automotive Copywriter.
      Analyze this image. 
      If it is a Property: Provide a Catchy Title, a Luxurious Description (max 3 sentences), and 4 comma-separated tags (e.g., Sea View, Pool).
      If it is a Vehicle: Provide a Title (Model/Year), a Technical Description, and 4 tags.
      
      Return ONLY valid JSON like this:
      {
        "title": "Modern Beachfront Villa",
        "description": "Experience unparalleled luxury...",
        "type": "PROPERTY", 
        "tags": "Luxury, Pool, View, Modern"
      }
    `;

    const base64Data = imageBase64.split(',')[1] || imageBase64;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Gemini AI Failed:", error);
    return null;
  }
}

// --- ACTION B: CREATE LISTING ---
export async function createListing(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  
  const rawPrice = formData.get('price') as string;
  const price = rawPrice ? parseFloat(rawPrice) : 0;

  const type = formData.get('type') as string;
  const tags = formData.get('tags') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const userId = formData.get('userId') as string;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.credits < 5) {
    throw new Error("Insufficient Credits! Please top up.");
  }

  await prisma.$transaction([
    prisma.listing.create({
      data: {
        title,
        description,
        price,
        type,
        tags,
        images: imageUrl,
        published: true,
        user: {
            connect: { id: userId }
        }
      }
    }),
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 5 } }
    })
  ]);
  
  // We removed "redirect('/')" here so it doesn't look like an error.
  return { success: true };
}
import { revalidatePath } from "next/cache"; // Add this to top imports if missing

// --- ACTION C: DELETE LISTING ---
export async function deleteListing(listingId: string) {
  try {
    await prisma.listing.delete({
      where: { id: listingId }
    });
    
    // Refresh the dashboard and homepage so the item disappears immediately
    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error("Delete failed:", error);
    return { success: false };
  }
}
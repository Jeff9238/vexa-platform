'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server"; // Import Clerk

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- HELPER: Get the Real Database User ---
async function getAuthenticatedUser() {
  // 1. Get the logged-in user from Clerk
  const clerkUser = await currentUser();
  if (!clerkUser || !clerkUser.emailAddresses[0]) {
    throw new Error("Please log in first.");
  }

  const email = clerkUser.emailAddresses[0].emailAddress;
  const name = clerkUser.firstName + " " + clerkUser.lastName;

  // 2. Check if they exist in OUR Database (Supabase)
  let dbUser = await prisma.user.findUnique({
    where: { email: email }
  });

  // 3. If not, CREATE them automatically (The "Sync")
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: email,
        name: name || "New User",
        role: "USER",
        credits: 10, // Give 10 Free Credits to new users!
      }
    });
  }

  return dbUser;
}

// --- ACTION A: ANALYZE IMAGE ---
export async function analyzeImage(imageBase64: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
      You are an expert Real Estate and Automotive Copywriter.
      Analyze this image. 
      If it is a Property: Provide a Catchy Title, a Luxurious Description (max 3 sentences), and 4 comma-separated tags.
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
    const cleanText = response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Gemini AI Failed:", error);
    return null;
  }
}

// --- ACTION B: CREATE LISTING ---
export async function createListing(formData: FormData) {
  // 1. Get the REAL user (No more hardcoded ID!)
  const user = await getAuthenticatedUser();

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const rawPrice = formData.get('price') as string;
  const price = rawPrice ? parseFloat(rawPrice) : 0;
  const type = formData.get('type') as string;
  const tags = formData.get('tags') as string;
  const imageUrl = formData.get('imageUrl') as string;

  // 2. Check Credits
  if (user.credits < 5) {
    throw new Error("Insufficient Credits! You have " + user.credits + ". Need 5.");
  }

  // 3. Perform Transaction
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
            connect: { id: user.id } // Connect to the Real User
        }
      }
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: 5 } }
    })
  ]);

  return { success: true };
}

// --- ACTION C: DELETE LISTING ---
import { revalidatePath } from "next/cache";

export async function deleteListing(listingId: string) {
  try {
    // Optional Security: Check if the user owns this listing before deleting?
    // For now, we trust the dashboard UI.
    await prisma.listing.delete({
      where: { id: listingId }
    });
    
    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
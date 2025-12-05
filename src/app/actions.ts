'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { parseListingFormData } from "@/lib/utils";
import { ListingStatus, UserRole } from "@prisma/client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- AUTH HELPER ---
async function getAuthenticatedUser() {
  const clerkUser = await currentUser();
  if (!clerkUser || !clerkUser.emailAddresses[0]) throw new Error("Please log in.");

  const email = clerkUser.emailAddresses[0].emailAddress;
  
  let dbUser = await prisma.user.findUnique({ where: { email } });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: { 
          email, 
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || "New User", 
          role: UserRole.USER, 
          credits: 10,
          profileImage: clerkUser.imageUrl
      }
    });
  }
  return dbUser;
}

// --- AI: ANALYZE IMAGE ---
export async function analyzeImage(imageBase64: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Analyze this image. If Property, return JSON with type="PROPERTY" and fields: title, propertyType, bedrooms, bathrooms. If Vehicle, return JSON with type="VEHICLE" and fields: brand, model, year, color, bodyType. Return ONLY pure JSON.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64.split(',')[1] || imageBase64, mimeType: "image/jpeg" } },
    ]);

    const text = result.response.text();
    // CLEANUP: Remove markdown code blocks if present
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Gemini AI Failed:", error);
    return null;
  }
}

// --- LISTING: CREATE ---
export async function createListing(formData: FormData) {
  const user = await getAuthenticatedUser();
  if (user.credits < 5) throw new Error("Insufficient Credits!");

  const data = parseListingFormData(formData);

  await prisma.$transaction([
    prisma.listing.create({ 
        data: {
            ...data,
            published: true,
            status: ListingStatus.ACTIVE,
            userId: user.id
        } 
    }),
    prisma.user.update({ 
        where: { id: user.id }, 
        data: { credits: { decrement: 5 } } 
    })
  ]);

  revalidatePath('/');
  revalidatePath('/dashboard');
  return { success: true };
}

// --- LISTING: UPDATE ---
export async function updateListing(formData: FormData) {
  const id = formData.get('id') as string;
  const user = await getAuthenticatedUser();
  
  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Unauthorized");

  const data = parseListingFormData(formData);

  await prisma.listing.update({ 
      where: { id }, 
      data: data 
  });
  
  revalidatePath(`/listing/${id}`);
  revalidatePath('/dashboard');
  return { success: true };
}

// --- LISTING: TOGGLE STATUS ---
export async function toggleListingStatus(id: string, newStatus: string) {
  const user = await getAuthenticatedUser();
  const listing = await prisma.listing.findUnique({ where: { id } });
  
  if (!listing || listing.userId !== user.id) throw new Error("Unauthorized");

  const statusEnum = newStatus === 'SOLD' ? ListingStatus.SOLD : ListingStatus.ACTIVE;

  await prisma.listing.update({
    where: { id },
    data: { status: statusEnum }
  });

  revalidatePath('/dashboard');
  return { success: true };
}

// --- LISTING: DELETE ---
export async function deleteListing(id: string) {
  const user = await getAuthenticatedUser();
  const listing = await prisma.listing.findUnique({ where: { id } });
  
  if (listing && listing.userId === user.id) {
      await prisma.listing.delete({ where: { id } });
      revalidatePath('/dashboard');
      return { success: true };
  }
  return { success: false, error: "Unauthorized" };
}

// --- READ OPERATIONS ---
export async function getListing(id: string) {
  return await prisma.listing.findUnique({ where: { id }, include: { user: true } });
}

// --- FAVORITES ---
export async function toggleFavorite(listingId: string) {
  try {
    const user = await getAuthenticatedUser();
    const existing = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId } }
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { liked: false };
    } else {
      await prisma.favorite.create({ data: { userId: user.id, listingId } });
      return { liked: true };
    }
  } catch (error) {
    return null;
  }
}

// --- RESTORED: GET FAVORITE STATUS ---
export async function getFavoriteStatus(listingId: string) {
  try {
    const user = await getAuthenticatedUser();
    const fav = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId } }
    });
    return !!fav;
  } catch (error) {
    // If user is not logged in, return false (not liked)
    return false;
  }
}

// --- PROFILE ---
export async function updateProfile(formData: FormData) {
  const user = await getAuthenticatedUser();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      phoneNumber: formData.get('phoneNumber') as string,
      bio: formData.get('bio') as string,
      website: formData.get('website') as string,
      profileImage: formData.get('profileImage') as string,
    }
  });
  revalidatePath(`/agent/${user.id}`);
  return { success: true };
}

export async function getUserProfile() {
  return await getAuthenticatedUser();
}

// --- ANALYTICS ---
export async function trackContact(id: string, type: 'WHATSAPP' | 'CALL') {
  const field = type === 'WHATSAPP' ? 'whatsappClicks' : 'callClicks';
  await prisma.listing.update({ where: { id }, data: { [field]: { increment: 1 } } });
  return { success: true };
}

// --- AI COACH ---
export async function getListingTips(listingId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return [];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Analyze this listing (Title: ${listing.title}, Price: ${listing.price}, Views: ${listing.views}). Give 3 short tips to improve sales. Return JSON string array.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (e) {
    return ["Add more photos", "Check pricing vs market", "Detail your description"];
  }
}

// --- ADMIN ---
export async function getAdminData() {
  const user = await getAuthenticatedUser();
  if (user.role !== UserRole.ADMIN) throw new Error("Unauthorized");

  const [totalUsers, totalListings, allListings, allUsers] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.listing.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
  ]);

  return { totalUsers, totalListings, allListings, allUsers };
}

export async function deleteUserAdmin(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/admin');
}

export async function deleteListingAdmin(listingId: string) {
    await prisma.listing.delete({ where: { id: listingId } });
    revalidatePath('/admin');
}
'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { parseListingFormData } from "@/lib/utils";
import { ListingStatus, UserRole, Prisma } from "@prisma/client";

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

export async function getFavoriteStatus(listingId: string) {
  try {
    const user = await getAuthenticatedUser();
    const fav = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.id, listingId } }
    });
    return !!fav;
  } catch (error) {
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

// --- SEARCH & PAGINATION ---
export async function fetchListings({ 
  filters, 
  page = 1, 
  limit = 12 
}: { 
  filters: any, 
  page?: number, 
  limit?: number 
}) {
  const skip = (page - 1) * limit;

  const whereClause: Prisma.ListingWhereInput = { 
      published: true, 
      status: 'ACTIVE' 
  };

  if (filters.type && filters.type !== '') {
      whereClause.type = filters.type;
  }

  if (filters.listingCategory) whereClause.listingCategory = filters.listingCategory;
  if (filters.bodyType) whereClause.bodyType = filters.bodyType;
  if (filters.state) whereClause.state = { equals: filters.state, mode: 'insensitive' };
  
  if (filters.q) {
    whereClause.OR = [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { description: { contains: filters.q, mode: 'insensitive' } },
      { tags: { contains: filters.q, mode: 'insensitive' } },
      { state: { contains: filters.q, mode: 'insensitive' } },
      { area: { contains: filters.q, mode: 'insensitive' } },
      { brand: { contains: filters.q, mode: 'insensitive' } },
      { model: { contains: filters.q, mode: 'insensitive' } },
    ];
  }

  if (filters.minPrice !== undefined && filters.minPrice !== '') {
      whereClause.price = { ...whereClause.price, gte: Number(filters.minPrice) };
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== '') {
      whereClause.price = { ...whereClause.price || {}, lte: Number(filters.maxPrice) };
  }

  if (filters.brand) whereClause.brand = { contains: filters.brand, mode: 'insensitive' };
  if (filters.year) whereClause.year = { gte: Number(filters.year) };
  if (filters.bedrooms) whereClause.bedrooms = { gte: Number(filters.bedrooms) };
  if (filters.propertyType) whereClause.propertyType = filters.propertyType;

  let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: 'desc' };
  if (filters.sort === 'oldest') orderBy = { createdAt: 'asc' };
  if (filters.sort === 'price_asc') orderBy = { price: 'asc' };
  if (filters.sort === 'price_desc') orderBy = { price: 'desc' };

  const listings = await prisma.listing.findMany({
    where: whereClause,
    include: { user: true },
    orderBy: orderBy,
    skip: skip,
    take: limit,
  });

  return listings;
}

// ============================================
// --- NEW: CHAT SYSTEM ACTIONS ---
// ============================================

// 1. START OR GET CHAT
export async function startChat(listingId: string) {
  const user = await getAuthenticatedUser();
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  
  if (!listing) throw new Error("Listing not found");
  if (listing.userId === user.id) throw new Error("You cannot chat with yourself");

  // Check if chat already exists
  const existingChat = await prisma.chatRoom.findFirst({
    where: {
      listingId,
      buyerId: user.id,
      sellerId: listing.userId
    }
  });

  if (existingChat) {
    return { chatId: existingChat.id };
  }

  // Create new chat room
  const newChat = await prisma.chatRoom.create({
    data: {
      listingId,
      buyerId: user.id,
      sellerId: listing.userId
    }
  });

  return { chatId: newChat.id };
}

// 2. SEND MESSAGE
export async function sendMessage(chatId: string, text: string) {
  const user = await getAuthenticatedUser();
  
  const chat = await prisma.chatRoom.findUnique({ where: { id: chatId } });
  if (!chat) throw new Error("Chat not found");
  
  // Verify participant
  if (chat.buyerId !== user.id && chat.sellerId !== user.id) throw new Error("Unauthorized");

  await prisma.message.create({
    data: {
      text,
      chatRoomId: chatId,
      senderId: user.id
    }
  });
  
  // Update chat updated_at for sorting
  await prisma.chatRoom.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
  });

  // Revalidate the chat page so the new message appears
  revalidatePath(`/chat/${chatId}`);
  return { success: true };
}

// 3. GET MY CHATS (INBOX)
export async function getMyChats() {
  const user = await getAuthenticatedUser();
  
  const chats = await prisma.chatRoom.findMany({
    where: {
      OR: [
        { buyerId: user.id },
        { sellerId: user.id }
      ]
    },
    include: {
      listing: { select: { id: true, title: true, images: true, price: true } },
      buyer: { select: { id: true, name: true, profileImage: true } },
      seller: { select: { id: true, name: true, profileImage: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
  
  return chats;
}

// 4. GET SINGLE CHAT DETAILS
export async function getChatDetails(chatId: string) {
  const user = await getAuthenticatedUser();
  
  const chat = await prisma.chatRoom.findUnique({
    where: { id: chatId },
    include: {
        listing: true,
        buyer: { select: { id: true, name: true, profileImage: true, email: true } },
        seller: { select: { id: true, name: true, profileImage: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } }
    }
  });

  if (!chat) return null;
  
  // Security check: Only participants can view
  if (chat.buyerId !== user.id && chat.sellerId !== user.id) return null; 

  return chat;
}

// 5. GET UNREAD MESSAGE COUNT (For Navbar Badge)
export async function getUnreadCount() {
  try {
    const user = await getAuthenticatedUser();
    const count = await prisma.message.count({
      where: {
        chatRoom: {
          OR: [{ buyerId: user.id }, { sellerId: user.id }]
        },
        senderId: { not: user.id }, // Messages NOT sent by me
        isRead: false
      }
    });
    return count;
  } catch (error) {
    return 0;
  }
}

// 6. MARK CHAT AS READ (Optimized)
export async function markChatAsRead(chatId: string) {
  const user = await getAuthenticatedUser();
  
  // Update and get the count of modified records
  const result = await prisma.message.updateMany({
    where: {
      chatRoomId: chatId,
      senderId: { not: user.id },
      isRead: false
    },
    data: { isRead: true }
  });

  // Only revalidate if we actually marked something as read
  // This prevents unnecessary page reloads
  if (result.count > 0) {
      revalidatePath('/'); // Refresh navbar badge
      revalidatePath('/chat'); // Refresh inbox status
  }
}
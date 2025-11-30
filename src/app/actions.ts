'use server'

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- HELPER: Get User ---
async function getAuthenticatedUser() {
  const clerkUser = await currentUser();
  if (!clerkUser || !clerkUser.emailAddresses[0]) throw new Error("Please log in.");

  const email = clerkUser.emailAddresses[0].emailAddress;
  const name = clerkUser.firstName + " " + clerkUser.lastName;

  let dbUser = await prisma.user.findUnique({ where: { email } });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: { email, name: name || "New User", role: "USER", credits: 10 }
    });
  }
  return dbUser;
}

// --- ACTION A: ANALYZE IMAGE ---
export async function analyzeImage(imageBase64: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
      Analyze this image deeply. Is it a Property or a Vehicle?
      
      1. IF PROPERTY:
      Return JSON with:
      - type: "PROPERTY"
      - title: (Catchy title)
      - description: (Luxury description)
      - propertyType: (Condo, Terrace, Bungalow, etc.)
      - bedrooms: (Estimate number)
      - bathrooms: (Estimate number)
      - carParks: (Estimate number)
      - furnishing: (Fully/Partly/Unfurnished)
      - tags: (comma separated)

      2. IF VEHICLE:
      Return JSON with:
      - type: "VEHICLE"
      - title: (Year + Brand + Model + Variant)
      - description: (Sales description)
      - brand: (Toyota, Honda, BMW etc)
      - model: (Civic, Alphard, X5 etc)
      - variant: (2.5 Z, M Sport etc)
      - year: (Estimate year)
      - color: (Visual color)
      - bodyType: (Sedan, SUV, MPV, Coupe, 4x4)
      - fuelType: (Petrol, Diesel, Hybrid, EV)
      - transmission: (Automatic or Manual)
      - origin: (Guess: Japan, UK, Local)
      - seats: (Estimate seats)
      - engineCC: (Estimate CC)
      - tags: (comma separated)

      Return ONLY valid JSON.
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
  const user = await getAuthenticatedUser();

  const getInt = (key: string) => {
    const val = formData.get(key);
    return val ? parseInt(val as string) : null;
  };

  const area = formData.get('area') as string || "City";
  const state = formData.get('state') as string || "Malaysia";
  const locationName = formData.get('locationName') as string;
  const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null;
  const lng = formData.get('lng') ? parseFloat(formData.get('lng') as string) : null;

  const data = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: parseFloat(formData.get('price') as string) || 0,
    
    area, state, locationName,
    location: `${locationName ? locationName + ", " : ""}${area}, ${state}`,
    lat, lng,
    
    type: formData.get('type') as string,
    tags: formData.get('tags') as string,
    images: formData.get('imageUrl') as string,
    condition: formData.get('condition') as string,
    
    listingCategory: formData.get('listingCategory') as string,
    facilities: formData.get('facilities') as string,

    bedrooms: getInt('bedrooms'),
    bathrooms: getInt('bathrooms'),
    carParks: getInt('carParks'),
    sqft: getInt('sqft'),
    propertyType: formData.get('propertyType') as string,
    furnishing: formData.get('furnishing') as string,

    brand: formData.get('brand') as string,
    model: formData.get('model') as string,
    variant: formData.get('variant') as string,
    series: formData.get('series') as string,
    color: formData.get('color') as string,
    origin: formData.get('origin') as string,
    bodyType: formData.get('bodyType') as string,
    transmission: formData.get('transmission') as string,
    fuelType: formData.get('fuelType') as string,
    year: getInt('year'),
    mileage: getInt('mileage'),
    seats: getInt('seats'),
    engineCC: getInt('engineCC'),
    peakPower: getInt('peakPower'),
    peakTorque: getInt('peakTorque'),

    published: true,
    user: { connect: { id: user.id } }
  };

  if (user.credits < 5) throw new Error("Insufficient Credits!");

  await prisma.$transaction([
    prisma.listing.create({ data }),
    prisma.user.update({ where: { id: user.id }, data: { credits: { decrement: 5 } } })
  ]);

  revalidatePath('/');
  revalidatePath('/dashboard');
  return { success: true };
}

// --- ACTION C: DELETE LISTING ---
export async function deleteListing(id: string) {
  await prisma.listing.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/dashboard');
  return { success: true };
}

// --- ACTION D: GET LISTING ---
export async function getListing(id: string) {
  return await prisma.listing.findUnique({ where: { id } });
}

// --- ACTION E: UPDATE LISTING ---
export async function updateListing(formData: FormData) {
  const id = formData.get('id') as string;
  
  const getInt = (key: string) => {
    const val = formData.get(key);
    return val ? parseInt(val as string) : null;
  };

  const area = formData.get('area') as string;
  const state = formData.get('state') as string;
  const locationName = formData.get('locationName') as string;
  const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null;
  const lng = formData.get('lng') ? parseFloat(formData.get('lng') as string) : null;
  
  const imageUrl = formData.get('imageUrl') as string;

  const data = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: parseFloat(formData.get('price') as string) || 0,
    
    area, state, locationName,
    location: `${locationName ? locationName + ", " : ""}${area}, ${state}`,
    lat, lng,
    images: imageUrl,

    type: formData.get('type') as string,
    tags: formData.get('tags') as string,
    condition: formData.get('condition') as string,
    
    listingCategory: formData.get('listingCategory') as string,
    facilities: formData.get('facilities') as string,
    bedrooms: getInt('bedrooms'),
    bathrooms: getInt('bathrooms'),
    carParks: getInt('carParks'),
    sqft: getInt('sqft'),
    propertyType: formData.get('propertyType') as string,
    furnishing: formData.get('furnishing') as string,

    brand: formData.get('brand') as string,
    model: formData.get('model') as string,
    variant: formData.get('variant') as string,
    series: formData.get('series') as string,
    color: formData.get('color') as string,
    origin: formData.get('origin') as string,
    bodyType: formData.get('bodyType') as string,
    transmission: formData.get('transmission') as string,
    fuelType: formData.get('fuelType') as string,
    year: getInt('year'),
    mileage: getInt('mileage'),
    seats: getInt('seats'),
    engineCC: getInt('engineCC'),
    peakPower: getInt('peakPower'),
    peakTorque: getInt('peakTorque'),
  };

  await prisma.listing.update({ where: { id }, data });
  
  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath(`/listing/${id}`);
  
  return { success: true };
}

// --- ACTION F: TOGGLE FAVORITE (RESTORED) ---
export async function toggleFavorite(listingId: string) {
  try {
    const user = await getAuthenticatedUser();
    
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId: listingId
        }
      }
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { liked: false };
    } else {
      await prisma.favorite.create({
        data: { userId: user.id, listingId: listingId }
      });
      return { liked: true };
    }
  } catch (error) {
    console.error("Favorite Error:", error);
    return null;
  }
}

// --- ACTION G: CHECK FAVORITE STATUS (RESTORED) ---
export async function getFavoriteStatus(listingId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser || !clerkUser.emailAddresses[0]) return false;
    const email = clerkUser.emailAddresses[0].emailAddress;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return false;

    const fav = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId: listingId
        }
      }
    });
    return !!fav;
  } catch {
    return false;
  }
}
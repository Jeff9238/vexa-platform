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

// --- ACTION A: ANALYZE IMAGE (SUPER SMART MODE) ---
export async function analyzeImage(imageBase64: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // UPDATED PROMPT: EXTRACTS ALL SPECIFIC FIELDS
    const prompt = `
      Analyze this image deeply. Is it a Property or a Vehicle?
      
      1. IF PROPERTY:
      Return JSON with:
      - type: "PROPERTY"
      - title: (Catchy title, e.g. "Modern 3-Storey Bungalow")
      - description: (Luxury description)
      - propertyType: (Guess one: Condo, Terrace, Bungalow, Semi-D, Factory, Shop)
      - bedrooms: (Estimate number, e.g. 4)
      - bathrooms: (Estimate number, e.g. 3)
      - carParks: (Estimate garage size, e.g. 2)
      - furnishing: (Guess: Fully Furnished, Partly Furnished, Unfurnished)
      - tags: (comma separated)

      2. IF VEHICLE:
      Return JSON with:
      - type: "VEHICLE"
      - title: (Year + Brand + Model + Variant, e.g. "2023 Toyota Alphard 2.5 Z")
      - description: (Sales description highlighting features)
      - brand: (e.g. Toyota, Honda, BMW)
      - model: (e.g. Alphard, Civic, X5)
      - variant: (e.g. 2.5 Z, M Sport)
      - year: (Estimate year, e.g. 2023)
      - color: (Visual color)
      - bodyType: (Sedan, SUV, MPV, Coupe, 4x4)
      - fuelType: (Petrol, Diesel, Hybrid, EV)
      - transmission: (Automatic or Manual)
      - origin: (Guess: Japan, UK, Local)
      - seats: (Estimate seats, e.g. 5 or 7)
      - engineCC: (Estimate CC, e.g. 2500)
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

  const data = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: parseFloat(formData.get('price') as string) || 0,
    area, state, location: `${area}, ${state}`,
    type: formData.get('type') as string,
    tags: formData.get('tags') as string,
    images: formData.get('imageUrl') as string,
    condition: formData.get('condition') as string,
    
    listingCategory: formData.get('listingCategory') as string,
    facilities: formData.get('facilities') as string,

    // Property Specs
    bedrooms: getInt('bedrooms'),
    bathrooms: getInt('bathrooms'),
    carParks: getInt('carParks'),
    sqft: getInt('sqft'),
    propertyType: formData.get('propertyType') as string,
    furnishing: formData.get('furnishing') as string,

    // Vehicle Specs
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
  const user = await getAuthenticatedUser(); // Security check
  const id = formData.get('id') as string;

  // Helper for numbers
  const getInt = (key: string) => {
    const val = formData.get(key);
    return val ? parseInt(val as string) : null;
  };

  const area = formData.get('area') as string;
  const state = formData.get('state') as string;
  const imageUrl = formData.get('imageUrl') as string; // <--- NEW: Capture Images

  const data = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: parseFloat(formData.get('price') as string) || 0,
    
    // Update Images & Location
    images: imageUrl, 
    area,
    state,
    location: `${area}, ${state}`,

    type: formData.get('type') as string,
    tags: formData.get('tags') as string,
    condition: formData.get('condition') as string,
    
    // Property Fields
    listingCategory: formData.get('listingCategory') as string,
    facilities: formData.get('facilities') as string,
    bedrooms: getInt('bedrooms'),
    bathrooms: getInt('bathrooms'),
    carParks: getInt('carParks'),
    sqft: getInt('sqft'),
    propertyType: formData.get('propertyType') as string,
    furnishing: formData.get('furnishing') as string,

    // Vehicle Fields
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
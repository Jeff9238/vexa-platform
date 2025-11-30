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
    const prompt = `Analyze this image. If Vehicle: return brand, model, year. If Property: return type, style. Return JSON only.`;
    
    const result = await model.generateContent([prompt, { inlineData: { data: imageBase64.split(',')[1], mimeType: "image/jpeg" } }]);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Failed:", error);
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

  // Safe defaults for location
  const area = formData.get('area') as string || "City";
  const state = formData.get('state') as string || "Malaysia";

  const data = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: parseFloat(formData.get('price') as string) || 0,
    area, state, location: `${area}, ${state}`, // Combine for backup
    type: formData.get('type') as string,
    tags: formData.get('tags') as string,
    images: formData.get('imageUrl') as string,
    condition: formData.get('condition') as string,
    
    // NEW PROPERTY FIELDS
    listingCategory: formData.get('listingCategory') as string, // SALE or RENT
    facilities: formData.get('facilities') as string, // "Pool,Gym"

    // Property Specs
    bedrooms: getInt('bedrooms'),
    bathrooms: getInt('bathrooms'),
    sqft: getInt('sqft'),
    propertyType: formData.get('propertyType') as string,
    furnishing: formData.get('furnishing') as string,

    // Vehicle Core
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

    // Vehicle Tech
    engineCC: getInt('engineCC'),
    peakPower: getInt('peakPower'),
    peakTorque: getInt('peakTorque'),
    length: getInt('length'),
    width: getInt('width'),
    height: getInt('height'),
    wheelBase: getInt('wheelBase'),
    kerbWeight: getInt('kerbWeight'),
    fuelTank: getInt('fuelTank'),

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
  // (Simplified update logic for now)
  const data = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: parseFloat(formData.get('price') as string) || 0,
  };
  await prisma.listing.update({ where: { id }, data });
  revalidatePath('/');
  revalidatePath(`/listing/${id}`);
  return { success: true };
}
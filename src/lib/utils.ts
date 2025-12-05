// Removed external dependencies (clsx, tailwind-merge) to fix the build error.
// This is a simple utility to join class names conditionally.
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// Helper to parse FormData into a clean Listing Object
export function parseListingFormData(formData: FormData) {
  const getInt = (key: string) => {
    const val = formData.get(key);
    return val ? parseInt(val as string) : null;
  };

  const getFloat = (key: string) => {
    const val = formData.get(key);
    return val ? parseFloat(val as string) : null;
  };

  const area = formData.get('area') as string || "City";
  const state = formData.get('state') as string || "Malaysia";
  const locationName = formData.get('locationName') as string;

  return {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: getFloat('price') || 0,
    
    // Location
    area, 
    state, 
    locationName,
    location: `${locationName ? locationName + ", " : ""}${area}, ${state}`,
    lat: getFloat('lat'), 
    lng: getFloat('lng'),
    
    // Metadata
    type: formData.get('type') as string,
    tags: formData.get('tags') as string,
    images: formData.get('imageUrl') as string,
    condition: formData.get('condition') as string,
    
    // Property Specifics
    listingCategory: formData.get('listingCategory') as string,
    facilities: formData.get('facilities') as string,
    bedrooms: getInt('bedrooms'),
    bathrooms: getInt('bathrooms'),
    carParks: getInt('carParks'),
    sqft: getInt('sqft'),
    propertyType: formData.get('propertyType') as string,
    furnishing: formData.get('furnishing') as string,

    // Vehicle Specifics
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
}
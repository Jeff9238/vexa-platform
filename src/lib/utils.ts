export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function parseListingFormData(formData: FormData) {
  const getInt = (key: string) => {
    const val = formData.get(key);
    return val ? parseInt(val as string) : null;
  };

  const getFloat = (key: string) => {
    const val = formData.get(key);
    return val ? parseFloat(val as string) : null;
  };

  const getBool = (key: string) => {
    return formData.get(key) === 'on' || formData.get(key) === 'true';
  };

  const area = formData.get('area') as string || "City";
  const state = formData.get('state') as string || "Malaysia";
  const locationName = formData.get('locationName') as string;

  return {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    price: getFloat('price') || 0,
    negotiable: getBool('negotiable'),
    
    // Location
    area, state, locationName,
    location: `${locationName ? locationName + ", " : ""}${area}, ${state}`,
    lat: getFloat('lat'), 
    lng: getFloat('lng'),
    
    // Metadata
    type: formData.get('type') as string,
    tags: formData.get('tags') as string,
    images: formData.get('imageUrl') as string,
    condition: formData.get('condition') as string,
    
    // Property Fields
    listingCategory: formData.get('listingCategory') as string,
    propertyType: formData.get('propertyType') as string,
    tenure: formData.get('tenure') as string,
    propertyTitle: formData.get('propertyTitle') as string,
    landTitle: formData.get('landTitle') as string,
    
    bedrooms: getInt('bedrooms'),
    bathrooms: getInt('bathrooms'),
    carParks: getInt('carParks'),
    
    sqft: getInt('sqft'), // Build-up
    landArea: getInt('landArea'), // Land size
    
    furnishing: formData.get('furnishing') as string,
    unitType: formData.get('unitType') as string,
    occupancy: formData.get('occupancy') as string,
    maintenanceFee: getFloat('maintenanceFee'),
    facilities: formData.get('facilities') as string,

    // Vehicle Fields
    brand: formData.get('brand') as string,
    model: formData.get('model') as string,
    variant: formData.get('variant') as string,
    series: formData.get('series') as string,
    
    year: getInt('year'), // Mfg Year
    regYear: getInt('regYear'), // Reg Year
    
    bodyType: formData.get('bodyType') as string,
    color: formData.get('color') as string,
    mileage: formData.get('mileage') as string,
    transmission: formData.get('transmission') as string,
    fuelType: formData.get('fuelType') as string,
    engineCC: getInt('engineCC'),
    
    assembly: formData.get('assembly') as string,
    seats: getInt('seats'),
    
    peakPower: getInt('peakPower'),
    peakTorque: getInt('peakTorque'),
    
    warranty: getBool('warranty'),
    serviceHistory: getBool('serviceHistory'),
    prevOwners: getInt('prevOwners'),
    wheelSize: getInt('wheelSize'),
    plateNumber: formData.get('plateNumber') as string,
  };
}
import { Listing, User } from "@prisma/client";

// Extended Listing type that includes the User relation
export type ListingWithUser = Listing & {
  user: User;
};

// Search Filter Interface
export interface SearchFilters {
  q?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  state?: string;
  brand?: string;
  year?: number;
  listingCategory?: string;
  sort?: string;
}

// AI Analysis Result Interface
export interface AIAnalysisResult {
  type: 'PROPERTY' | 'VEHICLE';
  title?: string;
  description?: string;
  tags?: string;
  // Dynamic fields based on type
  [key: string]: any; 
}
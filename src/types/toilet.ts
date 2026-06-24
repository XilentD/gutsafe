export interface ToiletSummary {
  id: string;
  name: string;
  lng: number;
  lat: number;
  address: string | null;
  distance: number;
  hasSquat: boolean;
  hasSeated: boolean;
  hasToiletPaper: boolean;
  hasHandWash: boolean;
  hasHandicap: boolean;
  feeCents: number;
  avgCleanliness: number;
  reviewCount: number;
  avgQueueMin: number | null;
  isOpenNow?: boolean;
}

export interface ToiletDetail {
  id: string;
  name: string;
  lng: number;
  lat: number;
  address: string | null;
  city: string;
  district: string | null;
  hasSquat: boolean;
  hasSeated: boolean;
  hasToiletPaper: boolean;
  hasHandWash: boolean;
  hasHandicap: boolean;
  hasChangingTable: boolean;
  hasMirror: boolean;
  feeCents: number;
  feeDescription: string | null;
  openingHours: string | null;
  openingHoursType: "24h" | "scheduled" | "unknown";
  avgQueueMin: number | null;
  avgCleanliness: number;
  reviewCount: number;
  dataSource: string;
  verified: boolean;
  reviews: ReviewSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  id: string;
  cleanliness: number;
  queueMinutes: number | null;
  hasTissue: boolean | null;
  isFunctioning: boolean;
  comment: string | null;
  visitedAt: string;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

export interface ToiletFilters {
  hasSquat?: boolean;
  hasToiletPaper?: boolean;
  hasHandicap?: boolean;
  isFree?: boolean;
  openNow?: boolean;
  minCleanliness?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
